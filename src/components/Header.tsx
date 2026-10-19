import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  ShoppingBag, 
  Database, 
  Globe, 
  Wallet, 
  Sparkles,
  Zap,
  Users,
  Menu,
  X,
  ChevronDown,
  Layers,
  ExternalLink
} from 'lucide-react';
import { Store, User } from '../types';

export type ActiveTab = 'admin' | 'b2b' | 'b2c' | 'schema';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentStore: Store | null;
  allStores: Store[];
  onSelectStore: (store: Store) => void;
  currentUser: User | null;
  onRefreshData: () => void;
  allUsers?: User[];
  onSwitchUser?: (user: User) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentStore,
  allStores,
  onSelectStore,
  currentUser,
  onRefreshData,
  allUsers,
  onSwitchUser
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabSwitch = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-sky-100 shadow-[0_4px_25px_rgba(186,230,253,0.35)] text-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-2.5 sm:space-x-3.5">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-b from-cyan-300 via-sky-400 to-blue-600 flex items-center justify-center shadow-[0_3px_0_#0284c7,0_6px_14px_rgba(56,189,248,0.4)] border border-sky-200 shrink-0">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-slate-900 via-sky-900 to-blue-700 bg-clip-text text-transparent">
                    NexusPulse
                  </span>
                  <span className="hidden xs:inline-block px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase bg-sky-100 text-sky-800 border border-sky-300 rounded-full shadow-xs">
                    3D Engine
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden md:block">
                  Hybrid B2B Wholesaler & B2C Multi-Tenant Child SMM Platform
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs: Clear Separation of B2C and B2B */}
            <nav className="hidden md:flex items-center space-x-1.5 lg:space-x-2 bg-sky-50/90 p-1.5 rounded-2xl border border-sky-200 shadow-inner">
              {/* B2C Customer Store */}
              <button
                onClick={() => handleTabSwitch('b2c')}
                className={`flex items-center space-x-2 px-3.5 lg:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'b2c'
                    ? 'btn-3d-lite-blue shadow-md'
                    : 'btn-3d-pearl text-slate-700'
                }`}
              >
                <ShoppingBag className={`w-4 h-4 ${activeTab === 'b2c' ? 'text-white' : 'text-sky-600'} drop-shadow`} />
                <div className="text-left">
                  <span className="block leading-none">B2C Customer Store</span>
                  <span className={`text-[9px] font-normal block leading-none mt-0.5 ${activeTab === 'b2c' ? 'text-sky-100' : 'text-slate-400'}`}>
                    Public Shop
                  </span>
                </div>
              </button>

              {/* B2B Reseller Panel */}
              <button
                onClick={() => handleTabSwitch('b2b')}
                className={`flex items-center space-x-2 px-3.5 lg:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'b2b'
                    ? 'btn-3d-lite-blue shadow-md'
                    : 'btn-3d-pearl text-slate-700'
                }`}
              >
                <Terminal className={`w-4 h-4 ${activeTab === 'b2b' ? 'text-white' : 'text-sky-600'} drop-shadow`} />
                <div className="text-left">
                  <span className="block leading-none">B2B Reseller Panel</span>
                  <span className={`text-[9px] font-normal block leading-none mt-0.5 ${activeTab === 'b2b' ? 'text-sky-100' : 'text-slate-400'}`}>
                    Wholesale & Shide Generator
                  </span>
                </div>
              </button>

              <div className="h-6 w-px bg-sky-200 mx-1" />

              {/* Admin Deck */}
              <button
                onClick={() => handleTabSwitch('admin')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'btn-3d-lite-blue'
                    : 'btn-3d-pearl text-slate-600'
                }`}
                title="Super Admin Command Deck"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>

              {/* SQL DDL */}
              <button
                onClick={() => handleTabSwitch('schema')}
                className={`hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'schema'
                    ? 'btn-3d-lite-blue'
                    : 'btn-3d-pearl text-slate-600'
                }`}
                title="PostgreSQL DDL Relational Schema"
              >
                <Database className="w-3.5 h-3.5" />
                <span>SQL DDL</span>
              </button>
            </nav>

            {/* Right Status Controls */}
            <div className="flex items-center space-x-2">
              {/* Store Selector (Desktop) */}
              <div className="relative hidden xl:flex items-center bg-white border border-sky-200 rounded-xl px-2.5 py-1.5 text-xs shadow-xs">
                <Globe className="w-3.5 h-3.5 text-sky-600 mr-1.5 shrink-0" />
                <span className="text-slate-400 mr-1 text-[10px] font-bold uppercase">Store:</span>
                <select
                  value={currentStore?.id || ''}
                  onChange={(e) => {
                    const selected = allStores.find(s => s.id === e.target.value);
                    if (selected) onSelectStore(selected);
                  }}
                  className="bg-transparent text-slate-800 font-mono text-xs font-bold focus:outline-none cursor-pointer max-w-[130px] truncate"
                >
                  {allStores.map(st => (
                    <option key={st.id} value={st.id} className="bg-white text-slate-800">
                      {st.domain_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wallet Balance Badge */}
              {currentUser && (
                <div className="flex items-center space-x-2 bg-gradient-to-b from-white to-sky-50 border border-sky-200 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-[0_3px_0_#bae6fd,0_4px_10px_rgba(186,230,253,0.4)]">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-xs shrink-0">
                    <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] sm:text-[9px] text-slate-500 uppercase font-mono font-bold tracking-wider leading-none">
                      {currentUser.role}
                    </span>
                    <span className="font-mono text-xs sm:text-xs font-black text-emerald-600 leading-none mt-0.5 block">
                      ₦{currentUser.wallet_balance.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-10 h-10 rounded-xl btn-3d-pearl flex items-center justify-center text-slate-700 cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-sky-700" /> : <Menu className="w-5 h-5 text-sky-700" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-sky-100 bg-white/95 backdrop-blur-2xl px-4 py-4 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            {/* Quick Navigation Links */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleTabSwitch('b2c')}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center space-y-1 text-center font-bold text-xs transition cursor-pointer ${
                  activeTab === 'b2c' ? 'btn-3d-lite-blue text-white' : 'btn-3d-pearl text-slate-700'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>B2C Customer Shop</span>
              </button>

              <button
                onClick={() => handleTabSwitch('b2b')}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center space-y-1 text-center font-bold text-xs transition cursor-pointer ${
                  activeTab === 'b2b' ? 'btn-3d-lite-blue text-white' : 'btn-3d-pearl text-slate-700'
                }`}
              >
                <Terminal className="w-5 h-5" />
                <span>B2B Reseller Hub</span>
              </button>

              <button
                onClick={() => handleTabSwitch('admin')}
                className={`p-2.5 rounded-xl flex items-center justify-center space-x-2 font-bold text-xs transition cursor-pointer ${
                  activeTab === 'admin' ? 'btn-3d-lite-blue text-white' : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Deck</span>
              </button>

              <button
                onClick={() => handleTabSwitch('schema')}
                className={`p-2.5 rounded-xl flex items-center justify-center space-x-2 font-bold text-xs transition cursor-pointer ${
                  activeTab === 'schema' ? 'btn-3d-lite-blue text-white' : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>PostgreSQL DDL</span>
              </button>
            </div>

            {/* Mobile Store Selector */}
            <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200 space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-600" />
                <span>Current Active Storefront:</span>
              </label>
              <select
                value={currentStore?.id || ''}
                onChange={(e) => {
                  const selected = allStores.find(s => s.id === e.target.value);
                  if (selected) {
                    onSelectStore(selected);
                    setMobileMenuOpen(false);
                  }
                }}
                className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 shadow-inner cursor-pointer"
              >
                {allStores.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.domain_name} ({st.theme_settings.store_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Persona Switcher on Mobile */}
            {allUsers && allUsers.length > 0 && onSwitchUser && (
              <div className="bg-white p-3 rounded-2xl border border-sky-100 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2 text-xs text-slate-600 font-semibold">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Switch Role Persona:</span>
                </div>
                <select
                  value={currentUser?.id || ''}
                  onChange={(e) => {
                    const u = allUsers.find(user => user.id === e.target.value);
                    if (u) {
                      onSwitchUser(u);
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 uppercase"
                >
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.role.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Floating Mobile Bottom Navigation Bar (Multibillion App Grade) */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-xl border border-sky-200 rounded-2xl p-1.5 shadow-[0_8px_32px_rgba(14,165,233,0.25),0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-around">
        <button
          onClick={() => handleTabSwitch('b2c')}
          className={`flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center transition cursor-pointer min-h-[44px] ${
            activeTab === 'b2c'
              ? 'btn-3d-lite-blue text-white shadow-sm'
              : 'text-slate-600 hover:text-sky-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold tracking-tight">B2C Shop</span>
        </button>

        <button
          onClick={() => handleTabSwitch('b2b')}
          className={`flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center transition cursor-pointer min-h-[44px] ${
            activeTab === 'b2b'
              ? 'btn-3d-lite-blue text-white shadow-sm'
              : 'text-slate-600 hover:text-sky-700'
          }`}
        >
          <Terminal className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold tracking-tight">B2B Reseller</span>
        </button>

        <button
          onClick={() => handleTabSwitch('admin')}
          className={`flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center transition cursor-pointer min-h-[44px] ${
            activeTab === 'admin'
              ? 'btn-3d-lite-blue text-white shadow-sm'
              : 'text-slate-600 hover:text-sky-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold tracking-tight">Admin</span>
        </button>

        <button
          onClick={() => handleTabSwitch('schema')}
          className={`flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center transition cursor-pointer min-h-[44px] ${
            activeTab === 'schema'
              ? 'btn-3d-lite-blue text-white shadow-sm'
              : 'text-slate-600 hover:text-sky-700'
          }`}
        >
          <Database className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold tracking-tight">DDL</span>
        </button>
      </nav>
    </>
  );
};
