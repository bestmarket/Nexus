/**
 * Admin Controller for Core Administrator Command Deck
 * Analytics, Central API Integrations, Storefront Management, User Wallets, Ledger Auditing
 */
import { Request, Response } from 'express';
import { db } from '../db';

export async function getAdminAnalyticsHandler(req: Request, res: Response): Promise<void> {
  try {
    const summary = db.getAnalyticsSummary();
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAdminOrdersHandler(req: Request, res: Response): Promise<void> {
  try {
    const orders = db.getOrders();
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAdminTransactionsHandler(req: Request, res: Response): Promise<void> {
  try {
    const txs = db.getFinancialTransactions();
    res.status(200).json({
      success: true,
      data: txs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAdminUsersHandler(req: Request, res: Response): Promise<void> {
  try {
    const users = db.getUsers();
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function adjustUserBalanceHandler(req: Request, res: Response): Promise<void> {
  try {
    const { user_id, delta_amount, reason } = req.body;
    if (!user_id || delta_amount === undefined) {
      res.status(400).json({ success: false, message: 'user_id and delta_amount are required' });
      return;
    }

    const updatedUser = db.updateUserBalance(user_id, parseFloat(delta_amount));

    db.recordTransaction({
      user_id,
      store_id: null,
      financial_action: 'wallet_deposit',
      transaction_amount: Math.abs(parseFloat(delta_amount)),
      gateway_payment_reference: `MANUAL_ADJ_${Date.now()}`,
      processor_status: 'success',
      metadata: { reason: reason || 'Manual Admin Balance Adjustment' }
    });

    res.status(200).json({
      success: true,
      message: `User balance adjusted by ₦${delta_amount}. New balance: ₦${updatedUser.wallet_balance}`,
      data: updatedUser
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleUserTierHandler(req: Request, res: Response): Promise<void> {
  try {
    const { user_id, tier } = req.body;
    const user = db.updateUserTier(user_id, tier);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function regenerateUserApiKeyHandler(req: Request, res: Response): Promise<void> {
  try {
    const { user_id } = req.body;
    const user = db.regenerateApiKey(user_id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateStoreHandler(req: Request, res: Response): Promise<void> {
  try {
    const { store_id } = req.params;
    const updates = req.body;
    const store = db.updateStore(store_id, updates);
    res.status(200).json({
      success: true,
      data: store
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createStoreHandler(req: Request, res: Response): Promise<void> {
  try {
    const { owner_id, domain_name, store_type, theme_settings } = req.body;
    if (!owner_id || !domain_name) {
      res.status(400).json({ success: false, message: 'owner_id and domain_name required' });
      return;
    }

    const store = db.createStore({
      owner_id,
      domain_name,
      store_type,
      theme_settings
    });

    res.status(201).json({
      success: true,
      data: store
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getProviderStatusHandler(req: Request, res: Response): Promise<void> {
  try {
    const providers = [
      {
        identifier: 'UPSTREAM_FAST_NODES',
        name: 'Alpha High-Speed Node Direct',
        endpoint: 'https://upstream-alpha.provider-core.net/api/v2',
        status: 'online',
        latency_ms: 48,
        success_rate: '99.8%',
        active_services: 4,
        wallet_balance_upstream: '$14,280.50'
      },
      {
        identifier: 'TIKTOK_TITAN_GLOBAL',
        name: 'TikTok Titan Global Pipeline',
        endpoint: 'https://titan-tiktok-cluster.net/api/v1',
        status: 'online',
        latency_ms: 62,
        success_rate: '99.4%',
        active_services: 2,
        wallet_balance_upstream: '$8,940.00'
      },
      {
        identifier: 'YOUTUBE_MASTERY_NET',
        name: 'YouTube AdWords Strategic Pipe',
        endpoint: 'https://yt-monetize-hub.io/v3',
        status: 'online',
        latency_ms: 85,
        success_rate: '98.9%',
        active_services: 2,
        wallet_balance_upstream: '$5,110.20'
      },
      {
        identifier: 'X_TWITTER_NODE_HUB',
        name: 'X Protocol VIP Matrix',
        endpoint: 'https://x-social-matrix.io/api',
        status: 'online',
        latency_ms: 55,
        success_rate: '99.6%',
        active_services: 1,
        wallet_balance_upstream: '$3,890.00'
      }
    ];

    res.status(200).json({
      success: true,
      data: providers
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
