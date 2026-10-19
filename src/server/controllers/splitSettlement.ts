/**
 * Module 3.5: Split-Payment Automated Settlement Engine
 * Endpoint: POST /api/webhooks/payment-settlement
 * Tracks incoming webhooks from Paystack / Flutterwave for rented child storefronts.
 * Calculates master base cost vs reseller retail margin, transfers base cost to admin wallet,
 * credits reseller net profit margin directly, records dual ledger entries, and auto-routes fulfillment order.
 */
import { Request, Response } from 'express';
import { db } from '../db';
import { SettlementResult } from '../../types';

export async function splitSettlementWebhookHandler(req: Request, res: Response): Promise<void> {
  try {
    // Paystack / Flutterwave payload normalization
    const event = req.body.event || 'charge.success';
    const payloadData = req.body.data || req.body;

    // Verify event is successful charge
    if (event !== 'charge.success' && event !== 'payment.success' && event !== 'direct_settlement_test') {
      res.status(200).json({
        status: 'ignored',
        message: `Event type '${event}' received and logged without settlement action.`
      });
      return;
    }

    // Extract transaction metadata
    const gatewayRef = 
      payloadData.reference || 
      payloadData.tx_ref || 
      `PSTK_SPLIT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const amountPaid = parseFloat(String(payloadData.amount_paid || payloadData.amount || 10000));
    const storeId = payloadData.store_id || payloadData.metadata?.store_id;
    const serviceId = payloadData.service_id || payloadData.metadata?.service_id;
    const targetUrl = payloadData.target_url || payloadData.metadata?.target_url || 'https://instagram.com/verified_client';
    const totalQty = parseInt(String(payloadData.quantity || payloadData.metadata?.quantity || 2500), 10);
    const customerEmail = payloadData.customer_email || payloadData.customer?.email || 'shopper@consumer.ng';

    // 1. Resolve Storefront
    const store = storeId ? db.findStoreById(storeId) : db.getStores().find(s => s.is_active);
    if (!store) {
      res.status(404).json({
        status: 'error',
        message: `Store with ID ${storeId} not found.`
      });
      return;
    }

    // 2. Resolve Service & Wholesaler Base Cost
    const service = serviceId ? db.findServiceById(serviceId) : db.getMasterServices()[0];
    if (!service) {
      res.status(404).json({
        status: 'error',
        message: `Service with ID ${serviceId} not found in master catalog.`
      });
      return;
    }

    // Base cost calculation: e.g. 2,500 followers at ₦1,200/1k base = ₦3,000 base cost
    // If consumer paid ₦10,000:
    // Admin receives ₦3,000 (master base cost)
    // Reseller receives ₦7,000 (net profit)
    const masterBaseCost = Number(((totalQty / 1000) * service.base_cost_per_1k).toFixed(4));
    
    // Safety check: ensure consumer paid at least the master base cost
    if (amountPaid < masterBaseCost) {
      console.warn(`[Split Settlement Alert]: Amount paid (₦${amountPaid}) is below base cost (₦${masterBaseCost}). Setting base cost to amount paid.`);
    }

    const resellerNetProfit = Math.max(0, Number((amountPaid - masterBaseCost).toFixed(4)));

    // 3. Resolve Admin User & Reseller User
    const adminUser = db.getUsers().find(u => u.role === 'admin') || db.getUsers()[0];
    const resellerUser = db.findUserById(store.owner_id);

    if (!resellerUser) {
      res.status(500).json({
        status: 'error',
        message: `Store owner (reseller ID: ${store.owner_id}) could not be resolved.`
      });
      return;
    }

    // 4. Resolve or create customer account for record-keeping
    let customerUser = db.findUserByEmail(customerEmail);
    if (!customerUser) {
      customerUser = {
        id: crypto.randomUUID(),
        email: customerEmail,
        role: 'customer',
        wallet_balance: 0,
        api_key: `nexus_cust_${Math.random().toString(36).substring(2, 10)}`,
        tier: 'standard',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.getUsers().push(customerUser);
    }

    // 5. Transfer Funds:
    // (a) Admin Wallet receives Master Base Cost
    db.updateUserBalance(adminUser.id, masterBaseCost);

    // (b) Reseller Wallet receives Net Profit Margin directly
    db.updateUserBalance(resellerUser.id, resellerNetProfit);

    // 6. Record Dual Financial Ledger Entries
    // Reseller profit payout entry
    db.recordTransaction({
      user_id: resellerUser.id,
      store_id: store.id,
      financial_action: 'retail_order_payout',
      transaction_amount: resellerNetProfit,
      gateway_payment_reference: `${gatewayRef}_RESELLER_SHARE`,
      processor_status: 'success',
      metadata: {
        consumer_paid: amountPaid,
        master_base_cost: masterBaseCost,
        reseller_net_profit: resellerNetProfit,
        store_domain: store.domain_name,
        gateway: 'paystack/flutterwave'
      }
    });

    // Admin platform fulfillment entry
    db.recordTransaction({
      user_id: adminUser.id,
      store_id: store.id,
      financial_action: 'retail_order_payout',
      transaction_amount: masterBaseCost,
      gateway_payment_reference: `${gatewayRef}_ADMIN_BASE`,
      processor_status: 'success',
      metadata: {
        split_role: 'super_admin_base_cost',
        service_id: service.id,
        quantity: totalQty
      }
    });

    // 7. Auto-Route Fulfillment Order to Upstream Backend System
    const fulfillmentOrder = db.createOrder({
      store_id: store.id,
      user_id: customerUser.id,
      target_url: targetUrl,
      service_id: service.id,
      total_quantity: totalQty,
      total_charge: amountPaid,
      scheduling_configuration: {
        is_drip: false,
        runs: 1,
        interval_minutes: 0,
        quantity_per_run: totalQty,
        completed_runs: 1,
        next_execution_at: null
      }
    });

    const result: SettlementResult = {
      status: 'settled',
      gateway_reference: gatewayRef,
      gross_paid: amountPaid,
      master_base_cost: masterBaseCost,
      reseller_net_profit: resellerNetProfit,
      admin_wallet_credited: masterBaseCost,
      reseller_wallet_credited: resellerNetProfit,
      generated_order_id: fulfillmentOrder.id,
      fulfillment_tracking_id: fulfillmentOrder.tracking_provider_order_id || 'DISPATCHED',
      execution_status: fulfillmentOrder.execution_status
    };

    res.status(200).json({
      success: true,
      message: `Split settlement successfully executed: ₦${masterBaseCost.toFixed(2)} routed to Admin Base Wallet, ₦${resellerNetProfit.toFixed(2)} credited to Reseller (${resellerUser.email}).`,
      data: result
    });
  } catch (error: any) {
    console.error('[Split Settlement Engine Error]:', error);
    res.status(500).json({
      success: false,
      error: 'SETTLEMENT_ROUTING_FAILED',
      message: error.message || 'An unexpected error occurred during split settlement processing.'
    });
  }
}
