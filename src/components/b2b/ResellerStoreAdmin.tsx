import React, { useState, useEffect } from 'react';
import { 
  Store as StoreIcon, 
  Globe, 
  Settings, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  ExternalLink, 
  Clock, 
  Check, 
  CreditCard, 
  Zap, 
  ShieldCheck, 
  Save, 
  AlertCircle 
} from 'lucide-react';
import { Store, User, ServiceWithPricing, Order } from '../../types';
import { safeFetchJson } from '../../utils/api';

interface ResellerStoreAdminProps {
  currentUser: User | null;
  allStores: Store[];
  initialSelectedStoreId?: string;
  onRefreshData: () => void;
  onPreviewInB2C: (store: Store) => void;
  onNavigateToGenerator: () => void;
}

export const ResellerStoreAdmin: React.FC<ResellerStoreAdminProps> = ({
  currentUser,
  allStores,
  initialSelectedStoreId,
  onRefreshData,
  onPreviewInB2C,
  onNavigateToGenerator
}) => {
  // Filter stores owned by current user (or fallback to all stores if admin/reseller demo)
  const resellerStores = allStores.filter(
    s => s.owner_id === currentUser?.id || currentUser?.role === 'admin' || s.owner_id === '00000000-0000-0000-0000-000000000002'
  );

  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    initialSelectedStoreId || (resellerStores[0]?.id ?? allStores[0]?.id ?? '')
  );

  const selectedStore = allStores.find(s => s.id === selectedStoreId) || resellerStores[0] || allStores[0];

  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'pricing' | 'orders' | 'webhook'>('settings');

  // Store Settings Form State
  const [storeName, setStoreName] = useState(selectedStore?.theme_settings.store_name || '');
  const [domainName, setDomainName] = useState(selectedStore?.domain_name || '');
  const [isActive, setIsActive] = useState<boolean>(selectedStore?.is_active ?? true);
  const [announcement, setAnnouncement] = useState(selectedStore?.theme_settings.announcement || '');
  const [heroTitle, setHeroTitle] = useState(selectedStore?.theme_settings.hero_title || '');
  const [heroSubtitle, setHeroSubtitle] = useState(selectedStore?.theme_settings.hero_subtitle || '');
  const [supportEmail, setSupportEmail] = useState(selectedStore?.theme_settings.support_email || '');
  const [primaryColor, setPrimaryColor] = useState(selectedStore?.theme_settings.primary_color || '#38bdf8');
  const [secondaryColor, setSecondaryColor] = useState(selectedStore?.theme_settings.secondary_color || '#0284c7');
  const [currencySymbol, setCurrencySymbol] = useState(selectedStore?.theme_settings.currency_symbol || '₦');

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Store Pricing state
  const [storeServices, setStoreServices] = useState<ServiceWithPricing[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [editingPriceMap, setEditingPriceMap] = useState<Record<string, string>>({});
  const [savingServiceId, setSavingServiceId] = useState<string | null>(null);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState<string | null>(null);

  // Store Orders state
  const [storeOrders, setStoreOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Webhook Simulator State
  const [simServiceId, setSimServiceId] = useState<string>('');
  const [simQuantity, setSimQuantity] = useState<number>(3000);
  const [simCustomerEmail, setSimCustomerEmail] = useState<string>('buyer@lagosfashion.ng');
  const [simulatingWebhook, setSimulatingWebhook] = useState<boolean>(false);
  const [webhookResult, setWebhookResult] = useState<any>(null);

  // Sync state when selectedStore changes
  useEffect(() => {
    if (selectedStore) {
      setStoreName(selectedStore.theme_settings.store_name || '');
      setDomainName(selectedStore.domain_name || '');
      setIsActive(selectedStore.is_active);
      setAnnouncement(selectedStore.theme_settings.announcement || '');
      setHeroTitle(selectedStore.theme_settings.hero_title || '');
      setHeroSubtitle(selectedStore.theme_settings.hero_subtitle || '');
      setSupportEmail(selectedStore.theme_settings.support_email || '');
      setPrimaryColor(selectedStore.theme_settings.primary_color || '#38bdf8');
      setSecondaryColor(selectedStore.theme_settings.secondary_color || '#0284c7');
      setCurrencySymbol(selectedStore.theme_settings.currency_symbol || '₦');

      fetchStoreServices(selectedStore.id);
      fetchStoreOrders(selectedStore.id);
    }
  }, [selectedStore?.id]);

  const fetchStoreServices = async (storeId: string) => {
    setLoadingServices(true);
    try {
      const res = await safeFetchJson<{ success: boolean; data: ServiceWithPricing[] }>(
        `/api/b2b/stores/${storeId}/pricing`,
        undefined,
        { success: false, data: [] }
      );
      if (res?.success && res.data) {
        setStoreServices(res.data);
        if (res.data[0]) setSimServiceId(res.data[0].id);
        const priceMap: Record<string, string> = {};
        res.data.forEach(s => {
          priceMap[s.id] = String(s.customized_selling_price_per_1k);
        });
        setEditingPriceMap(priceMap);
      }
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchStoreOrders = async (storeId: string) => {
    setLoadingOrders(true);
    try {
      const res = await safeFetchJson<{ success: boolean; data: Order[] }>(
        `/api/b2b/stores/${storeId}/orders`,
        undefined,
        { success: false, data: [] }
      );
      if (res?.success && res.data) {
        setStoreOrders(res.data);
      }
    } finally {
      setLoadingOrders(false);
    }
  };

  // Save Store Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    setSavingSettings(true);
    setSettingsSuccess(false);

    try {
      const updates = {
        domain_name: domainName.toLowerCase().trim(),
        is_active: isActive,
        theme_settings: {
          ...selectedStore.theme_settings,
          store_name: storeName.trim(),
          hero_title: heroTitle.trim(),
          hero_subtitle: heroSubtitle.trim(),
          announcement: announcement.trim(),
          support_email: supportEmail.trim(),
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          currency_symbol: currencySymbol
        }
      };

      const res = await fetch(`/api/b2b/stores/${selectedStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
        onRefreshData();
      } else {
        alert(data.message || 'Failed to update store settings');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Save customized service selling price
  const handleSaveServicePrice = async (serviceId: string) => {
    if (!selectedStore) return;
    const priceStr = editingPriceMap[serviceId];
    const newPrice = parseFloat(priceStr);
    if (isNaN(newPrice) || newPrice <= 0) return;

    setSavingServiceId(serviceId);
    setPricingSuccessMsg(null);

    try {
      const res = await fetch(`/api/b2b/stores/${selectedStore.id}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          customized_selling_price_per_1k: newPrice
        })
      });
      const data = await res.json();
      if (data.success) {
        setPricingSuccessMsg(`Price updated to ₦${newPrice.toFixed(2)}/1k successfully!`);
        setTimeout(() => setPricingSuccessMsg(null), 3000);
        fetchStoreServices(selectedStore.id);
        onRefreshData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingServiceId(null);
    }
  };

  // Bulk Apply Markup (+X%) to all services
  const handleApplyGlobalMarkup = async (markupPct: number) => {
    if (!selectedStore || storeServices.length === 0) return;
    const confirmed = window.confirm(`Apply +${markupPct}% markup to all ${storeServices.length} services for ${selectedStore.theme_settings.store_name}?`);
    if (!confirmed) return;

    try {
      for (const srv of storeServices) {
        const calculatedPrice = Number((srv.base_cost_per_1k * (1 + markupPct / 100)).toFixed(2));
        await fetch(`/api/b2b/stores/${selectedStore.id}/pricing`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: srv.id,
            customized_selling_price_per_1k: calculatedPrice
          })
        });
      }
      fetchStoreServices(selectedStore.id);
      onRefreshData();
      alert(`Applied +${markupPct}% markup across all services!`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Simulate Split Payment Webhook on this Store
  const handleSimulateStoreWebhook = async () => {
    if (!selectedStore || !simServiceId) return;
    setSimulatingWebhook(true);
    setWebhookResult(null);

    const srv = storeServices.find(s => s.id === simServiceId);
    const unitPrice = srv ? srv.customized_selling_price_per_1k : 2500;
    const totalAmount = Number(((simQuantity / 1000) * unitPrice).toFixed(2));

    try {
      const res = await fetch('/api/webhooks/payment-settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'charge.success',
          gateway: 'paystack',
          data: {
            reference: `PSTK_CHILD_${Date.now()}`,
            amount: totalAmount,
            currency: 'NGN',
            customer: { email: simCustomerEmail },
            metadata: {
              store_id: selectedStore.id,
              service_id: simServiceId,
              quantity: simQuantity,
              target_url: 'https://instagram.com/customer_shide_test'
            }
          }
        })
      });

      const data = await res.json();
      setWebhookResult(data);
      if (data.status === 'success') {
        fetchStoreOrders(selectedStore.id);
        onRefreshData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSimulatingWebhook(false);
    }
  };

  // Metrics calculation
  const totalRevenue = storeOrders.reduce((acc, o) => acc + (o.total_charge || 0), 0);
  const totalEstimatedProfit = storeOrders.reduce((acc, o) => {
    const s = storeServices.find(srv => srv.id === o.service_id);
    const base = s ? s.base_cost_per_1k : 1000;
    const baseCost = (o.total_quantity / 1000) * base;
    return acc + Math.max(0, (o.total_charge || 0) - baseCost);
  }, 0);

  if (!selectedStore) {
    return (
      <div className="card-3d p-8 rounded-3xl text-center space-y-4">
        <StoreIcon className="w-12 h-12 text-sky-500 mx-auto" />
        <h3 className="text-base font-black text-slate-800">No Generated Stores Found</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          You have not generated any Shide stores yet. Use the Shide Store Generator to launch your first branded child panel.
        </p>
        <button
          onClick={onNavigateToGenerator}
          className="btn-3d-lite-blue px-6 py-2.5 rounded-2xl text-xs font-bold inline-flex items-center space-x-2"
        >
          <span>Open Shide Store Generator</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header / Store Selector Card */}
      <div className="card-3d p-6 rounded-3xl border border-sky-100 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md font-black text-base"
              style={{ backgroundColor: selectedStore.theme_settings.primary_color || '#0284c7' }}
            >
              {selectedStore.theme_settings.store_name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {selectedStore.theme_settings.store_name}
                </h2>
                <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                  selectedStore.is_active ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {selectedStore.is_active ? 'STORE ACTIVE' : 'STORE PAUSED'}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-200 rounded-md">
                  {selectedStore.store_type.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-600" />
                <span>Domain: {selectedStore.domain_name}</span>
              </p>
            </div>
          </div>

          {/* Store Switcher & B2C Launch Button */}
          <div className="flex flex-wrap items-center gap-3">
            {allStores.length > 1 && (
              <div className="flex items-center bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs shadow-inner">
                <span className="text-[11px] font-semibold text-slate-400 mr-2">Managing:</span>
                <select
                  value={selectedStore.id}
                  onChange={e => setSelectedStoreId(e.target.value)}
                  className="bg-transparent text-slate-800 font-mono text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {allStores.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.domain_name} ({st.theme_settings.store_name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => onPreviewInB2C(selectedStore)}
              className="btn-3d-lite-blue px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch Public Customer Store (B2C)</span>
            </button>

            <button
              onClick={onNavigateToGenerator}
              className="btn-3d-pearl px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-1.5 cursor-pointer"
            >
              <span>+ Generate Another Store</span>
            </button>
          </div>
        </div>

        {/* Store Key Performance Stat Cards with 3D Depth */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 bg-white rounded-2xl border border-sky-100 shadow-sm">
            <span className="block text-[10px] font-mono uppercase font-bold text-slate-400">Total Customer Orders</span>
            <span className="text-lg font-black text-slate-900 font-mono mt-1 block">
              {storeOrders.length} Orders
            </span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-sky-100 shadow-sm">
            <span className="block text-[10px] font-mono uppercase font-bold text-slate-400">Retail Revenue</span>
            <span className="text-lg font-black text-sky-700 font-mono mt-1 block">
              ₦{totalRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-sky-100 shadow-sm">
            <span className="block text-[10px] font-mono uppercase font-bold text-slate-400">Net Reseller Profit</span>
            <span className="text-lg font-black text-emerald-600 font-mono mt-1 block">
              ₦{totalEstimatedProfit.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-sky-100 shadow-sm">
            <span className="block text-[10px] font-mono uppercase font-bold text-slate-400">Catalog Offerings</span>
            <span className="text-lg font-black text-indigo-700 font-mono mt-1 block">
              {storeServices.length} Active Services
            </span>
          </div>
        </div>
      </div>

      {/* Sub Tabs for Store Administration (Swipeable on Mobile) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar scroll-smooth p-1.5 bg-sky-50/90 rounded-2xl border border-sky-200 shadow-inner">
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap shrink-0 transition cursor-pointer min-h-[40px] ${
            activeSubTab === 'settings' ? 'btn-3d-lite-blue text-xs' : 'btn-3d-pearl text-slate-600 text-xs'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Branding & Domain Settings</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pricing')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap shrink-0 transition cursor-pointer min-h-[40px] ${
            activeSubTab === 'pricing' ? 'btn-3d-lite-blue text-xs' : 'btn-3d-pearl text-slate-600 text-xs'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Custom Selling Prices & Margins</span>
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap shrink-0 transition cursor-pointer min-h-[40px] ${
            activeSubTab === 'orders' ? 'btn-3d-lite-blue text-xs' : 'btn-3d-pearl text-slate-600 text-xs'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Customer Orders ({storeOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('webhook')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap shrink-0 transition cursor-pointer min-h-[40px] ${
            activeSubTab === 'webhook' ? 'btn-3d-lite-blue text-xs' : 'btn-3d-pearl text-slate-600 text-xs'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Test Payment Split Settlement</span>
        </button>
      </div>

      {/* SUBTAB 1: STORE SETTINGS & BRANDING */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="card-3d p-6 rounded-3xl border border-sky-100 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Storefront Identity & Customization</h3>
              <p className="text-xs text-slate-500">Configure public branding, announcement banner, and custom domain.</p>
            </div>
            {settingsSuccess && (
              <span className="flex items-center space-x-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                <span>Saved successfully!</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Domain Name</label>
              <input
                type="text"
                required
                value={domainName}
                onChange={e => setDomainName(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Status</label>
              <select
                value={isActive ? 'active' : 'paused'}
                onChange={e => setIsActive(e.target.value === 'active')}
                className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner cursor-pointer"
              >
                <option value="active">Active (Accepting Customer Orders)</option>
                <option value="paused">Paused (Maintenance Mode)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Theme Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-sky-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Support Contact Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer Announcement Banner</label>
            <input
              type="text"
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
              placeholder="e.g. ⚡ Special promo: 20% Extra Organic Followers this week!"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hero Main Title</label>
              <input
                type="text"
                value={heroTitle}
                onChange={e => setHeroTitle(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hero Subtitle</label>
              <input
                type="text"
                value={heroSubtitle}
                onChange={e => setHeroSubtitle(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="btn-3d-lite-blue px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer"
            >
              {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Storefront Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 2: CUSTOM SELLING PRICES & MARGINS */}
      {activeSubTab === 'pricing' && (
        <div className="card-3d p-6 rounded-3xl border border-sky-100 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Custom Selling Prices & Profit Margins</h3>
              <p className="text-xs text-slate-500">
                Customize your retail price for each service on <span className="font-mono text-sky-700 font-bold">{selectedStore.domain_name}</span>. Net difference is your instant profit.
              </p>
            </div>

            {/* Quick Bulk Markup Buttons */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-400">Quick Markups:</span>
              <button
                type="button"
                onClick={() => handleApplyGlobalMarkup(50)}
                className="btn-3d-pearl px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer"
              >
                +50%
              </button>
              <button
                type="button"
                onClick={() => handleApplyGlobalMarkup(100)}
                className="btn-3d-pearl px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer"
              >
                +100%
              </button>
              <button
                type="button"
                onClick={() => handleApplyGlobalMarkup(200)}
                className="btn-3d-pearl px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer"
              >
                +200%
              </button>
            </div>
          </div>

          {pricingSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{pricingSuccessMsg}</span>
            </div>
          )}

          {loadingServices ? (
            <div className="py-12 text-center text-xs font-mono text-slate-400">Loading catalog pricing...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-sky-100 text-slate-500 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Service Name & Platform</th>
                    <th className="py-2.5 px-3">Master Base Cost</th>
                    <th className="py-2.5 px-3">Your Retail Selling Price</th>
                    <th className="py-2.5 px-3">Net Profit per 1k</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {storeServices.map(srv => {
                    const currentPrice = parseFloat(editingPriceMap[srv.id] || String(srv.customized_selling_price_per_1k));
                    const profitPer1k = Number((currentPrice - srv.base_cost_per_1k).toFixed(2));
                    const isSaving = savingServiceId === srv.id;

                    return (
                      <tr key={srv.id} className="hover:bg-sky-50/50 transition">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 block">{srv.service_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Platform: {srv.category} • Min: {srv.min_quantity} | Max: {srv.max_quantity}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-600">
                          ₦{srv.base_cost_per_1k.toFixed(2)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs font-bold text-slate-500">₦</span>
                            <input
                              type="number"
                              step="10"
                              value={editingPriceMap[srv.id] ?? srv.customized_selling_price_per_1k}
                              onChange={e => {
                                setEditingPriceMap(prev => ({
                                  ...prev,
                                  [srv.id]: e.target.value
                                }));
                              }}
                              className="w-24 bg-white border border-sky-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-sky-700 shadow-inner focus:outline-none focus:border-sky-500"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-mono font-black text-xs ${profitPer1k >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            +₦{profitPer1k.toFixed(2)}/1k
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSaveServicePrice(srv.id)}
                            className="btn-3d-pearl px-3 py-1 rounded-lg text-[11px] font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
                          >
                            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Price'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: CUSTOMER ORDERS LEDGER */}
      {activeSubTab === 'orders' && (
        <div className="card-3d p-6 rounded-3xl border border-sky-100 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Customer Orders Received</h3>
              <p className="text-xs text-slate-500">
                Orders placed on <span className="font-mono text-sky-700 font-bold">{selectedStore.domain_name}</span>. Automated upstream execution.
              </p>
            </div>
            <button
              onClick={() => fetchStoreOrders(selectedStore.id)}
              className="btn-3d-pearl p-2 rounded-xl text-sky-700 cursor-pointer"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {storeOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <ShoppingBag className="w-8 h-8 text-sky-300 mx-auto" />
              <p>No customer orders placed on this storefront yet.</p>
              <p className="text-[11px] text-slate-500">
                Share your store link or test with the Payment Split simulator tab!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-sky-100 text-slate-500 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Order ID / Date</th>
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Target URL</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Customer Paid</th>
                    <th className="py-2.5 px-3">Execution Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {storeOrders.map(ord => (
                    <tr key={ord.id} className="hover:bg-sky-50/50 transition">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block text-[11px]">
                          #{ord.id.substring(0, 8)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ord.created_at).toLocaleDateString()} {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-800 font-semibold text-xs">
                        {ord.service_name || 'Standard Engagement'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sky-700 truncate max-w-[160px] block text-[11px]">
                          {ord.target_url}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-700">
                        {ord.total_quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-600">
                        ₦{ord.total_charge.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ord.execution_status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          ord.execution_status === 'processing' ? 'bg-sky-100 text-sky-800 border border-sky-300' :
                          'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {ord.execution_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: TEST PAYMENT SPLIT SETTLEMENT */}
      {activeSubTab === 'webhook' && (
        <div className="card-3d p-6 rounded-3xl border border-sky-100 shadow-xl space-y-4">
          <div className="border-b border-sky-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-sky-600" />
              <span>Simulate Child Store Customer Checkout (Split Webhook)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Test how consumer payments on <span className="font-mono font-bold text-sky-700">{selectedStore.domain_name}</span> are processed, splitting wholesale base cost to admin and crediting your reseller wallet balance automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Service</label>
              <select
                value={simServiceId}
                onChange={e => setSimServiceId(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner cursor-pointer"
              >
                {storeServices.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.service_name} (Retail: ₦{s.customized_selling_price_per_1k}/1k)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Order Quantity</label>
              <input
                type="number"
                step="500"
                min="100"
                value={simQuantity}
                onChange={e => setSimQuantity(Number(e.target.value))}
                className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Simulated Customer Email</label>
              <input
                type="email"
                value={simCustomerEmail}
                onChange={e => setSimCustomerEmail(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSimulateStoreWebhook}
              disabled={simulatingWebhook || !simServiceId}
              className="btn-3d-lite-blue px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer"
            >
              {simulatingWebhook ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayIcon className="w-4 h-4" />}
              <span>Simulate Paystack Split Charge</span>
            </button>
          </div>

          {/* Webhook Execution Result */}
          {webhookResult && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-700 shadow-inner">
              <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                <span>✓ Split Settlement Executed Successfully</span>
                <span>Ref: {webhookResult.settlement_record?.gateway_reference || 'PSTK_LIVE'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="bg-slate-800/80 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Consumer Paid:</span>
                  <span className="text-sky-400 font-bold">₦{webhookResult.settlement_record?.consumer_paid?.toFixed(2)}</span>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Master Base Cost:</span>
                  <span className="text-amber-400 font-bold">₦{webhookResult.settlement_record?.master_base_cost?.toFixed(2)}</span>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Your Reseller Profit:</span>
                  <span className="text-emerald-400 font-black">+₦{webhookResult.settlement_record?.reseller_profit?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
