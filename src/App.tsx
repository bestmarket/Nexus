/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { AdminCommandDeck } from './components/admin/AdminCommandDeck';
import { B2BProfessionalHub } from './components/b2b/B2BProfessionalHub';
import { B2CStorefront } from './components/b2c/B2CStorefront';
import { DatabaseSchemaViewer } from './components/DatabaseSchemaViewer';
import { Store, User, ServiceWithPricing } from './types';
import { safeFetchJson } from './utils/api';
import { Server, Globe, ShieldCheck, Terminal, ShoppingBag } from 'lucide-react';

const DEFAULT_STORE: Store = {
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
};

const DEFAULT_USERS: User[] = [
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

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('b2c');
  const [stores, setStores] = useState<Store[]>([DEFAULT_STORE]);
  const [currentStore, setCurrentStore] = useState<Store | null>(DEFAULT_STORE);
  const [currentUser, setCurrentUser] = useState<User | null>(DEFAULT_USERS[2]);
  const [allUsers, setAllUsers] = useState<User[]>(DEFAULT_USERS);
  const [services, setServices] = useState<ServiceWithPricing[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchGlobalState = async (targetDomain?: string) => {
    try {
      // 1. Fetch all tenant stores safely
      const tenantsRes = await safeFetchJson<{ success: boolean; data: Store[] }>(
        '/api/tenant/all',
        undefined,
        { success: true, data: [DEFAULT_STORE] }
      );
      if (tenantsRes?.success && tenantsRes.data?.length > 0) {
        setStores(tenantsRes.data);
      }

      // 2. Resolve selected domain or fallback
      const domainToResolve = targetDomain || currentStore?.domain_name || 'socialboost.africa';
      const resolveRes = await safeFetchJson<{ success: boolean; data: any }>(
        `/api/tenant/resolve?tenant=${encodeURIComponent(domainToResolve)}`,
        undefined,
        {
          success: true,
          data: {
            store: DEFAULT_STORE,
            services_catalog: []
          }
        }
      );
      if (resolveRes?.success && resolveRes.data) {
        if (resolveRes.data.store) setCurrentStore(resolveRes.data.store);
        if (resolveRes.data.services_catalog) setServices(resolveRes.data.services_catalog);
      }

      // 3. Fetch users and set appropriate persona
      const usersRes = await safeFetchJson<{ success: boolean; data: User[] }>(
        '/api/admin/users',
        undefined,
        { success: true, data: DEFAULT_USERS }
      );
      if (usersRes?.success && usersRes.data) {
        const usersList: User[] = usersRes.data;
        setAllUsers(usersList);
        if (activeTab === 'admin') {
          setCurrentUser(usersList.find(u => u.role === 'admin') || usersList[0]);
        } else if (activeTab === 'b2b') {
          setCurrentUser(usersList.find(u => u.role === 'reseller') || usersList[1]);
        } else {
          setCurrentUser(usersList.find(u => u.role === 'customer') || usersList[2]);
        }
      }
    } catch (error) {
      console.warn('[App] Error in fetchGlobalState:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalState();
  }, []);

  // Sync user persona when tab changes
  useEffect(() => {
    safeFetchJson<{ success: boolean; data: User[] }>('/api/admin/users', undefined, { success: true, data: DEFAULT_USERS })
      .then(res => {
        if (res?.success && res.data) {
          const usersList: User[] = res.data;
          setAllUsers(usersList);
          if (activeTab === 'admin') {
            setCurrentUser(usersList.find(u => u.role === 'admin') || usersList[0]);
          } else if (activeTab === 'b2b') {
            setCurrentUser(usersList.find(u => u.role === 'reseller') || usersList[1]);
          } else {
            setCurrentUser(usersList.find(u => u.role === 'customer') || usersList[2]);
          }
        }
      });
  }, [activeTab]);

  const handleSelectStore = (store: Store) => {
    setCurrentStore(store);
    fetchGlobalState(store.domain_name);
  };

  return (
    <div className="min-h-screen bg-ambient-mesh text-slate-800 flex flex-col font-sans selection:bg-sky-500 selection:text-white relative">
      {/* Dynamic 3D Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentStore={currentStore}
        allStores={stores}
        onSelectStore={handleSelectStore}
        currentUser={currentUser}
        onRefreshData={() => fetchGlobalState()}
        allUsers={allUsers}
        onSwitchUser={(user) => setCurrentUser(user)}
      />

      {/* Main Content Area with Mobile Bottom Clearance */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-24 md:pb-12 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin shadow-lg shadow-sky-200/50" />
            <p className="text-xs font-mono font-semibold text-sky-700">Bootstrapping 3D Engine & AI Pipelines...</p>
          </div>
        ) : (
          <>
            {activeTab === 'admin' && (
              <AdminCommandDeck 
                onRefreshGlobalData={() => fetchGlobalState()} 
              />
            )}

            {activeTab === 'b2b' && (
              <B2BProfessionalHub 
                currentUser={currentUser} 
                allStores={stores}
                onRefreshData={() => fetchGlobalState()} 
                onPreviewInB2C={(store: Store) => {
                  setCurrentStore(store);
                  setActiveTab('b2c');
                  fetchGlobalState(store.domain_name);
                }}
                onStoreCreated={(newStore: Store) => {
                  setStores(prev => [newStore, ...prev.filter(s => s.id !== newStore.id)]);
                  setCurrentStore(newStore);
                  fetchGlobalState(newStore.domain_name);
                }}
              />
            )}

            {activeTab === 'b2c' && (
              <B2CStorefront 
                currentStore={currentStore} 
                services={services}
                onOrderCompleted={() => fetchGlobalState()}
              />
            )}

            {activeTab === 'schema' && (
              <DatabaseSchemaViewer />
            )}
          </>
        )}
      </main>

      {/* Bright 3D Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-sky-100 text-xs text-slate-500 py-6 mt-16 shadow-[0_-4px_20px_rgba(186,230,253,0.25)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-900 tracking-tight">NexusPulse 3D Engine</span>
            <span>•</span>
            <span className="text-sky-700 font-medium">PostgreSQL Multi-Tenant Schema</span>
            <span>•</span>
            <span className="text-indigo-600 font-medium">Google Gemini 2.5 Flash</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold">3D Domain Router: Online</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 shadow-sm font-semibold">
              Split Settlement Engine: Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
