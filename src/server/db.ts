/**
 * Database State & Query Operations
 * Mirroring PostgreSQL Multi-Tenant Relational Schema
 */
import {
  User,
  Store,
  MasterService,
  TenantPricing,
  Order,
  FinancialTransaction,
  ServiceWithPricing,
  DripScheduleConfig
} from '../types';

interface DatabaseState {
  users: User[];
  stores: Store[];
  master_services: MasterService[];
  tenant_store_pricing: TenantPricing[];
  orders: Order[];
  financial_transactions: FinancialTransaction[];
}

const INITIAL_USERS: User[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@nexuspulse.io',
    role: 'admin',
    wallet_balance: 500000.0,
    api_key: 'nexus_live_superadmin_master_key_9941a',
    tier: 'vip',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'reseller@socialgrowth.ng',
    role: 'reseller',
    wallet_balance: 85400.0,
    api_key: 'nexus_live_reseller_api_key_8842bc19a7',
    tier: 'vip',
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z'
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'client@fashionbrand.com',
    role: 'customer',
    wallet_balance: 12500.0,
    api_key: 'nexus_live_customer_key_7719d3f890',
    tier: 'standard',
    created_at: '2026-02-01T00:00:00.000Z',
    updated_at: '2026-02-01T00:00:00.000Z'
  }
];

const INITIAL_STORES: Store[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    owner_id: '00000000-0000-0000-0000-000000000002',
    domain_name: 'socialboost.africa',
    store_type: 'b2c',
    theme_settings: {
      store_name: 'SocialBoost Africa',
      primary_color: '#10B981',
      secondary_color: '#064E3B',
      accent_color: '#F59E0B',
      currency_symbol: '₦',
      currency_code: 'NGN',
      hero_title: 'Explode Your African Social Reach',
      hero_subtitle: 'Real Nigerian & Pan-African high-retention engagement with automated AI growth audits.',
      support_email: 'hello@socialboost.africa',
      announcement: '🔥 FLASH SALE: 20% Extra High-Retention Followers this week with Automated Split Billing!'
    },
    is_active: true,
    current_subscription_expiry: new Date(Date.now() + 60 * 86400000).toISOString(),
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z'
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    owner_id: '00000000-0000-0000-0000-000000000002',
    domain_name: 'apexwholesaler.com',
    store_type: 'b2b',
    theme_settings: {
      store_name: 'Apex Wholesaler Engine',
      primary_color: '#6366F1',
      secondary_color: '#1E1B4B',
      accent_color: '#EC4899',
      currency_symbol: '$',
      currency_code: 'USD',
      hero_title: 'Direct B2B SMM API Pipeline',
      hero_subtitle: 'Sub-100ms API routing for high-volume resellers, marketing agencies, and aggregators.',
      support_email: 'api@apexwholesaler.com',
      announcement: '⚡ High Volume Tier: Orders >100k units auto-assigned to Dedicated Alpha Node servers.'
    },
    is_active: true,
    current_subscription_expiry: new Date(Date.now() + 90 * 86400000).toISOString(),
    created_at: '2026-01-12T00:00:00.000Z',
    updated_at: '2026-01-12T00:00:00.000Z'
  }
];

