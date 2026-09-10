import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, RefreshCw, WifiOff, Wifi, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { OfflineOrder, getOfflineOrders, syncAllPendingOfflineOrders } from '../utils/offlineOrderDB';
import { Order } from '../types';

interface OfflineSyncBannerProps {
  onNavigateToOrder?: (orderId: string) => void;
  onOrderSynced?: (syncedOrder: Order) => void;
}

export default function OfflineSyncBanner({
  onNavigateToOrder,
  onOrderSynced
}: OfflineSyncBannerProps) {
  const [offlineOrders, setOfflineOrders] = useState<OfflineOrder[]>([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastSyncSuccessMsg, setLastSyncSuccessMsg] = useState<string | null>(null);

  const loadOfflineOrders = async () => {
    try {
      const orders = await getOfflineOrders();
      setOfflineOrders(orders.filter(o => o.status === 'pending_sync' || o.status === 'failed' || o.status === 'syncing'));
    } catch (e) {
      console.warn('Error loading offline orders for banner:', e);
    }
  };

  useEffect(() => {
    loadOfflineOrders();

    const handleUpdate = () => loadOfflineOrders();
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger background sync when online
      handleSyncAll();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('muffinns:offline-orders-updated', handleUpdate);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check every 10 seconds
    const interval = setInterval(loadOfflineOrders, 10000);

    return () => {
      window.removeEventListener('muffinns:offline-orders-updated', handleUpdate);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSyncAll = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);

    try {
      const result = await syncAllPendingOfflineOrders((syncedOrder) => {
        if (onOrderSynced) onOrderSynced(syncedOrder);
      });

      if (result.synced.length > 0) {
        setLastSyncSuccessMsg(
          result.synced.length === 1
            ? `Order #${result.synced[0].id} synced with the bakery kitchen! 🎉`
            : `${result.synced.length} offline orders synced with the bakery kitchen! 🎉`
        );
        setTimeout(() => setLastSyncSuccessMsg(null), 6000);
      }
    } catch (e) {
      console.warn('Manual sync failed:', e);
    } finally {
      setIsSyncing(false);
      loadOfflineOrders();
    }
  };

  if (offlineOrders.length === 0 && !lastSyncSuccessMsg) {
    return null;
  }

  if (isDismissed && !lastSyncSuccessMsg) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="relative z-40 w-full"
      >
        {lastSyncSuccessMsg ? (
          <div className="bg-emerald-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm font-semibold">
            <div className="container mx-auto max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>{lastSyncSuccessMsg}</span>
              </div>
              <button
                onClick={() => setLastSyncSuccessMsg(null)}
                className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-2.5 shadow-md">
            <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5 font-medium">
                <div className="w-7 h-7 rounded-lg bg-amber-700/60 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4 text-amber-200" />
                </div>
                <div>
                  <span className="font-bold">
                    {offlineOrders.length} Order{offlineOrders.length > 1 ? 's' : ''} Saved Offline in IndexedDB
                  </span>
                  <span className="hidden md:inline ml-2 text-amber-100 text-xs">
                    {isOnline ? 'Internet connection available — ready to sync.' : 'Will automatically transmit as soon as connection is restored.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={!isOnline || isSyncing}
                  onClick={handleSyncAll}
                  className="py-1.5 px-3 bg-white text-amber-800 hover:bg-amber-100 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>

                {onNavigateToOrder && offlineOrders[0] && (
                  <button
                    type="button"
                    onClick={() => onNavigateToOrder(offlineOrders[0].id)}
                    className="py-1.5 px-2.5 bg-amber-700/80 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Queued</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  className="p-1 text-amber-200 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
