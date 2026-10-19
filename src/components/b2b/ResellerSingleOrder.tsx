import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  RefreshCw, 
  TrendingUp, 
  Zap, 
  Calendar, 
  ExternalLink 
} from 'lucide-react';
import { User, MasterService } from '../../types';

interface ResellerSingleOrderProps {
  currentUser: User | null;
  services: MasterService[];
  onOrderPlaced: () => void;
  onNavigateToWallet: () => void;
}

export const ResellerSingleOrder: React.FC<ResellerSingleOrderProps> = ({
  currentUser,
  services,
  onOrderPlaced,
  onNavigateToWallet
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services[0]?.id || '20000000-0000-0000-0000-000000000001'
  );
  const [targetLink, setTargetLink] = useState<string>('https://instagram.com/client_fashion_brand');
  const [quantity, setQuantity] = useState<number>(2000);
  const [runs, setRuns] = useState<number>(1);
  const [interval, setInterval] = useState<number>(60);
  const [isDrip, setIsDrip] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedService = services.find(s => s.id === selectedServiceId) || services[0];

  // Pricing calculation
  const baseRate = selectedService ? selectedService.base_cost_per_1k : 1000;
  const vipDiscount = currentUser?.tier === 'vip' ? 0.90 : 1.0;
  const unitRate = baseRate * vipDiscount;
  const totalCost = Number(((quantity / 1000) * unitRate * (isDrip ? runs : 1)).toFixed(2));
  const hasSufficientBalance = (currentUser?.wallet_balance || 0) >= totalCost;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessOrder(null);

    if (!hasSufficientBalance) {
      setErrorMessage(`Insufficient wallet balance. Total cost: ₦${totalCost.toLocaleString('en-NG')} vs Balance: ₦${(currentUser?.wallet_balance || 0).toLocaleString('en-NG')}`);
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        orders: [
          {
            service_id: selectedServiceId,
            link: targetLink.trim(),
            quantity: Number(quantity),
            runs: isDrip ? Number(runs) : undefined,
            interval: isDrip ? Number(interval) : undefined
          }
        ]
      };

      const res = await fetch('/api/v2/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': currentUser?.api_key || 'nexus_live_reseller_api_key_8842bc19a7'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status === 'success' && data.data) {
        setSuccessOrder(data.data.successful_orders?.[0] || data.data);
        onOrderPlaced();
      } else {
        setErrorMessage(data.message || 'Order failed to process.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error placing order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-3d p-6 rounded-3xl border border-sky-100 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-4">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-sky-600" />
            <span>Place Order for Customer (Wallet Direct)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Submit a single wholesale order for your client. Billed directly to your reseller wallet at raw provider rates.
          </p>
        </div>

        {currentUser && (
          <div className="flex items-center space-x-2 bg-sky-50 border border-sky-200 px-3.5 py-1.5 rounded-xl">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <div className="text-right">
              <span className="block text-[10px] text-slate-400 font-mono font-bold uppercase">Reseller Balance</span>
              <span className="font-mono text-xs font-black text-emerald-600">
                ₦{currentUser.wallet_balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>

      {successOrder && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-emerald-900 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Order Placed Successfully! (Fulfillment Ingested)</span>
          </div>
          <div className="font-mono text-[11px] text-emerald-800 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <span>Order ID: #{successOrder.order_id || successOrder.id}</span>
            <span>Debit: ₦{totalCost.toFixed(2)}</span>
            <span>Remaining Bal: ₦{successOrder.remaining_balance?.toFixed(2) || (currentUser ? (currentUser.wallet_balance - totalCost).toFixed(2) : '0')}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={onNavigateToWallet}
            className="btn-3d-pearl px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer"
          >
            Add Funds
          </button>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Service</label>
            <select
              value={selectedServiceId}
              onChange={e => setSelectedServiceId(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner cursor-pointer"
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  [{s.category}] {s.service_name} — ₦{s.base_cost_per_1k}/1k
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Target Link or Username</label>
            <input
              type="text"
              required
              value={targetLink}
              onChange={e => setTargetLink(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 font-semibold focus:outline-none focus:border-sky-500 shadow-inner"
              placeholder="https://instagram.com/username or post URL"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Order Quantity
              {selectedService && (
                <span className="text-[10px] text-slate-400 font-mono ml-1">
                  (Min: {selectedService.min_quantity} | Max: {selectedService.max_quantity.toLocaleString()})
                </span>
              )}
            </label>
            <input
              type="number"
              required
              min={selectedService?.min_quantity || 10}
              max={selectedService?.max_quantity || 1000000}
              step="100"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col justify-end">
            <div className="p-3 bg-sky-50/80 rounded-xl border border-sky-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Estimated Wholesale Charge:</span>
              <div className="text-right">
                <span className="font-mono font-black text-sky-700 text-base">
                  ₦{totalCost.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
                {currentUser?.tier === 'vip' && (
                  <span className="block text-[10px] font-bold text-amber-700">VIP 10% Wholesale Discount Applied</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Drip Feed Toggle */}
        <div className="pt-2">
          <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={isDrip}
              onChange={e => setIsDrip(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
            />
            <span>Enable Automated Drip-Feed Staggering</span>
          </label>

          {isDrip && (
            <div className="grid grid-cols-2 gap-4 mt-3 p-4 bg-sky-50/50 rounded-2xl border border-sky-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Number of Runs</label>
                <input
                  type="number"
                  min="2"
                  max="30"
                  value={runs}
                  onChange={e => setRuns(Number(e.target.value))}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Interval (Minutes)</label>
                <input
                  type="number"
                  min="10"
                  max="1440"
                  step="30"
                  value={interval}
                  onChange={e => setInterval(Number(e.target.value))}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 shadow-inner"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <span>Payment Source: </span>
            <span className="font-semibold text-slate-800">Reseller Wallet Balance</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto btn-3d-lite-blue px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer min-h-[44px]"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Place Order for Customer</span>
          </button>
        </div>
      </form>
    </div>
  );
};
