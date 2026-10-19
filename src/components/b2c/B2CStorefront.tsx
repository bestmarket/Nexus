import React, { useState } from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  CreditCard, 
  Calendar, 
  MessageSquare, 
  Search, 
  AlertCircle,
  HelpCircle,
  Layers,
  Star
} from 'lucide-react';
import { Store, ServiceWithPricing, AIProfileAudit, SettlementResult } from '../../types';

interface B2CStorefrontProps {
  currentStore: Store | null;
  services: ServiceWithPricing[];
  onOrderCompleted: () => void;
}

export const B2CStorefront: React.FC<B2CStorefrontProps> = ({
  currentStore,
  services,
  onOrderCompleted
}) => {
  // Theme branding overrides from store
  const theme = currentStore?.theme_settings || {
    store_name: 'SocialBoost Africa',
    primary_color: '#38bdf8',
    secondary_color: '#0284c7',
    accent_color: '#0ea5e9',
    currency_symbol: '₦',
    currency_code: 'NGN',
    hero_title: 'Explode Your Social Media Reach',
    hero_subtitle: 'Real high-retention engagement with automated AI growth audits.',
    support_email: 'hello@socialboost.africa',
    announcement: '🔥 FLASH SALE: 20% Extra High-Retention Followers this week!'
  };

  // State for AI Profile Optimizer
  const [profileUrlInput, setProfileUrlInput] = useState('https://instagram.com/lagos_fashion_week');
  const [analyzingProfile, setAnalyzingProfile] = useState(false);
  const [auditResult, setAuditResult] = useState<AIProfileAudit | null>(null);

  // State for Category Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Order & Checkout Modal State
  const [selectedService, setSelectedService] = useState<ServiceWithPricing | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(2500);
  const [orderTargetUrl, setOrderTargetUrl] = useState<string>('https://instagram.com/lagos_fashion_week');
  
  // Drip configuration
  const [isDripMode, setIsDripMode] = useState<boolean>(false);
  const [dripRuns, setDripRuns] = useState<number>(5);
  const [dripIntervalMinutes, setDripIntervalMinutes] = useState<number>(120);

  // Checkout execution
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [settlementResult, setSettlementResult] = useState<SettlementResult | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  // AI Consultant Chat
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Hello! I am your AI Growth Architect for ${theme.store_name}. Paste any public Instagram, TikTok, or YouTube link to audit your account's algorithmic velocity, or ask me how to crack recommendation feeds!`
    }
  ]);
  const [consultingAI, setConsultingAI] = useState<boolean>(false);

  const categories = ['All', ...Array.from(new Set(services.map(s => s.category)))];

  const filteredServices = services.filter(s => {
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      s.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Trigger AI Profile Audit
  const handleRunProfileAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profileUrlInput) return;

    setAnalyzingProfile(true);
    setAuditResult(null);

    try {
      const res = await fetch('/api/ai/profile-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_url: profileUrlInput,
          store_id: currentStore?.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setAuditResult(data.data);
        setOrderTargetUrl(profileUrlInput);
      } else {
        alert(data.message || 'Audit failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAnalyzingProfile(false);
    }
  };

  // Open checkout for a specific service
  const handleOpenCheckout = (service: ServiceWithPricing, presetQty?: number) => {
    setSelectedService(service);
    setOrderQuantity(presetQty || service.min_quantity * 5 || 2500);
    setOrderTargetUrl(profileUrlInput || 'https://instagram.com/my_brand');
    setShowCheckoutModal(true);
    setSettlementResult(null);
  };

  // Execute payment settlement
  const handleExecuteCheckout = async () => {
    if (!selectedService) return;
    setIsCheckingOut(true);

    try {
      const unitPrice = selectedService.customized_selling_price_per_1k;
      const totalAmountPaid = Number(((orderQuantity / 1000) * unitPrice).toFixed(2));

      // Trigger the Split-Payment Automated Settlement Engine
      const res = await fetch('/api/webhooks/payment-settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'charge.success',
          data: {
            reference: `PSTK_RETAIL_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
            amount_paid: totalAmountPaid,
            currency: theme.currency_code || 'NGN',
            customer_email: 'buyer@consumer.ng',
            store_id: currentStore?.id,
            service_id: selectedService.id,
            target_url: orderTargetUrl,
            quantity: orderQuantity,
            metadata: {
              store_domain: currentStore?.domain_name,
              is_drip: isDripMode,
              runs: dripRuns,
              interval: dripIntervalMinutes
            }
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setSettlementResult(data.data);
        onOrderCompleted();
      } else {
        alert(data.message || 'Payment settlement routing failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Ask AI Consultant
  const handleSendAiConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setConsultingAI(true);

    try {
      const res = await fetch('/api/ai/chat-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          target_handle: auditResult?.handle || 'creator',
          platform: auditResult?.platform || 'Social Profile'
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory(prev => [...prev, { sender: 'ai', text: data.reply }]);
      }
    } catch (err: any) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'Error connecting to Gemini API. Please retry.' }]);
    } finally {
      setConsultingAI(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 3D Bright Store Announcement Banner */}
      {theme.announcement && (
        <div className="p-3.5 rounded-2xl text-center text-xs font-bold text-sky-950 bg-gradient-to-r from-sky-200 via-sky-300 to-cyan-200 border border-sky-300 shadow-[0_4px_14px_rgba(56,189,248,0.25)]">
          {theme.announcement}
        </div>
      )}

      {/* Hero Showcase with Bright 3D Depth & Mixed Light-Blue Design */}
      <div className="card-3d p-8 md:p-12 relative overflow-hidden border-2 border-white/80">
        {/* Soft 3D Lighting orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-sky-200/60 to-blue-300/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-200/50 to-indigo-200/40 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-sky-200 shadow-[0_2px_8px_rgba(186,230,253,0.5)] text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm" />
            <span className="text-slate-600 font-semibold">Child Storefront Host:</span>
            <span className="font-mono text-sky-700 font-black">{currentStore?.domain_name}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {theme.hero_title}
          </h1>

          <p className="text-sm md:text-base text-slate-600 leading-relaxed font-normal">
            {theme.hero_subtitle}
          </p>

          {/* 3D Social Profile Optimizer Input Box */}
          <form onSubmit={handleRunProfileAudit} className="pt-3 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-sky-500 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Paste Instagram, TikTok, or YouTube profile link / handle..."
                value={profileUrlInput}
                onChange={e => setProfileUrlInput(e.target.value)}
                className="w-full bg-white border-2 border-sky-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={analyzingProfile}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-extrabold btn-3d-lite-blue flex items-center justify-center space-x-2 flex-shrink-0 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${analyzingProfile ? 'animate-spin' : ''}`} />
              <span>{analyzingProfile ? 'Auditing Algorithm...' : 'Audit Profile with AI'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* MODULE 3.2: AI PROFILE AUDIT RESULT & CHECKOUT CATALYST CARD */}
      {auditResult && (
        <div className="card-3d p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden border-2 border-sky-200/90">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sky-100 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-gradient-to-r from-sky-100 to-blue-100 text-sky-800 border border-sky-300 shadow-sm">
                  Google Gemini 2.5 Flash Audit
                </span>
                <span className="text-xs text-slate-500 font-semibold">Target: @{auditResult.handle} ({auditResult.platform})</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">
                Algorithmic Growth Velocity Analysis
              </h2>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-white border border-sky-200 px-4 py-2.5 rounded-2xl text-center shadow-[0_3px_0_#bae6fd,0_4px_10px_rgba(186,230,253,0.3)]">
                <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Engagement Rate</span>
                <span className="font-mono text-sm font-black text-sky-600">
                  {auditResult.metrics_estimate.estimated_engagement_rate}
                </span>
              </div>
              <div className="bg-white border border-sky-200 px-4 py-2.5 rounded-2xl text-center shadow-[0_3px_0_#bae6fd,0_4px_10px_rgba(186,230,253,0.3)]">
                <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Health Score</span>
                <span className="font-mono text-sm font-black text-blue-600">
                  {auditResult.metrics_estimate.profile_health_score}/100
                </span>
              </div>
            </div>
          </div>

          {/* 3-Sentence Audit Box with 3D Emboss */}
          <div className="bg-gradient-to-br from-sky-50 via-white to-blue-50/50 border border-sky-200 p-5 rounded-2xl shadow-inner relative">
            <div className="text-xs font-mono uppercase text-sky-700 mb-2 font-black flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-sky-500" />
              <span>3-Sentence Executive Algorithmic Audit</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
              "{auditResult.three_sentence_audit}"
            </p>
          </div>

          {/* Checkout Catalyst: Tailored Upsells from Store Catalog */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-sky-500" />
                <span>Tailored Catalyst Packages for @{auditResult.handle}</span>
              </h3>
              <span className="text-xs text-sky-700 font-semibold">Auto-priced from storefront catalog</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {auditResult.tailored_packages.map((pkg, idx) => {
                const matchedService = services.find(s => s.id === pkg.service_id) || services[0];
                return (
                  <div 
                    key={idx}
                    className="card-3d p-5 rounded-2xl space-y-3 flex flex-col justify-between hover:translate-y-[-2px] transition group border border-sky-100 shadow-[0_8px_20px_rgba(186,230,253,0.3)]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-sky-100 text-sky-800 border border-sky-300">
                          {pkg.priority} Priority
                        </span>
                        <span className="text-xs font-mono font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                          {theme.currency_symbol}{pkg.custom_price.toLocaleString('en-NG')}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mt-2 group-hover:text-sky-600 transition">
                        {pkg.service_name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {pkg.strategic_objective}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-sky-100 flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-600 font-bold">
                        Qty: {pkg.recommended_quantity.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleOpenCheckout(matchedService, pkg.recommended_quantity)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold btn-3d-lite-blue flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Activate</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Services Catalog Browser with Bright 3D Cards */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <ShoppingBag className="w-6 h-6 text-sky-500" />
                <span>Available Offers & Packages</span>
              </h2>
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-300 rounded-full shadow-xs">
                {filteredServices.length} Offers
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse authentic engagement services for your accounts. Instant checkout with Paystack or Flutterwave.
            </p>
          </div>

          {/* Search bar & Category filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 bg-white border border-sky-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>

            {/* 3D Category Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs bg-sky-50/80 p-1 rounded-xl border border-sky-200">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'btn-3d-lite-blue text-xs'
                      : 'btn-3d-pearl text-slate-600 text-xs'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3D Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredServices.map(service => (
            <div 
              key={service.id}
              className="card-3d p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:translate-y-[-3px] transition shadow-[0_10px_25px_rgba(186,230,253,0.35)] border border-sky-100"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-sky-700 uppercase font-black px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200">
                    {service.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Instant Start
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug">
                  {service.service_name}
                </h3>

                <div className="mt-3 flex items-baseline space-x-1 bg-white p-2.5 rounded-xl border border-sky-100 shadow-sm">
                  <span className="text-xl font-black font-mono text-sky-600">
                    {theme.currency_symbol}{service.customized_selling_price_per_1k.toLocaleString('en-NG')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">/ 1k units</span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono mt-2">
                  Min: {service.min_quantity.toLocaleString()} | Max: {service.max_quantity.toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => handleOpenCheckout(service)}
                className="w-full py-2.5 rounded-xl text-xs font-extrabold btn-3d-lite-blue flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Select & Configure</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time AI Consultation Panel with 3D Depth */}
      <div className="card-3d p-6 md:p-8 space-y-4 shadow-xl border border-sky-100">
        <div className="flex items-center space-x-3.5 border-b border-sky-100 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white flex items-center justify-center shadow-md">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Interactive AI Growth Consultation</h3>
            <p className="text-xs text-slate-500">
              Real-time advice on content hooks, retention curves, posting cadences, and algorithm velocity triggers.
            </p>
          </div>
        </div>

        {/* Chat Stream Box */}
        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2">
          {chatHistory.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-br-none shadow-[0_2px_8px_rgba(56,189,248,0.4)]'
                  : 'bg-white border border-sky-100 text-slate-800 rounded-bl-none shadow-[0_2px_8px_rgba(186,230,253,0.3)]'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {consultingAI && (
            <div className="text-xs text-sky-600 font-medium italic flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-spin" />
              <span>AI Growth Consultant is drafting strategic advice...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSendAiConsultant} className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder="Ask about posting times, viral drip pacing, or hashtags..."
            value={chatMessage}
            onChange={e => setChatMessage(e.target.value)}
            className="flex-1 bg-white border border-sky-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={consultingAI || !chatMessage.trim()}
            className="px-6 py-2.5 btn-3d-lite-blue rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Ask AI
          </button>
        </form>
      </div>

      {/* CHECKOUT & DRIP SCHEDULER MODAL with 3D Tactile Styling (Mobile Responsive) */}
      {showCheckoutModal && selectedService && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="card-3d max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl border-2 border-sky-200 rounded-3xl">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedService.service_name}</h3>
                <span className="text-xs text-sky-700 font-mono font-semibold">Storefront: {currentStore?.domain_name}</span>
              </div>
              <button 
                onClick={() => setShowCheckoutModal(false)} 
                className="w-7 h-7 rounded-lg bg-sky-50 text-slate-500 hover:text-slate-900 flex items-center justify-center font-mono text-sm border border-sky-200 shadow-sm"
              >
                ✕
              </button>
            </div>

            {/* Target Link Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Social Link / Username:</label>
              <input
                type="text"
                value={orderTargetUrl}
                onChange={e => setOrderTargetUrl(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:border-sky-500 shadow-inner"
              />
            </div>

            {/* Quantity Input */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <label className="font-bold text-slate-700">Order Quantity:</label>
                <span className="text-slate-400 font-mono text-[11px]">
                  [{selectedService.min_quantity.toLocaleString()} - {selectedService.max_quantity.toLocaleString()}]
                </span>
              </div>
              <input
                type="number"
                min={selectedService.min_quantity}
                max={selectedService.max_quantity}
                value={orderQuantity}
                onChange={e => setOrderQuantity(parseInt(e.target.value) || selectedService.min_quantity)}
                className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:border-sky-500 shadow-inner"
              />
            </div>

            {/* MODULE 3.3: ADVANCED AI SMART-SCHEDULER & DRIP TOGGLE with 3D Depth */}
            <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-black text-slate-900">Smart Drip Staggered Delivery</span>
                </div>
                <input
                  type="checkbox"
                  checked={isDripMode}
                  onChange={e => setIsDripMode(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-0 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-normal">
                Split this single order across automated execution intervals to simulate authentic organic engagement curves.
              </p>

              {isDripMode && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-sky-200 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-600 mb-1">Total Splits (Runs):</label>
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={dripRuns}
                      onChange={e => setDripRuns(parseInt(e.target.value) || 2)}
                      className="w-full bg-white border border-sky-200 rounded-lg p-2 font-mono text-slate-800 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-600 mb-1">Interval (Minutes):</label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={dripIntervalMinutes}
                      onChange={e => setDripIntervalMinutes(parseInt(e.target.value) || 60)}
                      className="w-full bg-white border border-sky-200 rounded-lg p-2 font-mono text-slate-800 shadow-inner"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* MODULE 3.5: SPLIT-PAYMENT SETTLEMENT AUDIT PREVIEW */}
            <div className="p-4 bg-white rounded-2xl border border-sky-200 space-y-2 shadow-sm">
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Total Retail Consumer Charge:</span>
                <span className="font-mono text-sky-600 text-lg font-black">
                  {theme.currency_symbol}{((orderQuantity / 1000) * selectedService.customized_selling_price_per_1k).toFixed(2)}
                </span>
              </div>

              {/* Real-time automated split breakdown */}
              <div className="pt-2 border-t border-sky-100 space-y-1 text-[11px] font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>↳ Master Wholesaler Base Cost:</span>
                  <span className="text-indigo-600 font-bold">
                    {theme.currency_symbol}{((orderQuantity / 1000) * selectedService.base_cost_per_1k).toFixed(2)} (To Admin)
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>↳ Reseller Store Net Margin:</span>
                  <span className="text-emerald-600 font-black">
                    {theme.currency_symbol}{((orderQuantity / 1000) * selectedService.reseller_margin_per_1k).toFixed(2)} (To Storefront)
                  </span>
                </div>
              </div>
            </div>

            {/* Settlement Success Feedback */}
            {settlementResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2 text-xs shadow-sm">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Settlement Complete & Fulfillment Dispatched!</span>
                </div>
                <div className="text-slate-700 font-mono text-[11px] space-y-0.5">
                  <div>Tracking ID: <span className="text-sky-700 font-bold">{settlementResult.fulfillment_tracking_id}</span></div>
                  <div>Admin Credited: ₦{settlementResult.admin_wallet_credited.toFixed(2)}</div>
                  <div>Reseller Credited: ₦{settlementResult.reseller_wallet_credited.toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* Action Buttons with 3D Mixed Light Blue Button */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold btn-3d-pearl"
              >
                Close
              </button>

              <button
                onClick={handleExecuteCheckout}
                disabled={isCheckingOut || !orderTargetUrl}
                className="px-6 py-2.5 rounded-xl text-xs font-black btn-3d-lite-blue flex items-center space-x-2 cursor-pointer"
              >
                {isCheckingOut ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                <span>{isCheckingOut ? 'Settling Payment Rails...' : 'Pay with Paystack / Flutterwave'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
