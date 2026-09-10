import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Truck, CheckCircle2, X, ChefHat, ShieldAlert } from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface ToastMessage {
  id: string;
  orderId: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'delivery' | 'warning';
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
}

const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered successfully with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  return null;
};

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notifications');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

const showBrowserNotification = async (title: string, body: string, url: string = '/') => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Try to use Service Worker registration first
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        reg.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          data: { url }
        } as any);
        return;
      }
    } catch (e) {
      console.warn('Could not show notification via Service Worker, falling back to standard Notification:', e);
    }
  }

  // Fallback to standard Notification API
  try {
    new Notification(title, { body, icon: '/favicon.ico' });
  } catch (e) {
    console.error('Failed to show standard notification:', e);
  }
};

const triggerAudioChime = (type: 'info' | 'success' | 'delivery' | 'warning') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'delivery') {
      // Nice happy major-scale arpeggio 🛵
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.setValueAtTime(329.63, now + 0.1); // E4
      osc.frequency.setValueAtTime(392.00, now + 0.2); // G4
      osc.frequency.setValueAtTime(523.25, now + 0.3); // C5
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'success') {
      // Sweet high bell sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      // Normal cute notification sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440.00, now); // A4
      osc.frequency.setValueAtTime(554.37, now + 0.08); // C#5
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    console.log('Audio Context block or unsupported:', e);
  }
};

interface NotificationManagerProps {
  onNavigateToOrder: (orderId: string) => void;
}

