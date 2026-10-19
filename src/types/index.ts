/**
 * Core Type Definitions for NexusPulse SMM Engine
 * Aligned with PostgreSQL multi-tenant schema and REST API specifications.
 */

export type UserRole = 'admin' | 'reseller' | 'customer';
export type UserTier = 'standard' | 'vip';
export type StoreType = 'b2b' | 'b2c';
export type ServiceStatus = 'active' | 'disabled';
export type OrderExecutionStatus = 'pending' | 'processing' | 'completed' | 'refunded' | 'scheduled';
export type FinancialAction = 'wallet_deposit' | 'subscription_fee' | 'retail_order_payout';
export type ProcessorStatus = 'success' | 'pending' | 'failed';

export interface ThemeSettings {
  store_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  currency_symbol: string;
  currency_code: string;
  hero_title: string;
  hero_subtitle: string;
  support_email: string;
  announcement?: string;
}

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  wallet_balance: number;
  api_key: string;
  tier: UserTier;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  owner_id: string;
  domain_name: string;
  store_type: StoreType;
  theme_settings: ThemeSettings;
  is_active: boolean;
  current_subscription_expiry: string;
  created_at: string;
  updated_at: string;
}

export interface MasterService {
  id: string;
  provider_identifier: string;
  service_name: string;
  base_cost_per_1k: number;
  category: string;
  min_quantity: number;
  max_quantity: number;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
}

export interface TenantPricing {
  id: string;
  store_id: string;
  service_id: string;
  customized_selling_price_per_1k: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceWithPricing extends MasterService {
  store_id?: string;
  customized_selling_price_per_1k: number;
  reseller_margin_per_1k: number;
}

export interface DripScheduleConfig {
  is_drip: boolean;
  runs: number;
  interval_minutes: number;
  quantity_per_run: number;
  completed_runs: number;
  next_execution_at: string | null;
  batches?: Array<{
    batch_number: number;
    quantity: number;
    status: 'pending' | 'dispatched' | 'completed';
    scheduled_for: string;
    executed_at?: string;
    tracking_id?: string;
  }>;
}

export interface Order {
  id: string;
  store_id: string | null; // null for master direct wholesale order
  user_id: string;
  target_url: string;
  service_id?: string;
  service_name?: string;
  total_quantity: number;
  total_charge: number;
  execution_status: OrderExecutionStatus;
  tracking_provider_order_id: string | null;
  scheduling_configuration: DripScheduleConfig;
  created_at: string;
  updated_at: string;
}

export interface FinancialTransaction {
  id: string;
  user_id: string;
  store_id: string | null;
  financial_action: FinancialAction;
  transaction_amount: number;
  gateway_payment_reference: string;
  processor_status: ProcessorStatus;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AIProfileAudit {
  target_url: string;
  platform: string;
  handle: string;
  three_sentence_audit: string;
  metrics_estimate: {
    estimated_engagement_rate: string;
    profile_health_score: number;
    recommended_focus: string;
  };
  tailored_packages: Array<{
    service_id: string;
    service_name: string;
    recommended_quantity: number;
    custom_price: number;
    strategic_objective: string;
    priority: 'high' | 'medium' | 'recommended';
  }>;
}

export interface BulkOrderItemPayload {
  service_id: string;
  link: string;
  quantity: number;
  runs?: number;
  interval?: number;
  custom_reference?: string;
}

export interface BulkOrderResponse {
  batch_id: string;
  total_submitted: number;
  successful_orders: Array<{
    order_id: string;
    service_id: string;
    quantity: number;
    charge: number;
    status: string;
    tracking_id: string;
  }>;
  failed_orders: Array<{
    service_id: string;
    link: string;
    reason: string;
  }>;
  total_debited: number;
  remaining_wallet_balance: number;
}

export interface SettlementWebhookPayload {
  event: string;
  data: {
    reference: string;
    amount_paid: number; // in NGN or store currency
    currency: string;
    customer_email: string;
    store_id: string;
    service_id: string;
    target_url: string;
    quantity: number;
    metadata?: Record<string, any>;
  };
}

export interface SettlementResult {
  status: 'settled' | 'failed';
  gateway_reference: string;
  gross_paid: number;
  master_base_cost: number;
  reseller_net_profit: number;
  admin_wallet_credited: number;
  reseller_wallet_credited: number;
  generated_order_id: string;
  fulfillment_tracking_id: string;
  execution_status: string;
}
