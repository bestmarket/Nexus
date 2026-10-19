import React, { useState } from 'react';
import { 
  Sparkles, 
  Globe, 
  Store as StoreIcon, 
  Palette, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  RefreshCw, 
  Zap, 
  Sliders,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Store, User } from '../../types';

interface ShideStoreGeneratorProps {
  currentUser: User | null;
  allStores: Store[];
  onStoreCreated: (newStore: Store) => void;
  onNavigateToStoreAdmin: (storeId: string) => void;
  onPreviewInB2C: (store: Store) => void;
}

const PRESET_PALETTES = [
  { name: 'Sky & Cyan (Default)', primary: '#0ea5e9', secondary: '#0284c7', accent: '#38bdf8' },
  { name: 'Emerald & Mint', primary: '#10b981', secondary: '#047857', accent: '#34d399' },
  { name: 'Royal Indigo', primary: '#6366f1', secondary: '#4338ca', accent: '#818cf8' },
  { name: 'Sunset Amber', primary: '#f59e0b', secondary: '#b45309', accent: '#fbbf24' },
  { name: 'Crimson Pulse', primary: '#ef4444', secondary: '#b91c1c', accent: '#f87171' }
];

export const ShideStoreGenerator: React.FC<ShideStoreGeneratorProps> = ({
  currentUser,
  allStores,
  onStoreCreated,
  onNavigateToStoreAdmin,
  onPreviewInB2C
}) => {
  const [storeName, setStoreName] = useState('ViralPulse Africa');
  const [domainName, setDomainName] = useState('viralpulse.ng');
  const [storeType, setStoreType] = useState<'b2c' | 'b2b'>('b2c');
  const [markupPercent, setMarkupPercent] = useState<number>(120);
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(0);
  const [heroTitle, setHeroTitle] = useState('Supercharge Your Social Media Velocity');
  const [heroSubtitle, setHeroSubtitle] = useState('Premium engagement, organic algorithms, and instant delivery with split payments.');
  const [supportEmail, setSupportEmail] = useState('help@viralpulse.ng');
  const [announcement, setAnnouncement] = useState('🔥 FLASH LAUNCH: 25% Extra Organic Reach On All Instagram Packages!');
  const [currencySymbol, setCurrencySymbol] = useState('₦');
  const [currencyCode, setCurrencyCode] = useState('NGN');
  
  const [generating, setGenerating] = useState(false);
  const [generatedStore, setGeneratedStore] = useState<Store | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activePalette = PRESET_PALETTES[selectedPaletteIndex];

  const handleGenerateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setGenerating(true);

    try {
      const payload = {
        owner_id: currentUser?.id || '00000000-0000-0000-0000-000000000002',
        domain_name: domainName.toLowerCase().trim(),
        store_name: storeName.trim(),
        store_type: storeType,
        default_markup_percent: markupPercent,
        theme_settings: {
          store_name: storeName.trim(),
          primary_color: activePalette.primary,
          secondary_color: activePalette.secondary,
          accent_color: activePalette.accent,
          currency_symbol: currencySymbol,
          currency_code: currencyCode,
          hero_title: heroTitle.trim(),
          hero_subtitle: heroSubtitle.trim(),
          support_email: supportEmail.trim(),
          announcement: announcement.trim()
        }
      };

      const res = await fetch('/api/b2b/stores/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.data) {
        setGeneratedStore(data.data);
        onStoreCreated(data.data);
      } else {
        setErrorMsg(data.message || 'Failed to generate store. Please verify domain name uniqueness.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error creating store');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Introduction Card */}
      <div className="card-3d p-6 rounded-3xl border border-sky-100 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(14,165,233,0.35)]">
                <StoreIcon className="w-5 h-5 drop-shadow" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <span>Shide Store Generator</span>
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-sky-100 text-sky-800 border border-sky-300 rounded-full shadow-sm">
                    Instant Child Panel Engine
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Spin up standalone customer-facing storefronts under your own brand and domain. Connected directly to the master fulfillment network with automated profit split settlements.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 bg-sky-50/90 border border-sky-200 px-4 py-2 rounded-2xl shadow-sm">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Master System Connected • Auto-Sync DDL</span>
          </div>
        </div>
      </div>

      {/* Generated Store Success Banner */}
      {generatedStore && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-2 border-emerald-300 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-emerald-950">
                  Store "{generatedStore.theme_settings.store_name}" Generated Successfully!
                </h3>
                <p className="text-xs text-emerald-700">
                  Domain: <span className="font-mono font-bold">{generatedStore.domain_name}</span> • Connected to master catalog with {markupPercent}% default markup.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              STATUS: ACTIVE
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToStoreAdmin(generatedStore.id)}
              className="btn-3d-lite-blue px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Open Personal Store Dashboard</span>
            </button>
            <button
              onClick={() => onPreviewInB2C(generatedStore)}
              className="btn-3d-pearl px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 text-slate-700 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-sky-600" />
              <span>Visit Public Customer Store (B2C)</span>
            </button>
            <button
              onClick={() => setGeneratedStore(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Generate Another Store
            </button>
          </div>
        </div>
      )}

      {/* Main Generator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleGenerateStore} className="card-3d p-6 rounded-3xl border border-sky-100 shadow-xl space-y-5">
            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2 border-b border-sky-100 pb-3">
              <Zap className="w-4 h-4 text-sky-600" />
              <span>Store Configuration & Identity</span>
            </h3>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center space-x-2">
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Brand / Store Name
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 shadow-inner"
                  placeholder="e.g. ApexMedia Boost"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Custom Domain or Subdomain
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={domainName}
                    onChange={e => setDomainName(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-mono text-slate-800 font-semibold focus:outline-none focus:border-sky-500 shadow-inner"
                    placeholder="e.g. apexmedia.africa"
                  />
                </div>
              </div>
            </div>

            {/* Store Type & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Store Mode
                </label>
                <select
                  value={storeType}
                  onChange={e => setStoreType(e.target.value as 'b2c' | 'b2b')}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 shadow-inner cursor-pointer"
                >
                  <option value="b2c">B2C Retail Storefront (Standard Customer Shop)</option>
                  <option value="b2b">B2B Child Reseller Hub (Wholesale Sub-panel)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Store Currency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={e => setCurrencySymbol(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs font-mono text-center font-bold text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
                    placeholder="Symbol: ₦"
                  />
                  <input
                    type="text"
                    value={currencyCode}
                    onChange={e => setCurrencyCode(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs font-mono text-center font-bold text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
                    placeholder="Code: NGN"
                  />
                </div>
              </div>
            </div>

            {/* Default Profit Markup */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Default Profit Markup Over Base Cost</span>
                </label>
                <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  +{markupPercent}% Margin
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                step="10"
                value={markupPercent}
                onChange={e => setMarkupPercent(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>+20% (Aggressive Volume)</span>
                <span>+120% (Balanced Retail)</span>
                <span>+300% (High Margin)</span>
              </div>
            </div>

            {/* Visual Color Palette Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                <Palette className="w-3.5 h-3.5 text-sky-600" />
                <span>3D Brand Theme Palette</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_PALETTES.map((pal, idx) => (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => setSelectedPaletteIndex(idx)}
                    className={`p-2.5 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                      selectedPaletteIndex === idx
                        ? 'border-sky-500 bg-sky-50/80 shadow-md ring-2 ring-sky-300'
                        : 'border-slate-200 bg-white hover:border-sky-300'
                    }`}
                  >
                    <div className="flex -space-x-1">
                      <div className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: pal.primary }} />
                      <div className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: pal.secondary }} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 truncate">{pal.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hero Copy & Support */}
            <div className="space-y-3 pt-2 border-t border-sky-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={e => setHeroTitle(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Announcement Bar
                </label>
                <input
                  type="text"
                  value={announcement}
                  onChange={e => setAnnouncement(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Support Contact Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
                />
              </div>
            </div>

            {/* Submit Button with 3D Mixed Light Blue styling */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={generating}
                className="w-full btn-3d-lite-blue py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Provisioning Store & Seeding Pricing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate & Connect Shide Store</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Real-time Live 3D Store Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-3d p-4 sm:p-6 rounded-3xl border border-sky-100 shadow-xl space-y-4 lg:sticky lg:top-28">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <span className="text-xs font-mono font-bold uppercase text-slate-500">Live Visual Mockup</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">
                {domainName || 'yourdomain.com'}
              </span>
            </div>

            {/* Mock Storefront Header */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm"
                    style={{ backgroundColor: activePalette.primary }}
                  >
                    {storeName.charAt(0) || 'S'}
                  </div>
                  <span className="font-extrabold text-sm text-slate-900">{storeName || 'My Store'}</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {currencyCode}
                </span>
              </div>

              {/* Announcement Bar */}
              <div className="bg-sky-50 border border-sky-100 text-sky-800 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg truncate">
                {announcement}
              </div>

              {/* Mini Hero */}
              <div 
                className="p-4 rounded-xl text-white space-y-1 shadow-inner"
                style={{ 
                  background: `linear-gradient(135deg, ${activePalette.primary} 0%, ${activePalette.secondary} 100%)` 
                }}
              >
                <h4 className="font-black text-xs leading-tight">{heroTitle}</h4>
                <p className="text-[10px] opacity-90 line-clamp-2">{heroSubtitle}</p>
              </div>

              {/* Sample Product Cards with Markup */}
              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">Instagram High Retention Followers</p>
                    <span className="text-[10px] text-slate-400">Master Base: ₦1,200</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-emerald-600 text-xs">
                      {currencySymbol}{Math.round(1200 * (1 + markupPercent / 100)).toLocaleString()}
                    </span>
                    <span className="block text-[9px] text-emerald-500 font-semibold">
                      +{currencySymbol}{Math.round(1200 * (markupPercent / 100)).toLocaleString()} profit
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">TikTok Viral Algorithm Views</p>
                    <span className="text-[10px] text-slate-400">Master Base: ₦180</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-emerald-600 text-xs">
                      {currencySymbol}{Math.round(180 * (1 + markupPercent / 100)).toLocaleString()}
                    </span>
                    <span className="block text-[9px] text-emerald-500 font-semibold">
                      +{currencySymbol}{Math.round(180 * (markupPercent / 100)).toLocaleString()} profit
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Explainer */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-3.5 text-[11px] text-sky-900 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-700" />
                <span>How Shide Stores Work</span>
              </div>
              <p className="text-slate-600 text-[10px] leading-relaxed">
                When a customer purchases on your domain, the system automatically fulfills upstream via your wholesale price, routes the consumer's payment via split webhook, and credits your wallet profit instantly without third-party fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