const INITIAL_SERVICES: MasterService[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    provider_identifier: 'UPSTREAM_FAST_NODES',
    service_name: 'Instagram High Retention Followers [Real/30D Refill]',
    base_cost_per_1k: 1200.0,
    category: 'Instagram',
    min_quantity: 50,
    max_quantity: 100000,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    provider_identifier: 'UPSTREAM_FAST_NODES',
    service_name: 'Instagram Targeted Organic Likes [Instant Start]',
    base_cost_per_1k: 450.0,
    category: 'Instagram',
    min_quantity: 100,
    max_quantity: 50000,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    provider_identifier: 'TIKTOK_TITAN_GLOBAL',
    service_name: 'TikTok Algorithm Viral Views [Gradual Drip-Ready]',
    base_cost_per_1k: 180.0,
    category: 'TikTok',
    min_quantity: 500,
    max_quantity: 1000000,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    provider_identifier: 'TIKTOK_TITAN_GLOBAL',
    service_name: 'TikTok Active Followers [High Quality/Zero Drop]',
    base_cost_per_1k: 2200.0,
    category: 'TikTok',
    min_quantity: 100,
    max_quantity: 250000,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: '20000000-0000-0000-0000-000000000005',
    provider_identifier: 'YOUTUBE_MASTERY_NET',
    service_name: 'YouTube Monetization Watch Hours [4000H Compliant]',
    base_cost_per_1k: 4800.0,
    category: 'YouTube',
    min_quantity: 100,
    max_quantity: 10000,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: '20000000-0000-0000-0000-000000000006',
    provider_identifier: 'YOUTUBE_MASTERY_NET',
    service_name: 'YouTube Real Organic Views [AdWords Powered]',
    base_cost_per_1k: 850.0,
    category: 'YouTube',
    min_quantity: 500,
    max_quantity: 500000,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: '20000000-0000-0000-0000-000000000007',
    provider_identifier: 'X_TWITTER_NODE_HUB',
    service_name: 'X/Twitter Premium Followers [Verified Avatars]',
    base_cost_per_1k: 3100.0,
    category: 'X / Twitter',
    min_quantity: 50,
    max_quantity: 50000,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: '20000000-0000-0000-0000-000000000008',
    provider_identifier: 'TELEGRAM_DIRECT_PIPE',
    service_name: 'Telegram Channel Members [Non-Drop/Instant]',
    base_cost_per_1k: 650.0,
    category: 'Telegram',
    min_quantity: 100,
    max_quantity: 100000,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  }
];

const INITIAL_TENANT_PRICING: TenantPricing[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    store_id: '10000000-0000-0000-0000-000000000001',
    service_id: '20000000-0000-0000-0000-000000000001',
    customized_selling_price_per_1k: 3500.0,
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z'
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    store_id: '10000000-0000-0000-0000-000000000001',
    service_id: '20000000-0000-0000-0000-000000000002',
    customized_selling_price_per_1k: 1500.0,
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z'
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    store_id: '10000000-0000-0000-0000-000000000001',
    service_id: '20000000-0000-0000-0000-000000000003',
    customized_selling_price_per_1k: 750.0,
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z'
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    store_id: '10000000-0000-0000-0000-000000000001',
    service_id: '20000000-0000-0000-0000-000000000004',
    customized_selling_price_per_1k: 5900.0,
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z'
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    store_id: '10000000-0000-0000-0000-000000000001',
    service_id: '20000000-0000-0000-0000-000000000005',
    customized_selling_price_per_1k: 12000.0,
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z'
  },
  {
    id: '30000000-0000-0000-0000-000000000006',
    store_id: '10000000-0000-0000-0000-000000000001',
    service_id: '20000000-0000-0000-0000-000000000006',
    customized_selling_price_per_1k: 2400.0,
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z'
  },
  {
    id: '30000000-0000-0000-0000-000000000007',
    store_id: '10000000-0000-0000-0000-000000000001',
    service_id: '20000000-0000-0000-0000-000000000007',
    customized_selling_price_per_1k: 7200.0,
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z'
  },
  {
    id: '30000000-0000-0000-0000-000000000008',
    store_id: '10000000-0000-0000-0000-000000000001',
    service_id: '20000000-0000-0000-0000-000000000008',
    customized_selling_price_per_1k: 1900.0,
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z'
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    store_id: '10000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000003',
    target_url: 'https://instagram.com/lagos_luxury_wear',
    service_id: '20000000-0000-0000-0000-000000000001',
    service_name: 'Instagram High Retention Followers [Real/30D Refill]',
    total_quantity: 2500,
    total_charge: 8750.0,
    execution_status: 'completed',
    tracking_provider_order_id: 'UPSTREAM_ORD_7749129',
    scheduling_configuration: {
      is_drip: false,
      runs: 1,
      interval_minutes: 0,
      quantity_per_run: 2500,
      completed_runs: 1,
      next_execution_at: null
    },
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    store_id: '10000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000003',
    target_url: 'https://tiktok.com/@naijadancechallenge',
    service_id: '20000000-0000-0000-0000-000000000003',
    service_name: 'TikTok Algorithm Viral Views [Gradual Drip-Ready]',
    total_quantity: 10000,
    total_charge: 7500.0,
    execution_status: 'processing',
    tracking_provider_order_id: 'UPSTREAM_ORD_7750882',
    scheduling_configuration: {
      is_drip: true,
      runs: 5,
      interval_minutes: 120,
      quantity_per_run: 2000,
      completed_runs: 2,
      next_execution_at: new Date(Date.now() + 3600000 * 2).toISOString(),
      batches: [
        { batch_number: 1, quantity: 2000, status: 'completed', scheduled_for: new Date(Date.now() - 7200000).toISOString(), executed_at: new Date(Date.now() - 7100000).toISOString(), tracking_id: 'BATCH_1_8829' },
        { batch_number: 2, quantity: 2000, status: 'completed', scheduled_for: new Date(Date.now() - 3600000).toISOString(), executed_at: new Date(Date.now() - 3500000).toISOString(), tracking_id: 'BATCH_2_8830' },
        { batch_number: 3, quantity: 2000, status: 'pending', scheduled_for: new Date(Date.now() + 3600000).toISOString() },
        { batch_number: 4, quantity: 2000, status: 'pending', scheduled_for: new Date(Date.now() + 7200000).toISOString() },
        { batch_number: 5, quantity: 2000, status: 'pending', scheduled_for: new Date(Date.now() + 10800000).toISOString() }
      ]
    },
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3500000).toISOString()
  }
];

const INITIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: '50000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000002',
    store_id: '10000000-0000-0000-0000-000000000001',
    financial_action: 'retail_order_payout',
    transaction_amount: 5750.0,
    gateway_payment_reference: 'PSTK_SPLIT_REF_009182390',
    processor_status: 'success',
    metadata: {
      consumer_paid: 8750.0,
      master_base_cost: 3000.0,
      reseller_profit: 5750.0,
      gateway: 'paystack'
    },
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    user_id: '00000000-0000-0000-0000-000000000002',
    store_id: null,
    financial_action: 'wallet_deposit',
    transaction_amount: 50000.0,
    gateway_payment_reference: 'FLW_DEP_TOPUP_8849102',
    processor_status: 'success',
    metadata: {
      gateway: 'flutterwave',
      channel: 'bank_transfer'
    },
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

// Single in-memory repository with full relational query helpers
class DatabaseEngine {
  private state: DatabaseState = {
    users: [...INITIAL_USERS],
    stores: [...INITIAL_STORES],
    master_services: [...INITIAL_SERVICES],
    tenant_store_pricing: [...INITIAL_TENANT_PRICING],
    orders: [...INITIAL_ORDERS],
    financial_transactions: [...INITIAL_TRANSACTIONS]
  };

  // USERS
  public getUsers(): User[] {
    return this.state.users;
  }

  public findUserById(id: string): User | undefined {
    return this.state.users.find(u => u.id === id);
  }

