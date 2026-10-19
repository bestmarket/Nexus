/**
 * Express Application Backend
 * NexusPulse SMM Engine API Gateway
 */
import express, { Request, Response, NextFunction } from 'express';
import {
  dynamicDomainRouterMiddleware,
  resolveTenantHandler,
  getAllTenantsHandler
} from './controllers/tenantRouter';
import { profileAuditHandler } from './controllers/aiProfileOptimizer';
import { scheduleDripOrderHandler } from './controllers/smartScheduler';
import {
  b2bBulkOrderHandler,
  b2bServicesHandler,
  b2bBalanceHandler,
  b2bDocsHandler
} from './controllers/b2bBulkOrder';
import { splitSettlementWebhookHandler } from './controllers/splitSettlement';
import {
  getAdminAnalyticsHandler,
  getAdminOrdersHandler,
  getAdminTransactionsHandler,
  getAdminUsersHandler,
  adjustUserBalanceHandler,
  toggleUserTierHandler,
  regenerateUserApiKeyHandler,
  updateStoreHandler,
  createStoreHandler,
  getProviderStatusHandler
} from './controllers/adminController';
import { db } from './db';

const app = express();

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS & Preflight
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Tenant-Domain');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Attach multi-tenant domain routing middleware to all requests
app.use(dynamicDomainRouterMiddleware as any);

// ==========================================
// MODULE 3.1: MULTI-TENANT DOMAIN RESOLVER
// ==========================================
app.get('/api/tenant/resolve', resolveTenantHandler);
app.get('/api/tenant/all', getAllTenantsHandler);

// ==========================================
// MODULE 3.2: GOOGLE AI STUDIO PROFILE OPTIMIZER
// ==========================================
app.post('/api/ai/profile-audit', profileAuditHandler);

