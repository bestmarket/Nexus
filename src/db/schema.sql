-- ============================================================================
-- NEXUSPULSE HYBRID B2B WHOLESALER SMM PANEL & B2C CHILD PANEL ENGINE
-- PRODUCTION-GRADE POSTGRESQL MULTI-TENANT DDL SCHEMA
-- ============================================================================

-- 0. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean previous enum types if recreating
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'reseller', 'customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_tier AS ENUM ('standard', 'vip');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE store_type_enum AS ENUM ('b2b', 'b2c');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_status AS ENUM ('active', 'disabled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_execution_status AS ENUM ('pending', 'processing', 'completed', 'refunded', 'scheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE financial_action_enum AS ENUM ('wallet_deposit', 'subscription_fee', 'retail_order_payout');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE processor_status_enum AS ENUM ('success', 'pending', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. USERS & WALLETS TABLE
-- Centralized entity for super-admins, B2B wholesale resellers, and direct retail consumers.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    wallet_balance NUMERIC(15, 4) NOT NULL DEFAULT 0.0000 CHECK (wallet_balance >= 0.0000),
    api_key VARCHAR(64) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    tier user_tier NOT NULL DEFAULT 'standard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. STORES (CHILD PANELS) TABLE
-- Multi-tenant storefront records rented or provisioned by resellers.
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) NOT NULL UNIQUE,
    store_type store_type_enum NOT NULL DEFAULT 'b2c',
    theme_settings JSONB NOT NULL DEFAULT '{
        "store_name": "Nexus Retail Child Panel",
        "primary_color": "#3B82F6",
        "secondary_color": "#1E293B",
        "accent_color": "#10B981",
        "currency_symbol": "₦",
        "currency_code": "NGN",
        "hero_title": "Accelerate Your Social Presence",
        "hero_subtitle": "Instant, high-retention engagement with automated AI profile optimization.",
        "support_email": "support@resellersite.com"
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    current_subscription_expiry TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stores_domain_name ON stores(domain_name);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_theme_settings_gin ON stores USING gin(theme_settings);

-- 3. MASTER SERVICES CATALOG TABLE
-- Global catalog of wholesale services supplied across upstream aggregators.
CREATE TABLE IF NOT EXISTS master_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_identifier VARCHAR(100) NOT NULL, -- e.g. 'UPSTREAM_ALPHA_API_v2'
    service_name VARCHAR(255) NOT NULL,
    base_cost_per_1k NUMERIC(15, 4) NOT NULL CHECK (base_cost_per_1k >= 0.0000),
    category VARCHAR(100) NOT NULL, -- e.g. 'Instagram Followers', 'TikTok Views'
    min_quantity INTEGER NOT NULL CHECK (min_quantity > 0),
    max_quantity INTEGER NOT NULL CHECK (max_quantity >= min_quantity),
    status service_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_master_services_category ON master_services(category);
CREATE INDEX IF NOT EXISTS idx_master_services_status ON master_services(status);
CREATE INDEX IF NOT EXISTS idx_master_services_provider ON master_services(provider_identifier);

