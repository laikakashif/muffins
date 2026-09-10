import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  WifiOff, 
  Wifi, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Clock, 
  ShoppingBag, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { OfflineOrder, syncSingleOfflineOrder, removeOfflineOrder, recordSyncedOrderInLocalStorage } from '../utils/offlineOrderDB';
import { Order } from '../types';
import AnimatedPrice from './AnimatedPrice';

interface OfflineOrderSavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  offlineOrder: OfflineOrder | null;
  onOrderSyncedSuccess?: (syncedOrder: Order) => void;
  onNavigateToTracker?: (orderId: string) => void;
}

export default function OfflineOrderSavedModal({
  isOpen,
  onClose,
  offlineOrder,
  onOrderSyncedSuccess,
  onNavigateToTracker,
}: OfflineOrderSavedModalProps) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [syncedOrderResult, setSyncedOrderResult] = useState<Order | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setRetryError(null);
      // Automatically attempt sync when coming online while modal is open
      if (offlineOrder && !syncedOrderResult && !isRetrying) {
        handleRetrySync();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineOrder, syncedOrderResult, isRetrying]);

  if (!isOpen || !offlineOrder) return null;

  const handleRetrySync = async () => {
    if (!offlineOrder) return;
    setIsRetrying(true);
    setRetryError(null);

    try {
      const realOrder = await syncSingleOfflineOrder(offlineOrder);
      recordSyncedOrderInLocalStorage(realOrder, offlineOrder.id);
      await removeOfflineOrder(offlineOrder.id);
      setSyncedOrderResult(realOrder);
      if (onOrderSyncedSuccess) {
        onOrderSyncedSuccess(realOrder);
      }
    } catch (err: any) {
      console.warn('Manual sync attempt failed:', err);
      setRetryError(err.message || 'Server connection unreachable. We will auto-retry in the background.');
    } finally {
      setIsRetrying(false);
    }
  };

  const generateWhatsAppOrderLink = () => {
    if (!offlineOrder) return '#';
    const itemsText = offlineOrder.orderPayload.items
      .map(it => `• ${it.quantity}x ${it.name} (Rs. ${it.price * it.quantity})`)
      .join('\n');
    
    const message = `*🧁 Muffinns Bakery Offline Order Backup*\n` +
      `*Offline Ref:* ${offlineOrder.id}\n` +
      `*Customer:* ${offlineOrder.orderPayload.customerName} (${offlineOrder.orderPayload.customerPhone})\n` +
      `*Address:* ${offlineOrder.orderPayload.customerAddress}\n` +
      `*Payment:* ${offlineOrder.orderPayload.paymentMethod}\n\n` +
      `*Items:*\n${itemsText}\n\n` +
      `*Total Amount:* Rs. ${offlineOrder.orderPayload.totalAmount.toLocaleString()}\n` +
      `*(Note: Saved to device IndexedDB while network was offline)*`;

    return `https://wa.me/923202587047?text=${encodeURIComponent(message)}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-brand-caramel/20 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className={`p-6 text-white relative overflow-hidden transition-colors ${
            syncedOrderResult 
              ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700' 
              : 'bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700'
          }`}>
            <div className="absolute right-3 top-3">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                {syncedOrderResult ? (
                  <CheckCircle2 className="w-7 h-7 text-white animate-bounce" />
                ) : (
                  <Database className="w-7 h-7 text-amber-200 animate-pulse" />
                )}
              </div>
              <div>
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white mb-1">
                  {syncedOrderResult ? 'Synced With Kitchen' : 'Saved to IndexedDB'}
                </span>
                <h3 className="text-xl font-serif font-bold text-white leading-tight">
                  {syncedOrderResult ? 'Order Submitted Successfully!' : 'Order Saved to Device Storage'}
                </h3>
              </div>
            </div>

            <p className="text-xs text-white/90 leading-relaxed font-medium">
              {syncedOrderResult ? (
                `Your order has been officially registered with the bakery kitchen (ID: #${syncedOrderResult.id}).`
              ) : (
                'Network connection was unavailable, so your order details were safely recorded in your browser’s IndexedDB database.'
              )}
            </p>
          </div>

          {/* Connection Status Pill Banner */}
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
            isOnline 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50' 
              : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
          }`}>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Internet Connection Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                  <span>Offline / Low Connectivity Mode</span>
                </>
              )}
            </div>
            <span className="text-[11px] opacity-80">
              {syncedOrderResult ? 'Sync Complete' : 'Auto-Sync Active'}
            </span>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 text-stone-800 dark:text-stone-200">
            {/* Order Card Info */}
            <div className="p-4 rounded-2xl bg-brand-cream/60 dark:bg-stone-800/60 border border-brand-caramel/15 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-brand-caramel/10">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Reference Code</span>
                  <p className="font-mono font-bold text-sm text-brand-chocolate dark:text-amber-300">
                    {syncedOrderResult ? `#${syncedOrderResult.id}` : `#${offlineOrder.id}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Total Amount</span>
                  <AnimatedPrice 
                    value={offlineOrder.orderPayload.totalAmount} 
                    className="font-bold text-lg text-brand-caramel" 
                  />
                </div>
              </div>

              {/* Items preview list */}
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  Ordered Items ({offlineOrder.orderPayload.items.length})
                </span>
                {offlineOrder.orderPayload.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-0.5">
                    <span className="font-medium text-stone-700 dark:text-stone-300 truncate mr-2">
                      {it.quantity}x {it.name}
                    </span>
                    <span className="font-semibold text-brand-chocolate dark:text-stone-200 shrink-0">
                      Rs. {(it.price * it.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-brand-caramel/10 flex justify-between text-xs text-stone-600 dark:text-stone-400">
                <span>Customer: <strong>{offlineOrder.orderPayload.customerName}</strong></span>
                <span>Payment: <strong>{offlineOrder.orderPayload.paymentMethod}</strong></span>
              </div>
            </div>

            {/* Error Message if Retry failed */}
            {retryError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Sync Attempt Failed</p>
                  <p className="opacity-90">{retryError}</p>
                </div>
              </div>
            )}

            {/* Reassurance explanation */}
            {!syncedOrderResult && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-stone-700 dark:text-stone-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>How Automatic Background Sync Works:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90 pl-1">
                  <li>Your order is securely saved inside your browser’s IndexedDB sandbox.</li>
                  <li>As soon as your Wi-Fi or mobile data reconnects, we’ll transmit it automatically to the kitchen.</li>
                  <li>You can also click <strong>Retry / Sync Now</strong> below or send a 1-tap WhatsApp backup.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 space-y-3">
            {syncedOrderResult ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToTracker) {
                      onNavigateToTracker(syncedOrderResult.id);
                    }
                  }}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Track Live Order #{syncedOrderResult.id}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-5 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={isRetrying}
                    onClick={handleRetrySync}
                    className="flex-1 py-3 px-4 bg-brand-caramel hover:bg-brand-chocolate text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                    <span>{isRetrying ? 'Connecting to Kitchen...' : 'Retry / Sync Now'}</span>
                  </button>

                  <a
                    href={generateWhatsAppOrderLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp Backup</span>
                  </a>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onNavigateToTracker) {
                        onNavigateToTracker(offlineOrder.id);
                      }
                    }}
                    className="text-xs text-brand-caramel hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View in Order Tracker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-semibold cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