// Interactive AI growth strategist consultation
app.post('/api/ai/chat-consultant', async (req: Request, res: Response) => {
  try {
    const { message, platform, target_handle } = req.body;
    if (!message) {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    if (process.env.GEMINI_API_KEY) {
      const { getGeminiClient } = await import('./gemini');
      const ai = getGeminiClient();
      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are an elite SMM Growth Consultant for NexusPulse.
The user is asking: "${message}".
Context: Target handle: ${target_handle || 'general'}, platform: ${platform || 'all'}.
Provide a concise, practical, high-impact growth strategy (2-3 paragraphs) explaining how combining organic engagement signals, retention timing, and targeted audience indexing drives exponential reach.`,
          config: {
            temperature: 0.7
          }
        });
      } catch (e) {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `You are an elite SMM Growth Consultant for NexusPulse.
The user is asking: "${message}".
Context: Target handle: ${target_handle || 'general'}, platform: ${platform || 'all'}.
Provide a concise, practical, high-impact growth strategy (2-3 paragraphs).`,
          config: {
            temperature: 0.7
          }
        });
      }

      res.status(200).json({
        success: true,
        reply: response.text || 'Keep publishing consistent, high-relevance media paired with immediate algorithmic signal catalysts.'
      });
    } else {
      res.status(200).json({
        success: true,
        reply: `For ${platform || 'your account'} (@${target_handle || 'creator'}), algorithm reach requires consistent retention within the first 45 minutes of publishing. Utilizing staggered drip pacing creates authentic velocity signals that evade velocity filters and propel posts to recommended explore feeds.`
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// MODULE 3.3: ADVANCED AI SMART-SCHEDULER & DRIP
// ==========================================
app.post('/api/orders/schedule-drip', scheduleDripOrderHandler);

// ==========================================
// MODULE 3.4: B2B BULK ENDPOINT & DEVELOPER DOCS
// ==========================================
app.post('/api/v2/order', b2bBulkOrderHandler);
app.get('/api/v2/services', b2bServicesHandler);
app.post('/api/v2/services', b2bServicesHandler);
app.get('/api/v2/balance', b2bBalanceHandler);
app.post('/api/v2/balance', b2bBalanceHandler);
app.get('/api/v2/docs', b2bDocsHandler);

// ==========================================
// MODULE 3.5: SPLIT-PAYMENT SETTLEMENT WEBHOOKS
// ==========================================
app.post('/api/webhooks/payment-settlement', splitSettlementWebhookHandler);

// ==========================================
// MODULE 2.1: CORE ADMINISTRATOR COMMAND DECK
// ==========================================
app.get('/api/admin/analytics', getAdminAnalyticsHandler);
app.get('/api/admin/orders', getAdminOrdersHandler);
app.get('/api/admin/transactions', getAdminTransactionsHandler);
app.get('/api/admin/users', getAdminUsersHandler);
app.post('/api/admin/users/balance', adjustUserBalanceHandler);
app.post('/api/admin/users/tier', toggleUserTierHandler);
app.post('/api/admin/users/regenerate-key', regenerateUserApiKeyHandler);
app.put('/api/admin/stores/:store_id', updateStoreHandler);
app.post('/api/admin/stores', createStoreHandler);
app.get('/api/admin/providers', getProviderStatusHandler);

// ==========================================
// RESELLER B2B SHIDE STORE GENERATOR & STORE ADMIN
// ==========================================
// Generate Shide Store for Reseller
app.post('/api/b2b/stores/generate', async (req: Request, res: Response) => {
  try {
    const { owner_id, domain_name, store_name, store_type, theme_settings, default_markup_percent } = req.body;
    if (!owner_id || !domain_name) {
      res.status(400).json({ success: false, message: 'owner_id and domain_name are required' });
      return;
    }

    const defaultTheme = {
      store_name: store_name || `${domain_name.split('.')[0].toUpperCase()} Store`,
      primary_color: theme_settings?.primary_color || '#38bdf8',
      secondary_color: theme_settings?.secondary_color || '#0284c7',
      accent_color: theme_settings?.accent_color || '#0ea5e9',
      currency_symbol: theme_settings?.currency_symbol || '₦',
      currency_code: theme_settings?.currency_code || 'NGN',
      hero_title: theme_settings?.hero_title || `Premier Social Media Services - ${store_name || domain_name}`,
      hero_subtitle: theme_settings?.hero_subtitle || 'High-velocity authentic engagement delivered instantly with AI optimization.',
      support_email: theme_settings?.support_email || `support@${domain_name}`,
      announcement: theme_settings?.announcement || '🚀 Welcome to our official store! Enjoy automated instant order fulfillment.'
    };

    const newStore = db.createStore({
      owner_id,
      domain_name,
      store_type: store_type || 'b2c',
      theme_settings: {
        ...defaultTheme,
        ...(theme_settings || {})
      }
    });

    // If custom markup % was specified, adjust tenant pricing
    if (default_markup_percent && default_markup_percent > 0) {
      const multiplier = 1 + (default_markup_percent / 100);
      const masterServices = db.getMasterServices();
      for (const service of masterServices) {
        const customPrice = Number((service.base_cost_per_1k * multiplier).toFixed(2));
        db.updateTenantPricing(newStore.id, service.id, customPrice);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Shide store generated successfully and connected to master system',
      data: newStore
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Reseller Generated Store
app.put('/api/b2b/stores/:store_id', async (req: Request, res: Response) => {
  try {
    const { store_id } = req.params;
    const updates = req.body;
    const store = db.updateStore(store_id, updates);
    res.status(200).json({ success: true, data: store });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Reseller Store Services & Pricing
app.get('/api/b2b/stores/:store_id/pricing', async (req: Request, res: Response) => {
  try {
    const { store_id } = req.params;
    const services = db.getStoreServicesWithPricing(store_id);
    res.status(200).json({ success: true, data: services });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Single Service Pricing for Reseller Store
app.put('/api/b2b/stores/:store_id/pricing', async (req: Request, res: Response) => {
  try {
    const { store_id } = req.params;
    const { service_id, customized_selling_price_per_1k } = req.body;
    if (!service_id || customized_selling_price_per_1k === undefined) {
      res.status(400).json({ success: false, message: 'service_id and customized_selling_price_per_1k are required' });
      return;
    }
    const updatedPricing = db.updateTenantPricing(store_id, service_id, Number(customized_selling_price_per_1k));
    res.status(200).json({ success: true, data: updatedPricing });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Orders for a specific Reseller Generated Store
app.get('/api/b2b/stores/:store_id/orders', async (req: Request, res: Response) => {
  try {
    const { store_id } = req.params;
    const storeOrders = db.getOrders().filter(o => o.store_id === store_id);
    res.status(200).json({ success: true, data: storeOrders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Utility: export raw SQL schema
app.get('/api/db/schema-sql', async (req: Request, res: Response) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      res.setHeader('Content-Type', 'text/plain');
      res.send(sql);
      return;
    }
    res.status(404).json({ success: false, message: 'schema.sql not found' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    system: 'NexusPulse SMM Engine',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export { app };
