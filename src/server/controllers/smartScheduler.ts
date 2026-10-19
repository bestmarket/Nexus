/**
 * Module 3.3: Advanced AI Smart-Scheduler & Automated Drip Engine
 * Endpoint: POST /api/orders/schedule-drip
 * Processes single orders configured for staggered algorithmic drip execution across days or hours,
 * calculating delivery intervals, batch distribution, and updating internal database matrix.
 */
import { Request, Response } from 'express';
import { db } from '../db';

export interface ScheduleDripRequest {
  service_id: string;
  target_url: string;
  total_quantity: number;
  runs: number;
  interval_minutes: number;
  store_id?: string;
  user_id?: string;
  api_key?: string;
}

export async function scheduleDripOrderHandler(req: Request, res: Response): Promise<void> {
  try {
    const {
      service_id,
      target_url,
      total_quantity,
      runs,
      interval_minutes,
      store_id,
      user_id,
      api_key
    } = req.body as ScheduleDripRequest;

    // 1. Validation of inputs
    if (!service_id || !target_url || !total_quantity) {
      res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'service_id, target_url, and total_quantity are required parameters.'
      });
      return;
    }

    const runsCount = Math.max(1, parseInt(String(runs || 1), 10));
    const intervalMins = Math.max(0, parseInt(String(interval_minutes || 0), 10));
    const totalQty = parseInt(String(total_quantity), 10);

    if (totalQty <= 0) {
      res.status(400).json({
        success: false,
        error: 'INVALID_QUANTITY',
        message: 'Total quantity must be greater than zero.'
      });
      return;
    }

    if (runsCount > 30) {
      res.status(400).json({
        success: false,
        error: 'MAX_RUNS_EXCEEDED',
        message: 'Maximum allowed drip runs is 30 splits.'
      });
      return;
    }

    // 2. Validate Service exists & limits
    const service = db.findServiceById(service_id);
    if (!service || service.status !== 'active') {
      res.status(404).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Requested service is disabled or does not exist.'
      });
      return;
    }

    if (totalQty < service.min_quantity || totalQty > service.max_quantity) {
      res.status(400).json({
        success: false,
        error: 'QUANTITY_OUT_OF_BOUNDS',
        message: `Quantity ${totalQty} violates service limits [Min: ${service.min_quantity}, Max: ${service.max_quantity}].`
      });
      return;
    }

    // 3. Authenticate User or resolve tenant customer
    let authenticatedUser = null;
    if (api_key) {
      authenticatedUser = db.findUserByApiKey(api_key);
    } else if (user_id) {
      authenticatedUser = db.findUserById(user_id);
    } else {
      // Default to customer demo user
      authenticatedUser = db.getUsers().find(u => u.role === 'customer') || db.getUsers()[0];
    }

    if (!authenticatedUser) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Valid user authentication credentials or API Key required.'
      });
      return;
    }

    // 4. Calculate pricing: check if store pricing applies or wholesale base cost
    let unitCostPer1k = service.base_cost_per_1k;
    if (store_id) {
      const storePricing = db.getStoreServicesWithPricing(store_id).find(sp => sp.id === service_id);
      if (storePricing) {
        unitCostPer1k = storePricing.customized_selling_price_per_1k;
      }
    }

    const totalCharge = Number(((totalQty / 1000) * unitCostPer1k).toFixed(4));

    // 5. Atomic Wallet Check & Deduction
    try {
      db.updateUserBalance(authenticatedUser.id, -totalCharge);
    } catch (balanceError: any) {
      res.status(402).json({
        success: false,
        error: 'INSUFFICIENT_FUNDS',
        message: balanceError.message,
        required_amount: totalCharge,
        current_balance: authenticatedUser.wallet_balance
      });
      return;
    }

    // 6. Generate Batch Timeline
    const qtyPerRun = Math.floor(totalQty / runsCount);
    const batches = [];
    const now = Date.now();

    for (let i = 1; i <= runsCount; i++) {
      const isLast = i === runsCount;
      const batchQty = isLast ? totalQty - (qtyPerRun * (runsCount - 1)) : qtyPerRun;
      const scheduledTimestamp = new Date(now + (i - 1) * intervalMins * 60000).toISOString();
      const isImmediate = i === 1;

      batches.push({
        batch_number: i,
        quantity: batchQty,
        status: isImmediate ? ('dispatched' as const) : ('pending' as const),
        scheduled_for: scheduledTimestamp,
        executed_at: isImmediate ? new Date().toISOString() : undefined,
        tracking_id: isImmediate ? `DRIP_BATCH_1_${Math.floor(10000 + Math.random() * 90000)}` : undefined
      });
    }

    // 7. Persist Order in Comprehensive Orders Matrix
    const createdOrder = db.createOrder({
      store_id: store_id || null,
      user_id: authenticatedUser.id,
      target_url,
      service_id,
      total_quantity: totalQty,
      total_charge: totalCharge,
      scheduling_configuration: {
        is_drip: runsCount > 1,
        runs: runsCount,
        interval_minutes: intervalMins,
        quantity_per_run: qtyPerRun,
        completed_runs: 1,
        next_execution_at: runsCount > 1 ? new Date(now + intervalMins * 60000).toISOString() : null,
        batches
      }
    });

    // 8. Record Ledger Entry
    db.recordTransaction({
      user_id: authenticatedUser.id,
      store_id: store_id || null,
      financial_action: 'wallet_deposit', // internal order debit recorded
      transaction_amount: totalCharge,
      gateway_payment_reference: `ORD_DEBIT_${createdOrder.id.substring(0, 8)}`,
      processor_status: 'success',
      metadata: {
        order_id: createdOrder.id,
        is_drip: runsCount > 1,
        runs: runsCount,
        interval_minutes: intervalMins
      }
    });

    res.status(201).json({
      success: true,
      message: runsCount > 1 
        ? `Order successfully created with ${runsCount} automated drip executions across ${((runsCount * intervalMins) / 60).toFixed(1)} hours.`
        : 'Direct order successfully queued for immediate upstream fulfillment.',
      data: {
        order_id: createdOrder.id,
        tracking_provider_order_id: createdOrder.tracking_provider_order_id,
        total_quantity: totalQty,
        total_charge: totalCharge,
        remaining_balance: authenticatedUser.wallet_balance,
        scheduling: createdOrder.scheduling_configuration
      }
    });
  } catch (error: any) {
    console.error('[Smart Scheduler Error]:', error);
    res.status(500).json({
      success: false,
      error: 'SCHEDULING_ENGINE_FAILED',
      message: error.message || 'An internal error occurred in the smart drip scheduling engine.'
    });
  }
}
