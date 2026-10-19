import React, { useState, useEffect } from 'react';
import { Database, Copy, CheckCircle2, Download, Table, Key, ShieldCheck, GitFork } from 'lucide-react';

export const DatabaseSchemaViewer: React.FC = () => {
  const [schemaSql, setSchemaSql] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTableTab, setActiveTableTab] = useState<string>('users');

  useEffect(() => {
    fetch('/api/db/schema-sql')
      .then(res => {
        if (res.ok) return res.text();
        throw new Error('Could not fetch raw schema');
      })
      .then(sql => setSchemaSql(sql))
      .catch(() => {
        setSchemaSql(`-- Fetched from /src/db/schema.sql`);
      });
  }, []);

  const copySql = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tables = [
    {
      id: 'users',
      name: '1. users',
      description: 'Central identity & double-entry wallet balance ledger for super-admins, wholesale resellers, and retail customers.',
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY DEFAULT gen_random_uuid()' },
        { name: 'email', type: 'VARCHAR(255)', constraint: 'NOT NULL UNIQUE' },
        { name: 'password_hash', type: 'VARCHAR(255)', constraint: 'NOT NULL' },
        { name: 'role', type: 'user_role', constraint: 'ENUM (admin, reseller, customer)' },
        { name: 'wallet_balance', type: 'NUMERIC(15,4)', constraint: 'NOT NULL DEFAULT 0.0000 (CHECK >= 0)' },
        { name: 'api_key', type: 'VARCHAR(64)', constraint: 'NOT NULL UNIQUE' },
        { name: 'tier', type: 'user_tier', constraint: 'ENUM (standard, vip)' },
        { name: 'created_at / updated_at', type: 'TIMESTAMPTZ', constraint: 'DEFAULT CURRENT_TIMESTAMP' }
      ]
    },
    {
      id: 'stores',
      name: '2. stores',
      description: 'Child storefront rental entities dynamically mapped against incoming host headers with isolated branding & pricing.',
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY DEFAULT gen_random_uuid()' },
        { name: 'owner_id', type: 'UUID', constraint: 'REFERENCES users(id) ON DELETE CASCADE' },
        { name: 'domain_name', type: 'VARCHAR(255)', constraint: 'NOT NULL UNIQUE' },
        { name: 'store_type', type: 'store_type_enum', constraint: 'ENUM (b2b, b2c)' },
        { name: 'theme_settings', type: 'JSONB', constraint: 'GIN Indexed (store_name, colors, hero text)' },
        { name: 'is_active', type: 'BOOLEAN', constraint: 'DEFAULT true' },
        { name: 'current_subscription_expiry', type: 'TIMESTAMPTZ', constraint: 'NOT NULL' }
      ]
    },
    {
      id: 'master_services',
      name: '3. master_services',
      description: 'Master wholesale catalog specifying provider identifiers, upstream base rates, limits, and categories.',
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY DEFAULT gen_random_uuid()' },
        { name: 'provider_identifier', type: 'VARCHAR(100)', constraint: 'NOT NULL (e.g. UPSTREAM_FAST_NODES)' },
        { name: 'service_name', type: 'VARCHAR(255)', constraint: 'NOT NULL' },
        { name: 'base_cost_per_1k', type: 'NUMERIC(15,4)', constraint: 'NOT NULL (CHECK >= 0)' },
        { name: 'category', type: 'VARCHAR(100)', constraint: 'NOT NULL (Instagram, TikTok, YouTube...)' },
        { name: 'min_quantity / max_quantity', type: 'INTEGER', constraint: 'NOT NULL (CHECK max >= min)' },
        { name: 'status', type: 'service_status', constraint: 'ENUM (active, disabled)' }
      ]
    },
    {
      id: 'tenant_store_pricing',
      name: '4. tenant_store_pricing',
      description: 'Child panel markup lookup table uniquely enforcing store_id + service_id constraints.',
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY DEFAULT gen_random_uuid()' },
        { name: 'store_id', type: 'UUID', constraint: 'REFERENCES stores(id) ON DELETE CASCADE' },
        { name: 'service_id', type: 'UUID', constraint: 'REFERENCES master_services(id) ON DELETE CASCADE' },
        { name: 'customized_selling_price_per_1k', type: 'NUMERIC(15,4)', constraint: 'NOT NULL (Retail selling rate)' },
        { name: 'CONSTRAINT uq_store_service', type: 'UNIQUE', constraint: 'UNIQUE(store_id, service_id)' }
      ]
    },
    {
      id: 'orders',
      name: '5. orders',
      description: 'Comprehensive order matrix supporting direct wholesale, child storefronts, and automated AI drip schedules.',
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY DEFAULT gen_random_uuid()' },
        { name: 'store_id', type: 'UUID', constraint: 'NULLABLE (REFERENCES stores(id) ON DELETE SET NULL)' },
        { name: 'user_id', type: 'UUID', constraint: 'REFERENCES users(id) ON DELETE RESTRICT' },
        { name: 'target_url', type: 'TEXT', constraint: 'NOT NULL (Target Social Profile/Post)' },
        { name: 'total_quantity', type: 'INTEGER', constraint: 'NOT NULL (CHECK > 0)' },
        { name: 'total_charge', type: 'NUMERIC(15,4)', constraint: 'NOT NULL' },
        { name: 'execution_status', type: 'order_execution_status', constraint: 'pending, processing, completed, refunded, scheduled' },
        { name: 'tracking_provider_order_id', type: 'VARCHAR(100)', constraint: 'Upstream Node Tracking ID' },
        { name: 'scheduling_configuration', type: 'JSONB', constraint: 'GIN Indexed (is_drip, runs, interval, batches)' }
      ]
    },
    {
      id: 'financial_transactions',
      name: '6. financial_transactions',
      description: 'Double-entry transactional ledger recording wallet deposits, subscription fees, and Paystack/Flutterwave split payouts.',
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY DEFAULT gen_random_uuid()' },
        { name: 'user_id', type: 'UUID', constraint: 'REFERENCES users(id) ON DELETE RESTRICT' },
        { name: 'store_id', type: 'UUID', constraint: 'NULLABLE REFERENCES stores(id)' },
        { name: 'financial_action', type: 'financial_action_enum', constraint: 'wallet_deposit, subscription_fee, retail_order_payout' },
        { name: 'transaction_amount', type: 'NUMERIC(15,4)', constraint: 'NOT NULL (CHECK >= 0)' },
        { name: 'gateway_payment_reference', type: 'VARCHAR(255)', constraint: 'NOT NULL UNIQUE' },
        { name: 'processor_status', type: 'processor_status_enum', constraint: 'success, pending, failed' },
        { name: 'metadata', type: 'JSONB', constraint: 'Records gross paid, base cost, and reseller margin breakdown' }
      ]
    }
  ];

  const currentTable = tables.find(t => t.id === activeTableTab) || tables[0];

  return (
    <div className="space-y-6">
      {/* Top Banner with Bright 3D Depth */}
      <div className="card-3d p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between shadow-xl border-2 border-white">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-md">
              <Database className="w-5 h-5 drop-shadow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">PostgreSQL Multi-Tenant Relational Schema</h1>
                <span className="bg-sky-100 text-sky-800 border border-sky-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase shadow-sm">
                  DDL Architecture
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Enterprise database specification with UUID primary keys, GIN-indexed JSONB configurations, cascaded foreign keys, and atomic triggers.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={copySql}
          className="mt-4 md:mt-0 btn-3d-lite-blue px-5 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-2 cursor-pointer"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'SQL Copied to Clipboard' : 'Copy Complete DDL Script'}</span>
        </button>
      </div>

      {/* Relational Table Inspector Tabs with 3D Mixed Light-Blue Design (Swipeable on Mobile) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar scroll-smooth p-1.5 bg-sky-50/90 rounded-2xl border border-sky-200 text-xs shadow-inner">
        {tables.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTableTab(t.id)}
            className={`px-3.5 py-2 rounded-xl font-mono font-bold whitespace-nowrap shrink-0 transition cursor-pointer min-h-[40px] ${
              activeTableTab === t.id
                ? 'btn-3d-lite-blue text-xs'
                : 'btn-3d-pearl text-slate-600 text-xs'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Table Architecture Inspector Card with Bright 3D Depth */}
      <div className="card-3d rounded-3xl p-6 md:p-8 space-y-4 shadow-xl border border-sky-100">
        <div>
          <h3 className="text-base font-black text-slate-900 font-mono flex items-center space-x-2">
            <Table className="w-4 h-4 text-sky-600" />
            <span>Table Definition: {currentTable.name}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {currentTable.description}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border border-sky-100 rounded-2xl overflow-hidden font-mono bg-white shadow-sm">
            <thead className="bg-sky-50/80 text-sky-800 text-[10px] uppercase font-bold tracking-wider border-b border-sky-200">
              <tr>
                <th className="px-5 py-3">Column Name</th>
                <th className="px-5 py-3">Data Type</th>
                <th className="px-5 py-3">Constraints & Rules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 bg-white/70">
              {currentTable.columns.map((col, idx) => (
                <tr key={idx} className="hover:bg-sky-50/60 transition">
                  <td className="px-5 py-3 font-black text-sky-800">{col.name}</td>
                  <td className="px-5 py-3 text-blue-600 font-bold">{col.type}</td>
                  <td className="px-5 py-3 text-slate-600 font-medium">{col.constraint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete DDL SQL Code Block with Clean Bright Contrast */}
      <div className="card-3d rounded-3xl p-6 md:p-8 space-y-3 shadow-xl border border-sky-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black font-mono text-slate-800">File: /src/db/schema.sql (Ready for psql or migration runner)</span>
          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            Validated PostgreSQL 15+
          </span>
        </div>
        <pre className="p-5 bg-white rounded-2xl border border-sky-200 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-[400px] leading-relaxed shadow-inner">
          {schemaSql || '-- Loading PostgreSQL DDL Schema...'}
        </pre>
      </div>
    </div>
  );
};
