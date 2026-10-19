/**
 * Module 3.4: B2B Bulk Endpoint (/api/v2/order) & Reseller Documentation
 * High-performance wholesale API endpoint supporting high-concurrency batch orders,
 * API Key header authentication, database isolation, and detailed developer technical docs.
 */
import { Request, Response } from 'express';
import { db } from '../db';
import { BulkOrderItemPayload, BulkOrderResponse, User } from '../../types';

/**
 * Controller: POST /api/v2/order
 * B2B Bulk Order Ingestion Engine
 */
export async function b2bBulkOrderHandler(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  try {
    // 1. Authenticate via Header (X-API-Key or Bearer token) or Body
    const apiKey = 
      (req.headers['x-api-key'] as string) || 
      (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : '') || 
      req.body.key || 
      req.body.api_key;

    if (!apiKey) {
      res.status(401).json({
        status: 'error',
        error_code: 'ERR_UNAUTHORIZED',
        message: "Missing API Key. Provide via 'X-API-Key' header or 'key' parameter."
      });
      return;
    }

    const user: User | undefined = db.findUserByApiKey(apiKey);
    if (!user) {
      res.status(403).json({
        status: 'error',
        error_code: 'ERR_INVALID_API_KEY',
        message: 'The provided API Key is invalid or has been revoked.'
      });
      return;
    }

    // 2. Parse payload (Supports either single order object or bulk JSON array)
    let rawItems: BulkOrderItemPayload[] = [];
    if (Array.isArray(req.body.orders)) {
      rawItems = req.body.orders;
    } else if (Array.isArray(req.body)) {
      rawItems = req.body;
    } else if (req.body.action === 'add' || req.body.service) {
      // Standard SMM v2 protocol compatibility: { key, action: 'add', service, link, quantity, runs, interval }
      rawItems = [{
        service_id: String(req.body.service || req.body.service_id),
        link: String(req.body.link || req.body.target_url),
        quantity: parseInt(String(req.body.quantity), 10),
        runs: req.body.runs ? parseInt(String(req.body.runs), 10) : undefined,
        interval: req.body.interval ? parseInt(String(req.body.interval), 10) : undefined
      }];
    } else if (req.body.service_id && req.body.link) {
      rawItems = [req.body];
    }

    if (rawItems.length === 0) {
      res.status(400).json({
        status: 'error',
        error_code: 'ERR_EMPTY_PAYLOAD',
        message: "No orders found in payload. Pass array of order objects or standard SMM v2 'action=add' fields."
      });
      return;
    }

    if (rawItems.length > 500) {
      res.status(400).json({
        status: 'error',
        error_code: 'ERR_BATCH_LIMIT_EXCEEDED',
        message: 'Maximum batch size is 500 orders per request.'
      });
      return;
    }

    // 3. Process orders with transactional balance isolation
    const successfulOrders: BulkOrderResponse['successful_orders'] = [];
    const failedOrders: BulkOrderResponse['failed_orders'] = [];
    let totalBatchCharge = 0;

    // First pass: validate all items and calculate required capital
    const validatedBatches: Array<{
      item: BulkOrderItemPayload;
      service: any;
      charge: number;
    }> = [];

    for (const item of rawItems) {
      const serviceId = item.service_id;
      const targetUrl = item.link;
      const qty = parseInt(String(item.quantity), 10);

      if (!serviceId || !targetUrl || isNaN(qty) || qty <= 0) {
        failedOrders.push({
          service_id: serviceId || 'UNKNOWN',
          link: targetUrl || '',
          reason: 'Invalid parameters: service_id, link, and positive quantity required.'
        });
        continue;
      }

      const service = db.findServiceById(serviceId);
      if (!service || service.status !== 'active') {
        failedOrders.push({
          service_id: serviceId,
          link: targetUrl,
          reason: `Service ID ${serviceId} does not exist or is inactive.`
        });
        continue;
      }

      if (qty < service.min_quantity || qty > service.max_quantity) {
        failedOrders.push({
          service_id: serviceId,
          link: targetUrl,
          reason: `Quantity ${qty} out of bounds [${service.min_quantity} - ${service.max_quantity}].`
        });
        continue;
      }

      // VIP tier gets 10% wholesale discount
      const tierDiscount = user.tier === 'vip' ? 0.90 : 1.0;
      const charge = Number(((qty / 1000) * service.base_cost_per_1k * tierDiscount).toFixed(4));
      
      validatedBatches.push({
        item,
        service,
        charge
      });
      totalBatchCharge += charge;
    }

    // Check if user has sufficient funds for the valid batch items
    if (user.wallet_balance < totalBatchCharge) {
      res.status(402).json({
        status: 'error',
        error_code: 'ERR_INSUFFICIENT_FUNDS',
        message: `Insufficient wholesale balance. Required: ₦${totalBatchCharge.toFixed(2)}, Available: ₦${user.wallet_balance.toFixed(2)}.`,
        required_balance: totalBatchCharge,
        current_balance: user.wallet_balance
      });
      return;
    }

    // Second pass: atomic execution & queueing
    const batchId = `B2B_BATCH_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    for (const valid of validatedBatches) {
      const { item, service, charge } = valid;
      try {
        // Atomic wallet debit
        db.updateUserBalance(user.id, -charge);

        // Create order
        const createdOrder = db.createOrder({
          store_id: null, // Master wholesale direct
          user_id: user.id,
          target_url: item.link,
          service_id: service.id,
          total_quantity: item.quantity,
          total_charge: charge,
          scheduling_configuration: item.runs && item.runs > 1 ? {
            is_drip: true,
            runs: item.runs,
            interval_minutes: item.interval || 60,
            quantity_per_run: Math.floor(item.quantity / item.runs)
          } : undefined
        });

        successfulOrders.push({
          order_id: createdOrder.id,
          service_id: service.id,
          quantity: item.quantity,
          charge: charge,
          status: createdOrder.execution_status,
          tracking_id: createdOrder.tracking_provider_order_id || 'PENDING'
        });
      } catch (err: any) {
        failedOrders.push({
          service_id: item.service_id,
          link: item.link,
          reason: err.message || 'Failed during execution queueing.'
        });
      }
    }

    const durationMs = Date.now() - startTime;
    res.setHeader('X-Response-Time-Ms', durationMs);

    // If single order was submitted via standard SMM v2 protocol, support legacy return `{ order: ID }`
    if (req.body.action === 'add' && successfulOrders.length === 1 && failedOrders.length === 0) {
      res.status(200).json({
        order: successfulOrders[0].order_id,
        tracking_id: successfulOrders[0].tracking_id,
        charge: successfulOrders[0].charge,
        balance: user.wallet_balance
      });
      return;
    }

    const response: BulkOrderResponse = {
      batch_id: batchId,
      total_submitted: rawItems.length,
      successful_orders: successfulOrders,
      failed_orders: failedOrders,
      total_debited: Number(totalBatchCharge.toFixed(4)),
      remaining_wallet_balance: user.wallet_balance
    };

    res.status(200).json({
      status: 'success',
      data: response,
      meta: {
        execution_time_ms: durationMs,
        user_tier: user.tier
      }
    });
  } catch (error: any) {
    console.error('[B2B Bulk Order Error]:', error);
    res.status(500).json({
      status: 'error',
      error_code: 'ERR_INTERNAL_SERVER',
      message: error.message || 'An internal error occurred during bulk order ingestion.'
    });
  }
}

/**
 * Controller: GET /api/v2/services
 * Reseller Catalog Listing endpoint
 */
export async function b2bServicesHandler(req: Request, res: Response): Promise<void> {
  try {
    const services = db.getMasterServices().filter(s => s.status === 'active');
    res.status(200).json(services.map(s => ({
      service: s.id,
      name: s.service_name,
      type: 'Default',
      category: s.category,
      rate: s.base_cost_per_1k,
      min: s.min_quantity,
      max: s.max_quantity,
      dripfeed: true,
      refill: true
    })));
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}

/**
 * Controller: GET /api/v2/balance
 * Reseller Wallet balance check
 */
export async function b2bBalanceHandler(req: Request, res: Response): Promise<void> {
  try {
    const apiKey = (req.headers['x-api-key'] as string) || req.query.key as string;
    const user = apiKey ? db.findUserByApiKey(apiKey) : db.getUsers().find(u => u.role === 'reseller');

    if (!user) {
      res.status(401).json({ status: 'error', message: 'Invalid API Key' });
      return;
    }

    res.status(200).json({
      balance: user.wallet_balance,
      currency: 'NGN',
      tier: user.tier
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}

/**
 * Controller: GET /api/v2/docs
 * Developer Technical Markdown Documentation
 */
export async function b2bDocsHandler(req: Request, res: Response): Promise<void> {
  const docsMarkdown = `# NexusPulse B2B Wholesaler REST API v2 Specification

## 1. Authentication
All requests must include your unique alphanumeric API Key via one of the following methods:
- **HTTP Header (Recommended)**: \`X-API-Key: your_api_key_here\`
- **Bearer Token**: \`Authorization: Bearer your_api_key_here\`
- **Query / JSON Body**: \`key=your_api_key_here\`

---

## 2. Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | \`/api/v2/order\` | High-concurrency bulk orders or single SMM order ingestion |
| **GET / POST** | \`/api/v2/services\` | Wholesale catalog with real-time base rates & limits |
| **GET / POST** | \`/api/v2/balance\` | Current wallet balance & tier inspection |
| **POST** | \`/api/orders/schedule-drip\` | Automated AI Drip staggered timeline engine |
| **POST** | \`/api/ai/profile-audit\` | Google Gemini 2.5 Flash social audit & checkout catalyst |

---

## 3. High-Throughput Bulk Order Ingestion

### Endpoint: \`POST /api/v2/order\`

#### Request Headers:
\`\`\`http
Content-Type: application/json
X-API-Key: nexus_live_reseller_api_key_8842bc19a7
\`\`\`

#### Bulk Payload Example (JSON Array):
\`\`\`json
{
  "orders": [
    {
      "service_id": "20000000-0000-0000-0000-000000000001",
      "link": "https://instagram.com/influencer_one",
      "quantity": 5000,
      "runs": 5,
      "interval": 60
    },
    {
      "service_id": "20000000-0000-0000-0000-000000000003",
      "link": "https://tiktok.com/@viralvideo99",
      "quantity": 25000
    }
  ]
}
\`\`\`

#### Standard SMM Compatibility Payload:
\`\`\`json
{
  "key": "nexus_live_reseller_api_key_8842bc19a7",
  "action": "add",
  "service": "20000000-0000-0000-0000-000000000001",
  "link": "https://instagram.com/brand_store",
  "quantity": 1000
}
\`\`\`

#### Success Response (200 OK):
\`\`\`json
{
  "status": "success",
  "data": {
    "batch_id": "B2B_BATCH_173000000_9X2A",
    "total_submitted": 2,
    "successful_orders": [
      {
        "order_id": "40000000-0000-0000-0000-000000000001",
        "service_id": "20000000-0000-0000-0000-000000000001",
        "quantity": 5000,
        "charge": 5400.0,
        "status": "processing",
        "tracking_id": "NEXUS_UPSTREAM_ORD_7749129"
      }
    ],
    "failed_orders": [],
    "total_debited": 5400.0,
    "remaining_wallet_balance": 80000.0
  },
  "meta": {
    "execution_time_ms": 42,
    "user_tier": "vip"
  }
}
\`\`\`

---

## 4. Error Codes & Handling

| Error Code | HTTP Status | Cause / Resolution |
| :--- | :--- | :--- |
| \`ERR_UNAUTHORIZED\` | 401 | Missing API Key in header or body |
| \`ERR_INVALID_API_KEY\` | 403 | API key does not match any registered reseller |
| \`ERR_INSUFFICIENT_FUNDS\` | 402 | Wallet balance lower than batch total. Top up balance |
| \`ERR_BATCH_LIMIT_EXCEEDED\` | 400 | Exceeded 500 orders per batch limit |
| \`QUANTITY_OUT_OF_BOUNDS\` | 400 | Quantity below min or above max service thresholds |

---

## 5. Quick Integration Snippets

### cURL
\`\`\`bash
curl -X POST https://api.nexuspulse.io/api/v2/order \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "orders": [
      { "service_id": "20000000-0000-0000-0000-000000000001", "link": "https://instagram.com/demo", "quantity": 1000 }
    ]
  }'
\`\`\`

### Node.js (Axios)
\`\`\`javascript
import axios from 'axios';

const { data } = await axios.post('https://api.nexuspulse.io/api/v2/order', {
  orders: [
    { service_id: '20000000-0000-0000-0000-000000000001', link: 'https://instagram.com/target', quantity: 2000 }
  ]
}, {
  headers: { 'X-API-Key': process.env.NEXUS_API_KEY }
});
console.log(data);
\`\`\`
`;

  res.status(200).json({
    success: true,
    markdown: docsMarkdown
  });
}
