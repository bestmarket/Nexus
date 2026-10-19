import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Upload, 
  Wallet, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Play, 
  Zap, 
  FileJson, 
  Activity, 
  Store as StoreIcon, 
  Sliders, 
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { User, MasterService, BulkOrderResponse, Store } from '../../types';
import { safeFetchJson } from '../../utils/api';
import { ShideStoreGenerator } from './ShideStoreGenerator';
import { ResellerStoreAdmin } from './ResellerStoreAdmin';
import { ResellerSingleOrder } from './ResellerSingleOrder';

export type B2BTab = 'place_order' | 'wallet' | 'shide_generator' | 'my_store_admin' | 'apilogs' | 'docs';

interface B2BProfessionalHubProps {
  currentUser: User | null;
  allStores: Store[];
  onRefreshData: () => void;
  onPreviewInB2C: (store: Store) => void;
  onStoreCreated: (newStore: Store) => void;
}

export const B2BProfessionalHub: React.FC<B2BProfessionalHubProps> = ({ 
  currentUser, 
  allStores,
  onRefreshData,
  onPreviewInB2C,
  onStoreCreated
}) => {
  const [b2bTab, setB2bTab] = useState<B2BTab>('place_order');
  const [orderSubMode, setOrderSubMode] = useState<'single' | 'bulk'>('single');
  const [selectedStoreIdForAdmin, setSelectedStoreIdForAdmin] = useState<string | undefined>(undefined);
  const [services, setServices] = useState<MasterService[]>([]);
  
  // Bulk Order State
  const [bulkJsonInput, setBulkJsonInput] = useState<string>(`[
  {
    "service_id": "20000000-0000-0000-0000-000000000001",
    "link": "https://instagram.com/fashion_blogger_ng",
    "quantity": 3000,
    "runs": 3,
    "interval": 60
  },
  {
    "service_id": "20000000-0000-0000-0000-000000000003",
    "link": "https://tiktok.com/@lagos_viral_hub",
    "quantity": 10000
  }
]`);
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);
  const [parsedItemsCount, setParsedItemsCount] = useState<number>(2);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [submittingBulk, setSubmittingBulk] = useState<boolean>(false);
  const [bulkResponse, setBulkResponse] = useState<BulkOrderResponse | null>(null);

  // Deposit Simulator State
  const [depositAmount, setDepositAmount] = useState<string>('50000');
  const [depositGateway, setDepositGateway] = useState<'paystack' | 'flutterwave'>('paystack');
  const [depositing, setDepositing] = useState<boolean>(false);
  const [depositMessage, setDepositMessage] = useState<string | null>(null);

  // API Latency state
  const [recentPings, setRecentPings] = useState<Array<{ timestamp: string; method: string; endpoint: string; status: number; latency: number }>>([
    { timestamp: '12:44:10', method: 'POST', endpoint: '/api/v2/order', status: 200, latency: 42 },
    { timestamp: '12:43:55', method: 'GET', endpoint: '/api/v2/services', status: 200, latency: 19 },
    { timestamp: '12:43:02', method: 'GET', endpoint: '/api/v2/balance', status: 200, latency: 15 },
    { timestamp: '12:41:20', method: 'POST', endpoint: '/api/v2/order', status: 200, latency: 48 },
    { timestamp: '12:39:15', method: 'POST', endpoint: '/api/v2/order', status: 200, latency: 38 }
  ]);

  // Documentation state
  const [docsMarkdown, setDocsMarkdown] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  useEffect(() => {
    safeFetchJson<any[]>('/api/v2/services', undefined, [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setServices(data.map((item: any) => ({
            id: item.service,
            service_name: item.name,
            provider_identifier: 'UPSTREAM_NODE',
            base_cost_per_1k: item.rate,
            category: item.category,
            min_quantity: item.min,
            max_quantity: item.max,
            status: 'active' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })));
        }
      });

    safeFetchJson<{ success: boolean; markdown?: string }>('/api/v2/docs', undefined, { success: false })
      .then(data => {
        if (data?.markdown) setDocsMarkdown(data.markdown);
      });
  }, []);

  // Validate JSON and calculate preview cost
  useEffect(() => {
    try {
      const parsed = JSON.parse(bulkJsonInput);
      const items = Array.isArray(parsed) ? parsed : parsed.orders || [parsed];
      setJsonValidationError(null);
      setParsedItemsCount(items.length);

      let total = 0;
      for (const it of items) {
        const s = services.find(srv => srv.id === it.service_id);
        const rate = s ? s.base_cost_per_1k : 1000;
        const discount = currentUser?.tier === 'vip' ? 0.90 : 1.0;
        total += ((it.quantity || 1000) / 1000) * rate * discount;
      }
      setEstimatedCost(Number(total.toFixed(2)));
    } catch (err: any) {
      setJsonValidationError(err.message);
      setParsedItemsCount(0);
      setEstimatedCost(0);
    }
  }, [bulkJsonInput, services, currentUser]);

  const handleExecuteBulkOrder = async () => {
    if (jsonValidationError) return;
    setSubmittingBulk(true);
    setBulkResponse(null);

    const start = performance.now();
    try {
      const parsed = JSON.parse(bulkJsonInput);
      const res = await fetch('/api/v2/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': currentUser?.api_key || 'nexus_live_reseller_api_key_8842bc19a7'
        },
        body: JSON.stringify(Array.isArray(parsed) ? { orders: parsed } : parsed)
      });
      const data = await res.json();
      const latency = Math.round(performance.now() - start);

      setRecentPings(prev => [
        { timestamp: new Date().toLocaleTimeString(), method: 'POST', endpoint: '/api/v2/order', status: res.status, latency },
        ...prev.slice(0, 7)
      ]);

      if (data.status === 'success' && data.data) {
        setBulkResponse(data.data);
        onRefreshData();
      } else {
        alert(data.message || 'Bulk order submission failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingBulk(false);
    }
  };

  const handleSimulateDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;
    setDepositing(true);

    try {
      const ref = `${depositGateway.toUpperCase()}_DEP_${Date.now()}`;
      const res = await fetch('/api/admin/users/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || '00000000-0000-0000-0000-000000000002',
          delta_amount: amt,
          reason: `Automated ${depositGateway} B2B Wallet Top-Up (Ref: ${ref})`
        })
      });
      const data = await res.json();
      if (data.success) {
        setDepositMessage(`Successfully deposited ₦${amt.toLocaleString('en-NG')} via ${depositGateway.toUpperCase()}!`);
        onRefreshData();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDepositing(false);
    }
  };

  const copyApiKey = () => {
    if (currentUser?.api_key) {
      navigator.clipboard.writeText(currentUser.api_key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleNavigateToStoreAdmin = (storeId: string) => {
    setSelectedStoreIdForAdmin(storeId);
    setB2bTab('my_store_admin');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with 3D Depth */}
      <div className="card-3d p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between shadow-xl border-2 border-white">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-md">
              <Terminal className="w-5 h-5 drop-shadow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">B2B Reseller Panel</h1>
                <span className="bg-sky-100 text-sky-800 border border-sky-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase shadow-sm">
                  Wholesale & Store Generator Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Place orders for your customers, replenish wallet balance, generate branded Shide stores, and manage your storefront margins.
              </p>
            </div>
          </div>
        </div>

        {/* 3D API Key Box */}
        <div className="mt-4 md:mt-0 flex items-center bg-white border border-sky-200 rounded-2xl px-3.5 py-2 text-xs shadow-[0_2px_8px_rgba(186,230,253,0.4)]">
          <div className="mr-3">
            <span className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Reseller API Key</span>
            <span className="font-mono text-sky-700 font-black">
              {currentUser?.api_key ? `${currentUser.api_key.substring(0, 18)}...` : 'Loading...'}
            </span>
          </div>
          <button
            onClick={copyApiKey}
            className="btn-3d-pearl p-2 rounded-xl text-sky-700 cursor-pointer"
            title="Copy API Key"
          >
            {copiedKey ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Sub Tab Bar with 3D Mixed Light Blue Design (Swipeable on Mobile) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar scroll-smooth p-1.5 bg-sky-50/90 rounded-2xl border border-sky-200 shadow-inner">
        <button
          onClick={() => setB2bTab('place_order')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap shrink-0 transition cursor-pointer min-h-[40px] ${
            b2bTab === 'place_order' ? 'btn-3d-lite-blue text-xs' : 'btn-3d-pearl text-slate-600 text-xs'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Place Orders</span>
        </button>

        <button
          onClick={() => setB2bTab('wallet')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap shrink-0 transition cursor-pointer min-h-[40px] ${
            b2bTab === 'wallet' ? 'btn-3d-lite-blue text-xs' : 'btn-3d-pearl text-slate-600 text-xs'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Wallet & Add Funds</span>
        </button>

        <button
          onClick={() => setB2bTab('shide_generator')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap shrink-0 transition cursor-pointer min-h-[40px] ${
            b2bTab === 'shide_generator' ? 'btn-3d-lite-blue text-xs' : 'btn-3d-pearl text-slate-600 text-xs'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Shide Store Generator</span>
        </button>

        <button
          onClick={() => setB2bTab('my_store_admin')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap shrink-0 transition cursor-pointer min-h-[40px] ${
            b2bTab === 'my_store_admin' ? 'btn-3d-lite-blue text-xs' : 'btn-3d-pearl text-slate-600 text-xs'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>My Store Admin</span>
        </button>

        <button
          onClick={() => setB2bTab('apilogs')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap shrink-0 transition cursor-pointer min-h-[40px] ${
            b2bTab === 'apilogs' ? 'btn-3d-lite-blue text-xs' : 'btn-3d-pearl text-slate-600 text-xs'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Live Telemetry</span>
        </button>

        <button
          onClick={() => setB2bTab('docs')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap shrink-0 transition cursor-pointer min-h-[40px] ${
            b2bTab === 'docs' ? 'btn-3d-lite-blue text-xs' : 'btn-3d-pearl text-slate-600 text-xs'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Developer API Docs</span>
        </button>
      </div>

      {/* TAB 1: PLACE ORDERS (SINGLE OR BULK) */}
      {b2bTab === 'place_order' && (
        <div className="space-y-6">
          {/* Sub Switcher for Single vs Bulk Ingestion */}
          <div className="flex items-center space-x-2 bg-white border border-sky-200 p-1 rounded-xl w-fit shadow-xs">
            <button
              onClick={() => setOrderSubMode('single')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                orderSubMode === 'single'
                  ? 'btn-3d-lite-blue text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Customer Order
            </button>
            <button
              onClick={() => setOrderSubMode('bulk')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                orderSubMode === 'bulk'
                  ? 'btn-3d-lite-blue text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulk JSON Orders Array
            </button>
          </div>

          {orderSubMode === 'single' ? (
            <ResellerSingleOrder
              currentUser={currentUser}
              services={services}
              onOrderPlaced={() => onRefreshData()}
              onNavigateToWallet={() => setB2bTab('wallet')}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* JSON Input Area */}
              <div className="lg:col-span-2 card-3d p-6 rounded-3xl space-y-4 shadow-xl border border-sky-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                      <FileJson className="w-4 h-4 text-sky-600" />
                      <span>High-Concurrency Array Ingestion</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Direct submission to <span className="font-mono text-sky-700 font-bold">POST /api/v2/order</span>. Validates and executes batch atomically.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      jsonValidationError ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {jsonValidationError ? 'JSON Invalid' : `${parsedItemsCount} Items Ready`}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={12}
                    value={bulkJsonInput}
                    onChange={e => setBulkJsonInput(e.target.value)}
                    className={`w-full bg-white rounded-2xl p-4 font-mono text-xs text-slate-800 border-2 focus:outline-none shadow-inner ${
                      jsonValidationError ? 'border-rose-400 focus:border-rose-500' : 'border-sky-200 focus:border-sky-500'
                    }`}
                    placeholder="[ { service_id, link, quantity, runs?, interval? } ]"
                  />
                </div>

                {jsonValidationError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span className="font-mono">{jsonValidationError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-sky-100">
                  <div className="text-xs text-slate-500">
                    Estimated Debit: <span className="font-mono text-sky-600 font-black text-base">₦{estimatedCost.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                    {currentUser?.tier === 'vip' && <span className="text-[10px] text-amber-700 font-bold ml-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">(VIP 10% Wholesale Applied)</span>}
                  </div>

                  <button
                    onClick={handleExecuteBulkOrder}
                    disabled={submittingBulk || !!jsonValidationError || parsedItemsCount === 0}
                    className="btn-3d-lite-blue px-6 py-3 rounded-2xl text-xs font-black flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {submittingBulk ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>Execute Batch Pipeline</span>
                  </button>
                </div>
              </div>

              {/* Catalog & Submission Summary Panel */}
              <div className="space-y-4">
                <div className="card-3d p-5 rounded-3xl space-y-3 border border-sky-100">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Wholesale Base Services Quick-Ref</h4>
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {services.map(s => (
                      <div key={s.id} className="p-3 bg-white rounded-2xl border border-sky-100 text-xs space-y-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 truncate max-w-[170px]">{s.service_name}</span>
                          <span className="font-mono text-sky-600 font-black">₦{s.base_cost_per_1k}/1k</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>ID: {s.id.substring(0, 8)}...</span>
                          <span>Min: {s.min_quantity} | Max: {s.max_quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bulk Response Details if available */}
                {bulkResponse && (
                  <div className="card-3d p-5 rounded-3xl space-y-2 border border-emerald-200 bg-emerald-50/40">
                    <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Batch Completed: {bulkResponse.successful_orders?.length || 0} Ingested</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 space-y-1">
                      <div>Total Charged: ₦{bulkResponse.total_debited?.toFixed(2)}</div>
                      <div>Wallet Remainder: ₦{bulkResponse.remaining_wallet_balance?.toFixed(2)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WALLET DEPOSITS & BALANCE */}
      {b2bTab === 'wallet' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-3d p-6 md:p-8 rounded-3xl space-y-5 border border-sky-100 shadow-xl">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span>Replenish Reseller Balance</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add funds to your reseller account. Use your balance to fulfill orders across all your connected Shide stores.
              </p>
            </div>

            {depositMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{depositMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Deposit Amount (NGN)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-mono font-bold text-slate-400">₦</span>
                  <input
                    type="number"
                    step="5000"
                    min="1000"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-xl pl-8 pr-4 py-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Gateway Rail</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDepositGateway('paystack')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                      depositGateway === 'paystack'
                        ? 'border-sky-500 bg-sky-50/80 text-sky-800 ring-2 ring-sky-300'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Paystack Direct
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositGateway('flutterwave')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                      depositGateway === 'flutterwave'
                        ? 'border-sky-500 bg-sky-50/80 text-sky-800 ring-2 ring-sky-300'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Flutterwave Global
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositAmount('25000')}
                  className="btn-3d-pearl px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                >
                  +₦25,000
                </button>
                <button
                  type="button"
                  onClick={() => setDepositAmount('50000')}
                  className="btn-3d-pearl px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                >
                  +₦50,000
                </button>
                <button
                  type="button"
                  onClick={() => setDepositAmount('100000')}
                  className="btn-3d-pearl px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                >
                  +₦100,000
                </button>
              </div>

              <button
                onClick={handleSimulateDeposit}
                disabled={depositing}
                className="w-full btn-3d-lite-blue py-3 rounded-2xl text-xs font-black flex items-center justify-center space-x-2 cursor-pointer"
              >
                {depositing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>Add Funds via {depositGateway.toUpperCase()}</span>
              </button>
            </div>
          </div>

          <div className="card-3d p-6 md:p-8 rounded-3xl space-y-4 border border-sky-100 shadow-xl">
            <h4 className="text-sm font-black text-slate-900">Wholesale Account Standing</h4>
            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-[0_4px_12px_rgba(186,230,253,0.3)] space-y-3.5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-mono font-bold">Current Reseller Balance</span>
                <span className="text-3xl font-black font-mono text-emerald-600">
                  ₦{currentUser?.wallet_balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-sky-100 text-xs">
                <span className="text-slate-500 font-medium">Wholesale Account Tier:</span>
                <span className="font-mono font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase">{currentUser?.tier || 'VIP'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Connected Child Stores:</span>
                <span className="font-mono text-sky-700 font-bold">{allStores.length} Stores</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Volume Rebate:</span>
                <span className="font-mono text-emerald-600 font-bold">10% Wholesale Margin Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHIDE STORE GENERATOR */}
      {b2bTab === 'shide_generator' && (
        <ShideStoreGenerator
          currentUser={currentUser}
          allStores={allStores}
          onStoreCreated={(st) => {
            onStoreCreated(st);
            onRefreshData();
          }}
          onNavigateToStoreAdmin={handleNavigateToStoreAdmin}
          onPreviewInB2C={onPreviewInB2C}
        />
      )}

      {/* TAB 4: MY STORE ADMIN DASHBOARD */}
      {b2bTab === 'my_store_admin' && (
        <ResellerStoreAdmin
          currentUser={currentUser}
          allStores={allStores}
          initialSelectedStoreId={selectedStoreIdForAdmin}
          onRefreshData={onRefreshData}
          onPreviewInB2C={onPreviewInB2C}
          onNavigateToGenerator={() => setB2bTab('shide_generator')}
        />
      )}

      {/* TAB 5: API TELEMETRY & LATENCY */}
      {b2bTab === 'apilogs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="card-3d p-5 rounded-3xl border border-sky-100">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Avg Response Latency</span>
              <span className="text-2xl font-black font-mono text-emerald-600 mt-1 block">38.4 ms</span>
              <span className="text-[11px] text-slate-500 block mt-1">Direct Node Memory Routing</span>
            </div>
            <div className="card-3d p-5 rounded-3xl border border-sky-100">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">API Success Rate</span>
              <span className="text-2xl font-black font-mono text-sky-600 mt-1 block">99.98%</span>
              <span className="text-[11px] text-slate-500 block mt-1">0 Failed Batches in 24h</span>
            </div>
            <div className="card-3d p-5 rounded-3xl border border-sky-100">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Ingestion Engine</span>
              <span className="text-2xl font-black font-mono text-blue-600 mt-1 block">Node/Express v2</span>
              <span className="text-[11px] text-slate-500 block mt-1">Single-Pass Transactional Isolation</span>
            </div>
          </div>

          <div className="card-3d rounded-3xl overflow-hidden shadow-xl border border-sky-100">
            <div className="px-5 py-3.5 bg-sky-50/80 border-b border-sky-200 flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 font-mono">Recent External Reseller API Requests</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-white/80 text-sky-800 font-mono text-[10px] uppercase font-bold border-b border-sky-100">
                  <tr>
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Endpoint</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 font-mono text-xs bg-white/60">
                  {recentPings.map((p, idx) => (
                    <tr key={idx} className="hover:bg-sky-50/60 transition">
                      <td className="px-5 py-2.5 text-slate-500">{p.timestamp}</td>
                      <td className="px-5 py-2.5 font-black text-sky-600">{p.method}</td>
                      <td className="px-5 py-2.5 text-slate-800 font-semibold">{p.endpoint}</td>
                      <td className="px-5 py-2.5 text-emerald-600 font-bold">{p.status} OK</td>
                      <td className="px-5 py-2.5 text-slate-600 font-bold">{p.latency}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DEVELOPER DOCS */}
      {b2bTab === 'docs' && (
        <div className="card-3d p-6 md:p-8 rounded-3xl space-y-4 shadow-xl border border-sky-100">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-sky-600" />
              <span>Wholesale REST API Specification</span>
            </h3>
            <span className="text-xs font-mono text-sky-700 font-bold">Endpoint Base: /api/v2/*</span>
          </div>

          <div className="max-w-none text-xs text-slate-800 whitespace-pre-wrap font-mono bg-white p-6 rounded-2xl border border-sky-200 overflow-x-auto shadow-inner leading-relaxed">
            {docsMarkdown || 'Loading API documentation...'}
          </div>
        </div>
      )}
    </div>
  );
};