  public findUserByApiKey(apiKey: string): User | undefined {
    return this.state.users.find(u => u.api_key === apiKey);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public updateUserBalance(userId: string, deltaAmount: number): User {
    const user = this.findUserById(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    const newBal = Number(user.wallet_balance) + Number(deltaAmount);
    if (newBal < 0) {
      throw new Error(`Insufficient wallet balance. Required: ₦${Math.abs(deltaAmount)}, Available: ₦${user.wallet_balance}`);
    }
    user.wallet_balance = Number(newBal.toFixed(4));
    user.updated_at = new Date().toISOString();
    return user;
  }

  public updateUserTier(userId: string, tier: 'standard' | 'vip'): User {
    const user = this.findUserById(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    user.tier = tier;
    user.updated_at = new Date().toISOString();
    return user;
  }

  public regenerateApiKey(userId: string): User {
    const user = this.findUserById(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    user.api_key = `nexus_live_key_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    user.updated_at = new Date().toISOString();
    return user;
  }

  // STORES (CHILD PANELS)
  public getStores(): Store[] {
    return this.state.stores;
  }

  public findStoreById(id: string): Store | undefined {
    return this.state.stores.find(s => s.id === id);
  }

  public findStoreByDomain(rawDomain: string): Store | undefined {
    if (!rawDomain) return undefined;
    // Strip port, protocol, and clean
    const cleanDomain = rawDomain.replace(/https?:\/\//, '').split(':')[0].toLowerCase();
    
    // Direct match
    let store = this.state.stores.find(s => s.domain_name.toLowerCase() === cleanDomain);
    if (store) return store;

    // Subdomain matching or fallback for dev
    store = this.state.stores.find(s => cleanDomain.includes(s.domain_name.toLowerCase()));
    if (store) return store;

    // Default to the first active store if domain not mapped
    return this.state.stores.find(s => s.is_active);
  }

  public createStore(data: Partial<Store> & { owner_id: string; domain_name: string }): Store {
    const existing = this.state.stores.find(s => s.domain_name.toLowerCase() === data.domain_name.toLowerCase());
    if (existing) throw new Error(`Domain ${data.domain_name} is already registered.`);

    const newStore: Store = {
      id: crypto.randomUUID(),
      owner_id: data.owner_id,
      domain_name: data.domain_name.toLowerCase().trim(),
      store_type: data.store_type || 'b2c',
      theme_settings: data.theme_settings || {
        store_name: `${data.domain_name.split('.')[0].toUpperCase()} Panel`,
        primary_color: '#3B82F6',
        secondary_color: '#1E293B',
        accent_color: '#10B981',
        currency_symbol: '₦',
        currency_code: 'NGN',
        hero_title: 'Global Social Media Growth Engine',
        hero_subtitle: 'Automated viral growth with instant fulfillment & split payment protection.',
        support_email: `support@${data.domain_name}`
      },
      is_active: true,
      current_subscription_expiry: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.state.stores.push(newStore);

    // Auto-seed default markup pricing (+150% retail margin) for this store
    for (const service of this.state.master_services) {
      const markupMultiplier = 2.2;
      this.state.tenant_store_pricing.push({
        id: crypto.randomUUID(),
        store_id: newStore.id,
        service_id: service.id,
        customized_selling_price_per_1k: Number((service.base_cost_per_1k * markupMultiplier).toFixed(2)),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return newStore;
  }

  public updateStore(storeId: string, updates: Partial<Store>): Store {
    const store = this.findStoreById(storeId);
    if (!store) throw new Error(`Store with ID ${storeId} not found`);
    Object.assign(store, updates);
    store.updated_at = new Date().toISOString();
    return store;
  }

  // MASTER SERVICES & TENANT PRICING
  public getMasterServices(): MasterService[] {
    return this.state.master_services;
  }

  public findServiceById(serviceId: string): MasterService | undefined {
    return this.state.master_services.find(s => s.id === serviceId);
  }

  public getStoreServicesWithPricing(storeId: string): ServiceWithPricing[] {
    const storePricingMap = new Map<string, number>();
    this.state.tenant_store_pricing
      .filter(tp => tp.store_id === storeId)
      .forEach(tp => storePricingMap.set(tp.service_id, tp.customized_selling_price_per_1k));

    return this.state.master_services
      .filter(s => s.status === 'active')
      .map(service => {
        const customPrice = storePricingMap.get(service.id) ?? Number((service.base_cost_per_1k * 2.0).toFixed(2));
        return {
          ...service,
          store_id: storeId,
          customized_selling_price_per_1k: customPrice,
          reseller_margin_per_1k: Number((customPrice - service.base_cost_per_1k).toFixed(2))
        };
      });
  }

  public updateTenantPricing(storeId: string, serviceId: string, newPrice: number): TenantPricing {
    let pricing = this.state.tenant_store_pricing.find(
      tp => tp.store_id === storeId && tp.service_id === serviceId
    );
    if (pricing) {
      pricing.customized_selling_price_per_1k = newPrice;
      pricing.updated_at = new Date().toISOString();
    } else {
      pricing = {
        id: crypto.randomUUID(),
        store_id: storeId,
        service_id: serviceId,
        customized_selling_price_per_1k: newPrice,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.state.tenant_store_pricing.push(pricing);
    }
    return pricing;
  }

  // ORDERS
  public getOrders(): Order[] {
    return [...this.state.orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public findOrderById(orderId: string): Order | undefined {
    return this.state.orders.find(o => o.id === orderId);
  }

  public createOrder(orderData: {
    store_id: string | null;
    user_id: string;
    target_url: string;
    service_id: string;
    total_quantity: number;
    total_charge: number;
    scheduling_configuration?: Partial<DripScheduleConfig>;
  }): Order {
    const service = this.findServiceById(orderData.service_id);
    const trackingProviderId = `NEXUS_${service?.provider_identifier || 'UPSTREAM'}_${Math.floor(1000000 + Math.random() * 9000000)}`;

    const isDrip = !!orderData.scheduling_configuration?.is_drip;
    const runs = orderData.scheduling_configuration?.runs || 1;
    const interval = orderData.scheduling_configuration?.interval_minutes || 0;
    const qtyPerRun = orderData.scheduling_configuration?.quantity_per_run || Math.floor(orderData.total_quantity / runs);

    const batches = [];
    if (isDrip && runs > 1) {
      for (let i = 1; i <= runs; i++) {
        batches.push({
          batch_number: i,
          quantity: i === runs ? (orderData.total_quantity - (qtyPerRun * (runs - 1))) : qtyPerRun,
          status: i === 1 ? ('dispatched' as const) : ('pending' as const),
          scheduled_for: new Date(Date.now() + (i - 1) * interval * 60000).toISOString(),
          executed_at: i === 1 ? new Date().toISOString() : undefined,
          tracking_id: i === 1 ? `BATCH_1_${Math.floor(1000 + Math.random() * 9000)}` : undefined
        });
      }
    }

    const newOrder: Order = {
      id: crypto.randomUUID(),
      store_id: orderData.store_id,
      user_id: orderData.user_id,
      target_url: orderData.target_url,
      service_id: orderData.service_id,
      service_name: service?.service_name || 'Standard Service',
      total_quantity: orderData.total_quantity,
      total_charge: Number(orderData.total_charge.toFixed(4)),
      execution_status: isDrip ? 'processing' : 'completed',
      tracking_provider_order_id: trackingProviderId,
      scheduling_configuration: {
        is_drip: isDrip,
        runs: runs,
        interval_minutes: interval,
        quantity_per_run: qtyPerRun,
        completed_runs: isDrip ? 1 : runs,
        next_execution_at: isDrip && runs > 1 ? new Date(Date.now() + interval * 60000).toISOString() : null,
        batches
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.state.orders.unshift(newOrder);
    return newOrder;
  }

  // FINANCIAL TRANSACTIONS
  public getFinancialTransactions(): FinancialTransaction[] {
    return [...this.state.financial_transactions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public recordTransaction(data: {
    user_id: string;
    store_id: string | null;
    financial_action: 'wallet_deposit' | 'subscription_fee' | 'retail_order_payout';
    transaction_amount: number;
    gateway_payment_reference: string;
    processor_status: 'success' | 'pending' | 'failed';
    metadata?: Record<string, any>;
  }): FinancialTransaction {
    const tx: FinancialTransaction = {
      id: crypto.randomUUID(),
      user_id: data.user_id,
      store_id: data.store_id,
      financial_action: data.financial_action,
      transaction_amount: Number(data.transaction_amount.toFixed(4)),
      gateway_payment_reference: data.gateway_payment_reference,
      processor_status: data.processor_status,
      metadata: data.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.state.financial_transactions.unshift(tx);
    return tx;
  }

  // SYSTEM ANALYTICS SUMMARY
  public getAnalyticsSummary() {
    const totalOrders = this.state.orders.length;
    const totalRevenueGMV = this.state.orders.reduce((acc, o) => acc + Number(o.total_charge), 0);
    
    // Net profit = Sum of orders (retail charge - master base cost)
    let netPlatformProfit = 0;
    this.state.orders.forEach(order => {
      const s = this.findServiceById(order.service_id || '');
      const baseCost = s ? (s.base_cost_per_1k * (order.total_quantity / 1000)) : (order.total_charge * 0.4);
      netPlatformProfit += (order.total_charge - baseCost);
    });

    const activeChildPanels = this.state.stores.filter(s => s.is_active).length;
    const totalUsers = this.state.users.length;
    const totalSettlementsPaid = this.state.financial_transactions
      .filter(t => t.financial_action === 'retail_order_payout' && t.processor_status === 'success')
      .reduce((acc, t) => acc + Number(t.transaction_amount), 0);

    return {
      total_orders: totalOrders,
      gross_merchandise_value_gmv: Number(totalRevenueGMV.toFixed(2)),
      net_platform_profit: Number(netPlatformProfit.toFixed(2)),
      active_child_panels: activeChildPanels,
      total_registered_users: totalUsers,
      total_settlements_paid: Number(totalSettlementsPaid.toFixed(2)),
      api_throughput_current_rpm: 412,
      average_latency_ms: 68
    };
  }

  public resetToDefault() {
    this.state = {
      users: [...INITIAL_USERS],
      stores: [...INITIAL_STORES],
      master_services: [...INITIAL_SERVICES],
      tenant_store_pricing: [...INITIAL_TENANT_PRICING],
      orders: [...INITIAL_ORDERS],
      financial_transactions: [...INITIAL_TRANSACTIONS]
    };
  }
}

export const db = new DatabaseEngine();
