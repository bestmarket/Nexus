import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Layers, 
  Users, 
  Server, 
  Sliders, 
  CreditCard, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PlusCircle, 
  Key, 
  ArrowUpRight, 
  DollarSign, 
  Globe, 
  TrendingUp, 
  ShieldCheck,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';
import { Order, FinancialTransaction, User, Store } from '../../types';
import { safeFetchJson } from '../../utils/api';

interface AdminCommandDeckProps {
  onRefreshGlobalData: () => void;
}

export const AdminCommandDeck: React.FC<AdminCommandDeckProps> = ({ onRefreshGlobalData }) => {
  const [subTab, setSubTab] = useState<'analytics' | 'orders' | 'ledger' | 'users' | 'providers' | 'storefronts' | 'aiconfig'>('analytics');
  
  // States
  const [analytics, setAnalytics] = useState<any>({
    total_orders: 2,
    gross_merchandise_value_gmv: 16250.0,
    net_platform_profit: 9800.0,
    active_child_panels: 2,
    total_registered_users: 3,
    total_settlements_paid: 5750.0,
    api_throughput_current_rpm: 412,
    average_latency_ms: 68
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filters & Modal States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<User | null>(null);
  const [balanceDelta, setBalanceDelta] = useState<string>('50000');
  
  // New Store Form State
  const [newStoreDomain, setNewStoreDomain] = useState('');
  const [newStoreType, setNewStoreType] = useState<'b2c' | 'b2b'>('b2c');
  const [newStoreName, setNewStoreName] = useState('');

  // AI Prompt config state
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [aiTemperature, setAiTemperature] = useState('0.3');
  const [aiCustomInstruction, setAiCustomInstruction] = useState('Evaluate engagement signals, profile velocity bottlenecks, and highlight high-converting catalog bundles.');

  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const [anRes, ordRes, txRes, usrRes, prvRes, strRes] = await Promise.all([
        safeFetchJson<any>('/api/admin/analytics', undefined, { success: false }),
        safeFetchJson<any>('/api/admin/orders', undefined, { success: false }),
        safeFetchJson<any>('/api/admin/transactions', undefined, { success: false }),
        safeFetchJson<any>('/api/admin/users', undefined, { success: false }),
        safeFetchJson<any>('/api/admin/providers', undefined, { success: false }),
        safeFetchJson<any>('/api/tenant/all', undefined, { success: false })
      ]);

      if (anRes?.success && anRes.data) setAnalytics(anRes.data);
      if (ordRes?.success && ordRes.data) setOrders(ordRes.data);
      if (txRes?.success && txRes.data) setTransactions(txRes.data);
      if (usrRes?.success && usrRes.data) setUsers(usrRes.data);
      if (prvRes?.success && prvRes.data) setProviders(prvRes.data);
      if (strRes?.success && strRes.data) setStores(strRes.data);
    } catch (err: any) {
      console.warn('Admin data load warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const handleAdjustBalance = async () => {
    if (!selectedUserForBalance) return;
    try {
      const res = await fetch('/api/admin/users/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserForBalance.id,
          delta_amount: parseFloat(balanceDelta),
          reason: 'Admin Manual Credit adjustment'
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Successfully adjusted balance: ₦${balanceDelta}`);
        setSelectedUserForBalance(null);
        fetchAllAdminData();
        onRefreshGlobalData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleTier = async (userId: string, currentTier: string) => {
    try {
      const nextTier = currentTier === 'vip' ? 'standard' : 'vip';
      await fetch('/api/admin/users/tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, tier: nextTier })
      });
      fetchAllAdminData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRegenKey = async (userId: string) => {
    try {
      await fetch('/api/admin/users/regenerate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      fetchAllAdminData();
      setStatusMessage('API Key regenerated successfully.');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreDomain) return;
    try {
      const reseller = users.find(u => u.role === 'reseller') || users[0];
      const res = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: reseller.id,
          domain_name: newStoreDomain,
          store_type: newStoreType,
          theme_settings: {
            store_name: newStoreName || `${newStoreDomain.split('.')[0].toUpperCase()} SMM`,
            primary_color: '#38bdf8',
            secondary_color: '#0284c7',
            accent_color: '#0ea5e9',
            currency_symbol: '₦',
            currency_code: 'NGN',
            hero_title: 'Premier Social Growth & Algorithmic Discovery',
            hero_subtitle: 'Automated engagement batches protected by split payout guarantees.',
            support_email: `contact@${newStoreDomain}`
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Child Store '${newStoreDomain}' provisioned successfully!`);
        setNewStoreDomain('');
        setNewStoreName('');
        fetchAllAdminData();
        onRefreshGlobalData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = orderStatusFilter === 'all' || o.execution_status === orderStatusFilter;
    const matchesSearch = 
      o.target_url.toLowerCase().includes(orderSearch.toLowerCase()) || 
      (o.tracking_provider_order_id && o.tracking_provider_order_id.toLowerCase().includes(orderSearch.toLowerCase())) ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Bright 3D Depth */}
      <div className="card-3d p-6 rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between shadow-xl border-2 border-white">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 drop-shadow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Core Administrator Command Deck</h1>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase shadow-sm">
                  Super-Admin Tier
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Global orchestration suite for wholesale API nodes, tenant storefronts, financial split settlement ledgers, and Gemini AI automation.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={() => { fetchAllAdminData(); onRefreshGlobalData(); }}
            disabled={loading}
            className="btn-3d-pearl px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-600 hover:text-emerald-950 font-mono font-bold">×</button>
        </div>
      )}

      {/* Sub Navigation Bar with 3D Mixed Light Blue Design (Swipeable on Mobile) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar scroll-smooth bg-sky-50/90 p-1.5 rounded-2xl border border-sky-200 text-xs shadow-inner">
        {[
          { id: 'analytics', label: 'Command Analytics', icon: BarChart3 },
          { id: 'orders', label: `System Orders (${orders.length})`, icon: Layers },
          { id: 'ledger', label: `Split Settlement Ledger (${transactions.length})`, icon: CreditCard },
          { id: 'users', label: `User & Wallets (${users.length})`, icon: Users },
          { id: 'storefronts', label: `Child Storefronts (${stores.length})`, icon: Globe },
          { id: 'providers', label: 'Central API Nodes', icon: Server },
          { id: 'aiconfig', label: 'Global AI Parameters', icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer min-h-[40px] ${
                isActive
                  ? 'btn-3d-lite-blue text-xs'
                  : 'btn-3d-pearl text-slate-600 text-xs'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANALYTICS SUITE */}
      {subTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Key Metric KPI Cards with Bright 3D Emboss */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="card-3d p-5 rounded-3xl relative overflow-hidden group hover:translate-y-[-2px] transition border border-sky-100 shadow-[0_10px_25px_rgba(186,230,253,0.35)]">
              <div className="absolute top-0 right-0 p-4 opacity-15">
                <DollarSign className="w-16 h-16 text-sky-400" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Merchandise Value (GMV)</span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                ₦{analytics.gross_merchandise_value_gmv.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center mt-3 text-xs text-emerald-600 font-bold space-x-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+24.8% vs last 30d</span>
              </div>
            </div>

            <div className="card-3d p-5 rounded-3xl relative overflow-hidden group hover:translate-y-[-2px] transition border border-sky-100 shadow-[0_10px_25px_rgba(186,230,253,0.35)]">
              <div className="absolute top-0 right-0 p-4 opacity-15">
                <TrendingUp className="w-16 h-16 text-emerald-400" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Platform Margin</span>
              <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                ₦{analytics.net_platform_profit.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center mt-3 text-xs text-slate-500">
                <span>Calculated: Retail minus Base Costs</span>
              </div>
            </div>

            <div className="card-3d p-5 rounded-3xl relative overflow-hidden group hover:translate-y-[-2px] transition border border-sky-100 shadow-[0_10px_25px_rgba(186,230,253,0.35)]">
              <div className="absolute top-0 right-0 p-4 opacity-15">
                <Globe className="w-16 h-16 text-sky-400" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Child Panels</span>
              <div className="text-2xl font-black text-sky-600 mt-1 font-mono">
                {analytics.active_child_panels} Storefronts
              </div>
              <div className="flex items-center mt-3 text-xs text-slate-500">
                <span>Domain isolation & split settlement</span>
              </div>
            </div>

            <div className="card-3d p-5 rounded-3xl relative overflow-hidden group hover:translate-y-[-2px] transition border border-sky-100 shadow-[0_10px_25px_rgba(186,230,253,0.35)]">
              <div className="absolute top-0 right-0 p-4 opacity-15">
                <Server className="w-16 h-16 text-blue-400" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">API Throughput & Latency</span>
              <div className="text-2xl font-black text-blue-600 mt-1 font-mono">
                {analytics.api_throughput_current_rpm} RPM
              </div>
              <div className="flex items-center mt-3 text-xs text-sky-600 font-bold">
                <span>Avg Response: {analytics.average_latency_ms}ms (Sub-100ms)</span>
              </div>
            </div>
          </div>

          {/* Quick Real-Time Flow Visualizer with Bright 3D Cards */}
          <div className="card-3d rounded-3xl p-6 border border-sky-100">
            <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Multi-Tenant Architecture Flow</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Visualizing how requests from custom domains travel through the dynamic router, execute split payment settlements, and dispatch to upstream providers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white border border-sky-200 p-4 rounded-2xl shadow-[0_3px_0_#bae6fd,0_4px_10px_rgba(186,230,253,0.3)]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-300 to-sky-500 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="text-xs font-black text-slate-900">1. Domain Router</div>
                <div className="text-[11px] text-slate-500 mt-1">Host inspection matches reseller domain and applies custom theme + markups.</div>
              </div>

              <div className="bg-white border border-sky-200 p-4 rounded-2xl shadow-[0_3px_0_#bae6fd,0_4px_10px_rgba(186,230,253,0.3)]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-300 to-sky-500 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs font-black text-slate-900">2. Gemini 2.5 Flash</div>
                <div className="text-[11px] text-slate-500 mt-1">Evaluates profile metrics & auto-recommends high-converting catalog bundles.</div>
              </div>

              <div className="bg-white border border-sky-200 p-4 rounded-2xl shadow-[0_3px_0_#bae6fd,0_4px_10px_rgba(186,230,253,0.3)]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-400 to-indigo-500 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="text-xs font-black text-slate-900">3. Split Settlement</div>
                <div className="text-[11px] text-slate-500 mt-1">Paystack webhook routes base cost to Admin, and margin profit to Reseller.</div>
              </div>

              <div className="bg-white border border-sky-200 p-4 rounded-2xl shadow-[0_3px_0_#bae6fd,0_4px_10px_rgba(186,230,253,0.3)]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-400 to-purple-500 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <Server className="w-4 h-4" />
                </div>
                <div className="text-xs font-black text-slate-900">4. Upstream Node API</div>
                <div className="text-[11px] text-slate-500 mt-1">Immediate or staggered drip execution dispatched with provider tracking.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM ORDERS */}
      {subTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 card-3d p-4 rounded-2xl border border-sky-100">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-sky-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search orders by URL, tracking ID, or Order ID..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-bold">Status:</span>
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none shadow-sm font-semibold"
              >
                <option value="all">All Orders</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="scheduled">Scheduled / Drip</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="card-3d rounded-2xl overflow-hidden shadow-xl border border-sky-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-sky-50/80 text-sky-800 uppercase font-mono text-[10px] tracking-wider border-b border-sky-200">
                  <tr>
                    <th className="px-4 py-3 font-bold">Order ID</th>
                    <th className="px-4 py-3 font-bold">Target Profile / Link</th>
                    <th className="px-4 py-3 font-bold">Service</th>
                    <th className="px-4 py-3 font-bold">Quantity</th>
                    <th className="px-4 py-3 font-bold">Charge</th>
                    <th className="px-4 py-3 font-bold">Execution / Drip</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 bg-white/70">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        No orders match the current criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-sky-50/60 transition">
                        <td className="px-4 py-3 font-mono font-bold text-sky-700">
                          {order.id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate font-mono text-slate-800">
                          <a href={order.target_url} target="_blank" rel="noopener noreferrer" className="hover:text-sky-600 underline decoration-sky-200">
                            {order.target_url}
                          </a>
                        </td>
                        <td className="px-4 py-3 max-w-[220px] truncate text-slate-800 font-medium">
                          {order.service_name || 'Standard Package'}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {order.total_quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-sky-600 font-black">
                          ₦{order.total_charge.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          {order.scheduling_configuration?.is_drip ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-300">
                              Drip ({order.scheduling_configuration.runs} runs / {order.scheduling_configuration.interval_minutes}m)
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px] font-medium">Instant Direct</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.execution_status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : order.execution_status === 'processing'
                              ? 'bg-sky-100 text-sky-800 border border-sky-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {order.execution_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px] whitespace-nowrap font-mono">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SPLIT SETTLEMENT LEDGER */}
      {subTab === 'ledger' && (
        <div className="space-y-4">
          <div className="card-3d p-4 rounded-2xl flex items-center justify-between border border-sky-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Double-Entry Financial Transactions & Webhook Settlements</span>
              </h3>
              <p className="text-xs text-slate-500">
                Audits all Paystack/Flutterwave split payouts, admin base cost transfers, and wholesale wallet deposits.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-700 font-black bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl shadow-sm">
              Total Records: {transactions.length}
            </span>
          </div>

          <div className="card-3d rounded-2xl overflow-hidden shadow-xl border border-sky-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-sky-50/80 text-sky-800 uppercase font-mono text-[10px] tracking-wider border-b border-sky-200">
                  <tr>
                    <th className="px-4 py-3 font-bold">Gateway Ref</th>
                    <th className="px-4 py-3 font-bold">Financial Action</th>
                    <th className="px-4 py-3 font-bold">Amount</th>
                    <th className="px-4 py-3 font-bold">Beneficiary User ID</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Settlement Metadata</th>
                    <th className="px-4 py-3 font-bold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 bg-white/70">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-sky-50/60 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {tx.gateway_payment_reference}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          tx.financial_action === 'retail_order_payout'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {tx.financial_action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-black text-slate-900">
                        ₦{tx.transaction_amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        {tx.user_id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {tx.processor_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[280px] truncate text-[11px] font-mono text-slate-500">
                        {JSON.stringify(tx.metadata || {})}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px] whitespace-nowrap font-mono">
                        {new Date(tx.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USERS & WALLETS */}
      {subTab === 'users' && (
        <div className="space-y-4">
          <div className="card-3d rounded-2xl overflow-hidden shadow-xl border border-sky-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-sky-50/80 text-sky-800 uppercase font-mono text-[10px] tracking-wider border-b border-sky-200">
                  <tr>
                    <th className="px-4 py-3 font-bold">Email Address</th>
                    <th className="px-4 py-3 font-bold">Role</th>
                    <th className="px-4 py-3 font-bold">Tier</th>
                    <th className="px-4 py-3 font-bold">Wallet Balance</th>
                    <th className="px-4 py-3 font-bold">API Key</th>
                    <th className="px-4 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 bg-white/70">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-sky-50/60 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] uppercase font-bold text-sky-700">
                        {u.role}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleTier(u.id, u.tier)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase transition ${
                            u.tier === 'vip'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 shadow-sm'
                              : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                          }`}
                          title="Click to toggle tier"
                        >
                          {u.tier}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono font-black text-emerald-600">
                        ₦{u.wallet_balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        {u.api_key.substring(0, 16)}...
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => setSelectedUserForBalance(u)}
                          className="btn-3d-lite-blue px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer"
                        >
                          Credit/Debit
                        </button>
                        <button
                          onClick={() => handleRegenKey(u.id)}
                          className="btn-3d-pearl px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer"
                          title="Regenerate API Key"
                        >
                          <Key className="w-3 h-3 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal for Balance Adjustment */}
          {selectedUserForBalance && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="card-3d rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border-2 border-sky-200">
                <div className="flex items-center justify-between border-b border-sky-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Adjust Wallet Balance</span>
                  </h3>
                  <button onClick={() => setSelectedUserForBalance(null)} className="w-7 h-7 rounded-lg bg-sky-50 text-slate-500 hover:text-slate-900 font-mono text-xs border border-sky-200">✕</button>
                </div>
                <p className="text-xs text-slate-600">
                  Target Account: <span className="font-mono text-slate-900 font-bold">{selectedUserForBalance.email}</span>
                  <br />
                  Current Balance: <span className="font-mono text-emerald-600 font-black">₦{selectedUserForBalance.wallet_balance.toFixed(2)}</span>
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Delta Amount (Positive to credit, negative to debit in NGN):
                  </label>
                  <input
                    type="number"
                    value={balanceDelta}
                    onChange={e => setBalanceDelta(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono focus:border-sky-500 shadow-inner"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setSelectedUserForBalance(null)}
                    className="btn-3d-pearl px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdjustBalance}
                    className="btn-3d-lite-blue px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
                  >
                    Confirm Balance Adjustment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CHILD STOREFRONTS */}
      {subTab === 'storefronts' && (
        <div className="space-y-6">
          {/* Add Store Form */}
          <form onSubmit={handleCreateStore} className="card-3d p-6 rounded-3xl space-y-4 border border-sky-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
              <PlusCircle className="w-4 h-4 text-sky-600" />
              <span>Provision New Multi-Tenant Child Storefront</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Custom Domain Name:</label>
                <input
                  type="text"
                  placeholder="e.g. viralsocial.co"
                  value={newStoreDomain}
                  onChange={e => setNewStoreDomain(e.target.value)}
                  required
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:border-sky-500 shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Store Type:</label>
                <select
                  value={newStoreType}
                  onChange={e => setNewStoreType(e.target.value as any)}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-sky-500 shadow-sm font-semibold"
                >
                  <option value="b2c">B2C Retail Child Panel</option>
                  <option value="b2b">B2B Wholesaler Engine</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Brand Name:</label>
                <input
                  type="text"
                  placeholder="e.g. ViralSocial Africa"
                  value={newStoreName}
                  onChange={e => setNewStoreName(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-sky-500 shadow-inner"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-3d-lite-blue px-5 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Deploy Child Storefront</span>
              </button>
            </div>
          </form>

          {/* Stores List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stores.map(store => (
              <div key={store.id} className="card-3d p-5 rounded-3xl space-y-3 border border-sky-100 hover:translate-y-[-2px] transition shadow-[0_8px_20px_rgba(186,230,253,0.3)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-sky-600" />
                      <span>{store.theme_settings?.store_name || store.domain_name}</span>
                    </h4>
                    <span className="font-mono text-xs text-sky-700 font-bold">{store.domain_name}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-black ${
                    store.store_type === 'b2c' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-sky-100 text-sky-800 border border-sky-300'
                  }`}>
                    {store.store_type}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 font-medium">
                  <div>Owner: <span className="font-mono text-slate-900 font-bold">{(store as any).owner_email || store.owner_id}</span></div>
                  <div>Active Status: <span className="text-emerald-600 font-bold">{store.is_active ? 'Online / Routing Active' : 'Suspended'}</span></div>
                  <div>Subscription Expiry: <span className="font-mono text-slate-700">{new Date(store.current_subscription_expiry).toLocaleDateString()}</span></div>
                </div>

                <div className="pt-2 border-t border-sky-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Theme: {store.theme_settings?.primary_color}</span>
                  <span className="text-sky-600 font-bold hover:underline cursor-pointer">Edit Domain Config →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CENTRAL API NODES */}
      {subTab === 'providers' && (
        <div className="space-y-4">
          <div className="card-3d p-4 rounded-2xl border border-sky-100">
            <h3 className="text-sm font-black text-slate-900 mb-1">Central Upstream Aggregator API Health</h3>
            <p className="text-xs text-slate-500">
              Live telemetry on upstream high-volume API providers, failover routing, and upstream provider credit balances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {providers.map(p => (
              <div key={p.identifier} className="card-3d p-5 rounded-3xl space-y-3 border border-sky-100">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900">{p.name}</span>
                  <span className="flex items-center space-x-1.5 text-xs text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>{p.status.toUpperCase()}</span>
                  </span>
                </div>

                <div className="font-mono text-xs text-sky-800 bg-sky-50/70 p-2.5 rounded-xl border border-sky-200 truncate font-semibold">
                  {p.endpoint}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-sky-100 shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Latency</span>
                    <span className="font-mono font-black text-slate-900">{p.latency_ms}ms</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-sky-100 shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Success Rate</span>
                    <span className="font-mono font-black text-emerald-600">{p.success_rate}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-sky-100 shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Upstream Bal</span>
                    <span className="font-mono font-black text-sky-600">{p.wallet_balance_upstream}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: GLOBAL AI CONFIG */}
      {subTab === 'aiconfig' && (
        <div className="card-3d p-6 md:p-8 rounded-3xl space-y-5 max-w-3xl border border-sky-100">
          <div className="border-b border-sky-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>Google Gemini AI Architecture Parameters</span>
            </h3>
            <p className="text-xs text-slate-500">
              Configure models, system instructions, and temperature for the Profile Optimizer & Checkout Catalyst engine.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Active Model Engine:</label>
              <select
                value={aiModel}
                onChange={e => setAiModel(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-xl p-2.5 text-slate-800 font-mono font-semibold focus:border-sky-500 shadow-sm"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Standard Profile Catalyst)</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash (Latest Ultra-Fast Reasoner)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Temperature ({aiTemperature}):</label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={aiTemperature}
                onChange={e => setAiTemperature(e.target.value)}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Core Audit System Instruction:</label>
              <textarea
                rows={3}
                value={aiCustomInstruction}
                onChange={e => setAiCustomInstruction(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-xl p-2.5 text-slate-800 font-mono text-xs focus:border-sky-500 shadow-inner"
              />
            </div>

            <div className="p-3.5 bg-sky-50/70 rounded-2xl border border-sky-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">API Key Telemetry Status</span>
                <p className="text-[11px] text-slate-500">
                  Calls configured with User-Agent: 'aistudio-build' via @google/genai SDK
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[10px] font-black shadow-sm">
                OPERATIONAL
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