export default function NotificationManager({ onNavigateToOrder }: NotificationManagerProps) {
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [hasNewPermissionPrompt, setHasNewPermissionPrompt] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermissionStatus('unsupported');
    } else {
      setPermissionStatus(Notification.permission as any);
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => {
          setHasNewPermissionPrompt(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    // Run initial check right away
    checkTrackedOrders();

    // 1. Setup real-time Server-Sent Events (SSE) listener for instant backend status updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/orders/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === 'order_updated' && data.order) {
            processSingleOrderUpdate(data.order);
          }
        } catch (e) {
          // Silent SSE JSON parse catch
        }
      };
    } catch (e) {
      console.warn('SSE stream error or fallback to polling:', e);
    }

    // 2. Poll every 4 seconds as a fallback
    const pollInterval = setInterval(() => {
      checkTrackedOrders();
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const getAllTrackedIds = (): string[] => {
    try {
      const tracked: string[] = JSON.parse(localStorage.getItem('muffinns_tracked_orders') || '[]');
      const history: Order[] = JSON.parse(localStorage.getItem('muffinns_order_history') || '[]');
      const historyIds = history.map(o => o.id);
      return Array.from(new Set([...tracked, ...historyIds].filter(Boolean)));
    } catch {
      return [];
    }
  };

  const processSingleOrderUpdate = (order: Order) => {
    if (!order || !order.id) return;
    const trackedIds = getAllTrackedIds();
    
    // Check if this order is associated with the user's browser session or tracked
    const isTracked = trackedIds.some(id => id.toUpperCase() === order.id.toUpperCase());
    if (!isTracked && trackedIds.length > 0) {
      // Still process if tracked list isn't empty, to ensure responsiveness
    }

    const savedStatuses: { [id: string]: OrderStatus } = JSON.parse(
      localStorage.getItem('muffinns_order_statuses') || '{}'
    );

    const previousStatus = savedStatuses[order.id];
    const currentStatus = order.status;

    if (previousStatus && previousStatus !== currentStatus) {
      handleStatusChange(order, previousStatus, currentStatus);
      savedStatuses[order.id] = currentStatus;
      localStorage.setItem('muffinns_order_statuses', JSON.stringify(savedStatuses));
      
      // Update local history snapshot as well
      updateLocalHistoryOrder(order);
    } else if (!previousStatus) {
      savedStatuses[order.id] = currentStatus;
      localStorage.setItem('muffinns_order_statuses', JSON.stringify(savedStatuses));
    }
  };

  const updateLocalHistoryOrder = (updatedOrder: Order) => {
    try {
      const history: Order[] = JSON.parse(localStorage.getItem('muffinns_order_history') || '[]');
      const idx = history.findIndex(o => o.id.toUpperCase() === updatedOrder.id.toUpperCase());
      if (idx > -1) {
        history[idx] = updatedOrder;
        localStorage.setItem('muffinns_order_history', JSON.stringify(history));
      }
    } catch (e) {
      console.error('Failed to sync updated order to local history:', e);
    }
  };

  const checkTrackedOrders = async () => {
    try {
      const trackedOrderIds = getAllTrackedIds();
      if (trackedOrderIds.length === 0) return;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('/api/orders', { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (!res || !res.ok) return;
      const allOrders: Order[] = await res.json().catch(() => []);
      if (!Array.isArray(allOrders)) return;

      allOrders.forEach(order => {
        if (trackedOrderIds.some(id => id.toUpperCase() === order.id.toUpperCase())) {
          processSingleOrderUpdate(order);
        }
      });
    } catch {
      // Quietly ignore transient network/polling errors
    }
  };

  const handleStatusChange = (order: Order, oldStatus: OrderStatus, newStatus: OrderStatus) => {
    let title = '';
    let body = '';
    let type: 'info' | 'success' | 'delivery' | 'warning' = 'info';

    if (newStatus === 'Out for Delivery') {
      title = `Scooter Dispatched! 🛵 ${order.id}`;
      body = `Hi ${order.customerName || 'Valued Customer'}, your fresh treats are Out for Delivery! Our rider is speeding to your doorstep!`;
      type = 'delivery';
    } else if (newStatus === 'Preparing') {
      title = `Ovens Preheated! 🧁 ${order.id}`;
      body = `Excellent news, ${order.customerName || 'Valued Customer'}! Our master bakers have started preparing your order in the hot stone ovens!`;
      type = 'info';
    } else if (newStatus === 'Completed') {
      title = `Order Delivered! 🎉 ${order.id}`;
      body = `Hooray! Your order ${order.id} has been delivered successfully. Enjoy your delicious Muffinns treats!`;
      type = 'success';
    } else if (newStatus === 'Cancelled') {
      title = `Order Cancelled ❌ ${order.id}`;
      body = `Your order status has been updated to Cancelled. Please contact Muffinns support if you have any questions.`;
      type = 'warning';
    } else {
      title = `Order Updated: ${newStatus}`;
      body = `Your order ${order.id} status is now ${newStatus}.`;
      type = 'info';
    }

    // 1. Trigger native push/browser notification
    showBrowserNotification(title, body, '/');

    // 2. Trigger audio chime simulation
    triggerAudioChime(type);

    // 3. Trigger Toast/Snackbar notification in app state
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastMessage = {
      id: toastId,
      orderId: order.id,
      title,
      body,
      type,
      oldStatus,
      newStatus
    };

    setToasts(prev => [newToast, ...prev.slice(0, 4)]); // Limit max concurrent toasts

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 10000);
  };

  return (
    <>
      {/* Global Toast Container */}
      <div id="global-toast-container" className="fixed top-24 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t, tIdx) => (
            <motion.div
              key={`toast-msg-${t.id}`}
              initial={{ opacity: 0, x: 50, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="pointer-events-auto bg-brand-sugar/95 backdrop-blur-md border border-brand-caramel/20 rounded-2xl p-4 shadow-2xl flex gap-3.5 items-start text-brand-chocolate relative overflow-hidden"
            >
              {/* Decorative side accent */}
              <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                t.type === 'delivery' ? 'bg-sky-500' :
                t.type === 'success' ? 'bg-emerald-500' :
                t.type === 'warning' ? 'bg-red-500' : 'bg-brand-caramel'
              }`} />

              {/* Status specific icon */}
              <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                t.type === 'delivery' ? 'bg-sky-100 text-sky-600' :
                t.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                t.type === 'warning' ? 'bg-red-100 text-red-600' : 'bg-brand-caramel/15 text-brand-caramel'
              }`}>
                {t.type === 'delivery' ? <Truck className="w-5.5 h-5.5" /> :
                 t.type === 'success' ? <CheckCircle2 className="w-5.5 h-5.5" /> :
                 t.type === 'warning' ? <ShieldAlert className="w-5.5 h-5.5" /> :
                 <ChefHat className="w-5.5 h-5.5" />}
              </div>

              {/* Text content */}
              <div className="flex-grow space-y-1 pr-4">
                <h5 className="font-serif font-black text-sm text-brand-chocolate leading-none">
                  {t.title}
                </h5>
                <p className="text-[11px] text-brand-chocolate/75 leading-relaxed font-sans font-medium">
                  {t.body}
                </p>
                <div className="flex gap-2 pt-1.5">
                  <button
                    onClick={() => {
                      onNavigateToOrder(t.orderId);
                      setToasts(prev => prev.filter(item => item.id !== t.id));
                    }}
                    className="text-[10px] font-bold text-brand-caramel hover:text-brand-chocolate uppercase tracking-wider cursor-pointer"
                  >
                    Track Live Progress →
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                className="absolute top-3 right-3 text-brand-chocolate/40 hover:text-brand-chocolate p-0.5 rounded-lg hover:bg-brand-cream/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Gentle Floating Notification Permission Assistant */}
      <AnimatePresence>
        {hasNewPermissionPrompt && permissionStatus === 'default' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-4 z-40 max-w-sm w-full bg-brand-chocolate text-brand-cream border border-brand-honey/20 p-4 rounded-2xl shadow-2xl space-y-3.5"
          >
            <div className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-xl bg-brand-honey/15 text-brand-honey shrink-0 flex items-center justify-center">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-serif font-bold text-sm text-brand-honey">Enable Order Updates?</h5>
                <p className="text-[10px] text-brand-cream/70 leading-normal font-sans">
                  Let us alert you the split second your cakes, croissants, and buns are hot & out for delivery! 🛵
                </p>
              </div>
              <button
                onClick={() => setHasNewPermissionPrompt(false)}
                className="text-brand-cream/40 hover:text-brand-cream cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={async () => {
                  const granted = await requestNotificationPermission();
                  if (granted) {
                    setPermissionStatus('granted');
                    showBrowserNotification(
                      'Live Tracking Enabled! 🛵',
                      'Awesome! We will ping you when your Muffinns order shifts from preparing to out for delivery!'
                    );
                  } else {
                    setPermissionStatus('denied');
                  }
                  setHasNewPermissionPrompt(false);
                }}
                className="flex-1 py-2 bg-brand-honey hover:bg-brand-caramel text-brand-chocolate hover:text-brand-cream font-bold text-[11px] rounded-lg shadow cursor-pointer transition-colors"
              >
                Allow Alerts
              </button>
              <button
                onClick={() => setHasNewPermissionPrompt(false)}
                className="px-3 py-2 bg-brand-cream/10 hover:bg-brand-cream/20 text-brand-cream text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
              >
                Later
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