-- 4. TENANT STORE PRICING LOOKUP TABLE
-- Child storefront markup layer uniquely binding a store with a master service.
CREATE TABLE IF NOT EXISTS tenant_store_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES master_services(id) ON DELETE CASCADE,
    customized_selling_price_per_1k NUMERIC(15, 4) NOT NULL CHECK (customized_selling_price_per_1k >= 0.0000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_store_service UNIQUE(store_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_pricing_store ON tenant_store_pricing(store_id);
CREATE INDEX IF NOT EXISTS idx_tenant_pricing_service ON tenant_store_pricing(service_id);

-- 5. COMPREHENSIVE ORDERS MATRIX TABLE
-- Central order matrix supporting master panel direct orders, child panel retail orders, and drip orders.
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL, -- Nullable for Master Panel wholesale direct orders
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    target_url TEXT NOT NULL,
    total_quantity INTEGER NOT NULL CHECK (total_quantity > 0),
    total_charge NUMERIC(15, 4) NOT NULL CHECK (total_charge >= 0.0000),
    execution_status order_execution_status NOT NULL DEFAULT 'pending',
    tracking_provider_order_id VARCHAR(100),
    scheduling_configuration JSONB DEFAULT '{
        "is_drip": false,
        "runs": 1,
        "interval_minutes": 0,
        "quantity_per_run": 0,
        "completed_runs": 0,
        "next_execution_at": null
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(execution_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_scheduling_gin ON orders USING gin(scheduling_configuration);

-- 6. FINANCIAL TRANSACTIONS & SUBSCRIPTIONS LEDGER TABLE
-- Double-entry capable transactional ledger recording deposits, subscription fees, and retail split settlements.
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    financial_action financial_action_enum NOT NULL,
    transaction_amount NUMERIC(15, 4) NOT NULL CHECK (transaction_amount >= 0.0000),
    gateway_payment_reference VARCHAR(255) NOT NULL UNIQUE,
    processor_status processor_status_enum NOT NULL DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_financial_user_id ON financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_store_id ON financial_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_financial_action ON financial_transactions(financial_action);
CREATE INDEX IF NOT EXISTS idx_financial_reference ON financial_transactions(gateway_payment_reference);
CREATE INDEX IF NOT EXISTS idx_financial_created_at ON financial_transactions(created_at DESC);

-- AUTOMATIC UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers across all tables
DO $$ BEGIN
    CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
    CREATE TRIGGER trg_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
    CREATE TRIGGER trg_master_services_updated_at BEFORE UPDATE ON master_services FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
    CREATE TRIGGER trg_tenant_store_pricing_updated_at BEFORE UPDATE ON tenant_store_pricing FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
    CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
    CREATE TRIGGER trg_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SEED SCRIPT FOR BOOTSTRAPING INSTANCE
INSERT INTO users (id, email, password_hash, role, wallet_balance, api_key, tier)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@nexuspulse.io', '$2b$12$e8x/q1f6oH9k7J9Z6Kk3Xe41oJ3D0C2bM0J7E4vB7K9Z0F3G6L2M', 'admin', 500000.0000, 'nexus_live_superadmin_master_key_9941a', 'vip'),
    ('00000000-0000-0000-0000-000000000002', 'reseller@socialgrowth.ng', '$2b$12$e8x/q1f6oH9k7J9Z6Kk3Xe41oJ3D0C2bM0J7E4vB7K9Z0F3G6L2M', 'reseller', 85400.0000, 'nexus_live_reseller_api_key_8842bc19a7', 'vip'),
    ('00000000-0000-0000-0000-000000000003', 'client@fashionbrand.com', '$2b$12$e8x/q1f6oH9k7J9Z6Kk3Xe41oJ3D0C2bM0J7E4vB7K9Z0F3G6L2M', 'customer', 12500.0000, 'nexus_live_customer_key_7719d3f890', 'standard')
ON CONFLICT (email) DO NOTHING;

INSERT INTO stores (id, owner_id, domain_name, store_type, theme_settings, is_active, current_subscription_expiry)
VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'socialboost.africa', 'b2c', '{
        "store_name": "SocialBoost Africa",
        "primary_color": "#10B981",
        "secondary_color": "#064E3B",
        "accent_color": "#F59E0B",
        "currency_symbol": "₦",
        "currency_code": "NGN",
        "hero_title": "Explode Your African Social Reach",
        "hero_subtitle": "Real Nigerian & Pan-African high-retention engagement with automated AI growth audits.",
        "support_email": "hello@socialboost.africa"
    }'::jsonb, true, CURRENT_TIMESTAMP + INTERVAL '60 days'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'apexwholesaler.com', 'b2b', '{
        "store_name": "Apex Wholesaler Engine",
        "primary_color": "#6366F1",
        "secondary_color": "#1E1B4B",
        "accent_color": "#EC4899",
        "currency_symbol": "$",
        "currency_code": "USD",
        "hero_title": "Direct B2B SMM API Pipeline",
        "hero_subtitle": "Sub-100ms API routing for high-volume resellers, marketing agencies, and aggregators.",
        "support_email": "api@apexwholesaler.com"
    }'::jsonb, true, CURRENT_TIMESTAMP + INTERVAL '90 days')
ON CONFLICT (domain_name) DO NOTHING;

INSERT INTO master_services (id, provider_identifier, service_name, base_cost_per_1k, category, min_quantity, max_quantity, status)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'UPSTREAM_FAST_NODES', 'Instagram High Retention Followers [Real/30D Refill]', 1200.0000, 'Instagram', 50, 100000, 'active'),
    ('20000000-0000-0000-0000-000000000002', 'UPSTREAM_FAST_NODES', 'Instagram Targeted Organic Likes [Instant Start]', 450.0000, 'Instagram', 100, 50000, 'active'),
    ('20000000-0000-0000-0000-000000000003', 'TIKTOK_TITAN_GLOBAL', 'TikTok Algorithm Viral Views [Gradual Drip-Ready]', 180.0000, 'TikTok', 500, 1000000, 'active'),
    ('20000000-0000-0000-0000-000000000004', 'TIKTOK_TITAN_GLOBAL', 'TikTok Active Followers [High Quality/Zero Drop]', 2200.0000, 'TikTok', 100, 250000, 'active'),
    ('20000000-0000-0000-0000-000000000005', 'YOUTUBE_MASTERY_NET', 'YouTube Monetization Watch Hours [4000H Compliant]', 4800.0000, 'YouTube', 100, 10000, 'active'),
    ('20000000-0000-0000-0000-000000000006', 'YOUTUBE_MASTERY_NET', 'YouTube Real Organic Views [AdWords Powered]', 850.0000, 'YouTube', 500, 500000, 'active'),
    ('20000000-0000-0000-0000-000000000007', 'X_TWITTER_NODE_HUB', 'X/Twitter Premium Followers [Verified Avatars]', 3100.0000, 'X / Twitter', 50, 50000, 'active'),
    ('20000000-0000-0000-0000-000000000008', 'TELEGRAM_DIRECT_PIPE', 'Telegram Channel Members [Non-Drop/Instant]', 650.0000, 'Telegram', 100, 100000, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_store_pricing (id, store_id, service_id, customized_selling_price_per_1k)
VALUES
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 3500.0000), -- ₦3500 vs ₦1200 base (₦2300 reseller margin)
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 1500.0000), -- ₦1500 vs ₦450 base (₦1050 reseller margin)
    ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 750.0000),  -- ₦750 vs ₦180 base (₦570 reseller margin)
    ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 5900.0000), -- ₦5900 vs ₦2200 base (₦3700 reseller margin)
    ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 12000.0000),
    ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 2400.0000),
    ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 7200.0000),
    ('30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', 1900.0000)
ON CONFLICT (store_id, service_id) DO NOTHING;
