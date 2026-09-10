import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Phone, Calendar, ShoppingBag, CheckCircle, Clock, Truck, 
  ClipboardCheck, MessageSquare, History, RotateCcw, ArrowRight, Trash2, 
  Sparkles, Copy, Check, ChevronRight, AlertCircle, ShoppingCart, X, Download, FileText, Printer, Heart,
  Database, WifiOff, Wifi, RefreshCw
} from 'lucide-react';
import { Order, OrderStatus, CartItem, MenuItem, FavoriteOrderItem } from '../types';
import { getStoredMenuItems, getCategoryFallbackImage } from '../utils/menuStorage';
import { generateReceiptPDF } from '../utils/pdfReceipt';
import { getOfflineOrders, OfflineOrder, offlineOrderToDisplayOrder, syncSingleOfflineOrder, removeOfflineOrder, recordSyncedOrderInLocalStorage } from '../utils/offlineOrderDB';
import KitchenReceipt from './KitchenReceipt';

interface OrderTrackerProps {
  initialOrderId?: string;
  onAddToCart?: (item: CartItem) => void;
  onReorderAll?: (items: CartItem[]) => void;
  onOpenCart?: () => void;
  onNavigateToMenu?: () => void;
}

export default function OrderTracker({ 
  initialOrderId = '', 
  onAddToCart, 
  onReorderAll, 
  onOpenCart, 
  onNavigateToMenu 
}: OrderTrackerProps) {
  const [activeTab, setActiveTab] = useState<'track' | 'history'>('track');
  const [searchId, setSearchId] = useState(initialOrderId);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // History states
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');
  const [reorderBanner, setReorderBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [favoriteItems, setFavoriteItems] = useState<FavoriteOrderItem[]>([]);
  const [animatingBtnKey, setAnimatingBtnKey] = useState<string | null>(null);
  const [offlineOrdersList, setOfflineOrdersList] = useState<OfflineOrder[]>([]);
  const [syncingOfflineId, setSyncingOfflineId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem('muffinns_favorite_items');
      if (savedFavs) {
        setFavoriteItems(JSON.parse(savedFavs));
      }
    } catch (e) {
      console.error('Error loading favorite items:', e);
    }
  }, []);

  const isItemFavorite = (it: Order['items'][0]) => {
    const favId = `${it.itemId || it.name}-${it.size || 'default'}`;
    return favoriteItems.some(f => f.id === favId || f.name.toLowerCase() === it.name.toLowerCase());
  };

  const toggleFavoriteItem = (it: Order['items'][0]) => {
    const favId = `${it.itemId || it.name}-${it.size || 'default'}`;
    const mappedCartItem = mapOrderItemToCartItem(it);
    
    let updatedFavs: FavoriteOrderItem[] = [];
    const exists = favoriteItems.some(f => f.id === favId || f.name.toLowerCase() === it.name.toLowerCase());

    if (exists) {
      updatedFavs = favoriteItems.filter(f => f.id !== favId && f.name.toLowerCase() !== it.name.toLowerCase());
      setReorderBanner(`Removed "${it.name}" from your Favorites.`);
    } else {
      const newFav: FavoriteOrderItem = {
        id: favId,
        itemId: it.itemId || mappedCartItem.item.id,
        name: it.name,
        price: it.price,
        size: it.size,
        notes: it.notes,
        image: mappedCartItem.item.image,
        category: mappedCartItem.item.category,
        savedAt: new Date().toISOString()
      };
      updatedFavs = [newFav, ...favoriteItems];
      
      const msg = `Saved "${it.name}" to your recurring Favorites! ❤️`;
      setReorderBanner(msg);
      setReorderNotification({
        id: `fav-${Date.now()}`,
        title: `Saved to Favorites! ❤️`,
        message: `"${it.name}" is now saved in your favorites for 1-click quick re-ordering!`,
        subtext: `Access your favorite recurring breakfast or snack items anytime directly from the cart.`
      });
      playSuccessChime();
    }

    setFavoriteItems(updatedFavs);
    localStorage.setItem('muffinns_favorite_items', JSON.stringify(updatedFavs));

    setTimeout(() => {
      setReorderBanner(null);
      setReorderNotification(null);
    }, 4500);
  };

  useEffect(() => {
    if (initialOrderId) {
      setSearchId(initialOrderId);
      trackOrderById(initialOrderId);
      setActiveTab('track');
    }
  }, [initialOrderId]);

  // Sync order history on tab change or mount
  useEffect(() => {
    loadOrderHistory();

    const handleOfflineUpdate = () => {
      loadOrderHistory();
    };

    window.addEventListener('muffinns:offline-orders-updated', handleOfflineUpdate);
    window.addEventListener('muffinns:order-auto-synced', handleOfflineUpdate);
    window.addEventListener('online', handleOfflineUpdate);

    return () => {
      window.removeEventListener('muffinns:offline-orders-updated', handleOfflineUpdate);
      window.removeEventListener('muffinns:order-auto-synced', handleOfflineUpdate);
      window.removeEventListener('online', handleOfflineUpdate);
    };
  }, [activeTab]);

  const loadOrderHistory = async () => {
    setHistoryLoading(true);
    try {
      // 0. Retrieve pending offline orders from IndexedDB
      const rawOffline = await getOfflineOrders().catch(() => []);
      const pendingOffline = rawOffline.filter(o => o.status !== 'synced');
      setOfflineOrdersList(pendingOffline);
      const offlineDisplayOrders = pendingOffline.map(offlineOrderToDisplayOrder);

      // 1. Retrieve local history snapshots
      const savedHistoryRaw = localStorage.getItem('muffinns_order_history');
      let localOrders: Order[] = savedHistoryRaw ? JSON.parse(savedHistoryRaw) : [];

      // 2. Retrieve tracked order IDs
      const trackedIdsRaw = localStorage.getItem('muffinns_tracked_orders');
      const trackedIds: string[] = trackedIdsRaw ? JSON.parse(trackedIdsRaw) : [];

      // 3. Fetch fresh status from backend server
      const res = await fetch('/api/orders').catch(() => null);
      if (res && res.ok) {
        const serverOrders: Order[] = await res.json().catch(() => []);

        // Match server orders with tracked or local history IDs
        const relevantServerOrders = (Array.isArray(serverOrders) ? serverOrders : []).filter(so => 
          trackedIds.some(id => id.toUpperCase() === so.id.toUpperCase()) ||
          localOrders.some(lo => lo.id.toUpperCase() === so.id.toUpperCase())
        );

        // Merge keeping latest data
        const mergedMap = new Map<string, Order>();
        localOrders.forEach(o => {
          if (o && o.id) mergedMap.set(o.id.toUpperCase(), o);
        });
        relevantServerOrders.forEach(o => {
          if (o && o.id) mergedMap.set(o.id.toUpperCase(), o);
        });
        offlineDisplayOrders.forEach(o => {
          if (o && o.id) mergedMap.set(o.id.toUpperCase(), o);
        });

        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setHistoryOrders(mergedList);
        localStorage.setItem('muffinns_order_history', JSON.stringify(mergedList));
      } else {
        const mergedMap = new Map<string, Order>();
        localOrders.forEach(o => {
          if (o && o.id) mergedMap.set(o.id.toUpperCase(), o);
        });
        offlineDisplayOrders.forEach(o => {
          if (o && o.id) mergedMap.set(o.id.toUpperCase(), o);
        });
        const uniqueLocal = Array.from(mergedMap.values());
        setHistoryOrders(uniqueLocal.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (err) {
      console.error('Error loading order history:', err);
      const saved = localStorage.getItem('muffinns_order_history');
      if (saved) {
        setHistoryOrders(JSON.parse(saved));
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const trackOrderById = async (id: string) => {
    const trimmed = id.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setErrorMsg('');
    setTrackedOrder(null);

    try {
      let found: Order | undefined;
      const res = await fetch('/api/orders').catch(() => null);
      if (res && res.ok) {
        const orders: Order[] = await res.json().catch(() => []);
        if (Array.isArray(orders)) {
          found = orders.find(o => o.id.toUpperCase() === trimmed);
        }
      }

      // Fallback to local storage history if server fetch fails or doesn't return
      if (!found) {
        const currentHistory: Order[] = JSON.parse(localStorage.getItem('muffinns_order_history') || '[]');
        found = currentHistory.find(o => o.id.toUpperCase() === trimmed);
      }

      // Fallback to IndexedDB offline orders
      if (!found) {
        const rawOffline = await getOfflineOrders().catch(() => []);
        const matchedOffline = rawOffline.find(o => o.id.toUpperCase() === trimmed);
        if (matchedOffline) {
          found = offlineOrderToDisplayOrder(matchedOffline);
        }
      }
      
      if (found) {
        setTrackedOrder(found);
        
        // Register in localStorage tracking list and history
        try {
          const currentTracked = JSON.parse(localStorage.getItem('muffinns_tracked_orders') || '[]');
          if (!currentTracked.includes(found.id)) {
            currentTracked.unshift(found.id);
            localStorage.setItem('muffinns_tracked_orders', JSON.stringify(currentTracked));
          }
          
          const currentStatuses = JSON.parse(localStorage.getItem('muffinns_order_statuses') || '{}');
          currentStatuses[found.id] = found.status;
          localStorage.setItem('muffinns_order_statuses', JSON.stringify(currentStatuses));

          // Save to history
          const currentHistory: Order[] = JSON.parse(localStorage.getItem('muffinns_order_history') || '[]');
          const existingIdx = currentHistory.findIndex(o => o.id.toUpperCase() === found.id.toUpperCase());
          if (existingIdx > -1) {
            currentHistory[existingIdx] = found;
          } else {
            currentHistory.unshift(found);
          }
          localStorage.setItem('muffinns_order_history', JSON.stringify(currentHistory));
          setHistoryOrders(currentHistory);
        } catch (e) {
          console.error('Error registering searched order for tracking:', e);
        }
      } else {
        setErrorMsg(`We couldn't find an order matching "${trimmed}". Please verify your Invoice ID.`);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to our kitchen tracking system. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSingleOffline = async (offlineId: string) => {
    setSyncingOfflineId(offlineId);
    setErrorMsg('');
    try {
      const allOffline = await getOfflineOrders();
      const target = allOffline.find(o => o.id.toUpperCase() === offlineId.toUpperCase());
      if (!target) {
        throw new Error('Offline order record not found in IndexedDB.');
      }
      const realOrder = await syncSingleOfflineOrder(target);
      recordSyncedOrderInLocalStorage(realOrder, offlineId);
      await removeOfflineOrder(target.id);
      await loadOrderHistory();
      if (trackedOrder?.id.toUpperCase() === offlineId.toUpperCase()) {
        setTrackedOrder(realOrder);
        setSearchId(realOrder.id);
      }
      playSuccessChime();
      setReorderBanner(`Order #${realOrder.id} successfully sent to bakery kitchen! 🎉`);
      setTimeout(() => setReorderBanner(null), 5000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Connection unreachable. Order remains saved in IndexedDB and will auto-sync when online.');
    } finally {
      setSyncingOfflineId(null);
    }
  };

  const mapOrderItemToCartItem = (it: Order['items'][0]): CartItem => {
    // Find matching MenuItem in catalog
    const currentMenuItems = getStoredMenuItems();
    const matchedMenuItem = currentMenuItems.find(
      m => m.id === it.itemId || m.name.toLowerCase() === it.name.toLowerCase().split('(')[0].trim()
    );

    if (matchedMenuItem) {
      const selectedSize = it.size 
        ? matchedMenuItem.sizes?.find(s => s.label.toLowerCase() === it.size?.toLowerCase()) 
        : undefined;

      return {
        item: matchedMenuItem,
        selectedSize: selectedSize || (it.size ? { label: it.size, price: it.price } : undefined),
        quantity: it.quantity,
        notes: it.notes
      };
    }

    // Fallback if item ID was customized or created dynamically
    const fallbackMenuItem: MenuItem = {
      id: it.itemId || `item-${Date.now()}`,
      name: it.name.replace(/\s*\([^)]*\)/, ''),
      category: 'Savory Snacks',
      description: 'Specialty Muffinns bakery item',
      basePrice: it.price,
      image: 'https://i.ibb.co/KjxwTQQt/Whats-App-Image-2026-08-31-at-4-53-00-PM.jpg'
    };

    return {
      item: fallbackMenuItem,
      selectedSize: it.size ? { label: it.size, price: it.price } : undefined,
      quantity: it.quantity,
      notes: it.notes
    };
  };

  const [reorderNotification, setReorderNotification] = useState<{
    id: string;
    title: string;
    message: string;
    subtext?: string;
    itemCount?: number;
  } | null>(null);

  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      // Audio not permitted or supported
    }
  };

  const handleReorderItem = (it: Order['items'][0], btnKey?: string) => {
    if (btnKey) {
      setAnimatingBtnKey(btnKey);
      setTimeout(() => {
        setAnimatingBtnKey(prev => (prev === btnKey ? null : prev));
      }, 1200);
    }

    const cartItem = mapOrderItemToCartItem(it);
    if (onAddToCart) {
      onAddToCart(cartItem);
    }
    const title = `Item Added to Active Cart! 🛒`;
    const msg = `Successfully re-ordered "${it.name}" (Qty: ${it.quantity})`;
    const sub = `Item has been added to your active shopping cart.`;
    
    setReorderBanner(msg);
    setReorderNotification({
      id: `reorder-${Date.now()}`,
      title,
      message: msg,
      subtext: sub,
      itemCount: it.quantity
    });

    playSuccessChime();

    setTimeout(() => {
      setReorderBanner(null);
      setReorderNotification(null);
    }, 4500);
  };

  const handleReorderOrder = (order: Order, btnKey?: string) => {
    if (btnKey) {
      setAnimatingBtnKey(btnKey);
      setTimeout(() => {
        setAnimatingBtnKey(prev => (prev === btnKey ? null : prev));
      }, 1200);
    }

    const cartItems = order.items.map(mapOrderItemToCartItem);
    if (onReorderAll) {
      onReorderAll(cartItems);
    } else if (onAddToCart) {
      cartItems.forEach(ci => onAddToCart(ci));
    }
    const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const title = `Entire Order Re-Added! 🥐`;
    const msg = `Re-ordered ${order.items.length} item types (${totalQty} total items) from Invoice #${order.id}!`;
    const sub = `All items from this past order are now in your active cart.`;

    setReorderBanner(msg);
    setReorderNotification({
      id: `reorder-${Date.now()}`,
      title,
      message: msg,
      subtext: sub,
      itemCount: totalQty
    });

    playSuccessChime();

    setTimeout(() => {
      setReorderBanner(null);
      setReorderNotification(null);
    }, 4500);
  };

  const handleTrackFromHistory = (orderId: string) => {
    setActiveTab('track');
    setSearchId(orderId);
    trackOrderById(orderId);
  };

  const handleCopyInvoice = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setShowClearConfirmModal(true);
  };

  const confirmAndClearHistory = () => {
    setHistoryOrders([]);
    localStorage.removeItem('muffinns_order_history');
    localStorage.removeItem('muffinns_tracked_orders');
    localStorage.removeItem('muffinns_order_statuses');
    setShowClearConfirmModal(false);
  };

  const handleAddSampleOrder = () => {
    const sample: Order = {
      id: `MUFF-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: 'Past Baker Guest',
      customerPhone: '0300 1234567',
      customerAddress: 'Model Town, Bahawalpur',
      items: [
        { itemId: 'three-milk-cake', name: 'Three Milk Cake (Tres Leches)', quantity: 1, size: '2 lb Box', price: 1850 },
        { itemId: 'patashay-special', name: 'Patashay Signature Sweets', quantity: 2, size: '500g Pack', price: 650, notes: 'Less syrup please' },
        { itemId: 'chicken-patty', name: 'Flaky Chicken Patty', quantity: 4, price: 120 }
      ],
      totalAmount: 3630,
      status: 'Completed',
      paymentMethod: 'Cash on Delivery',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    };

    const updated = [sample, ...historyOrders];
    setHistoryOrders(updated);
    localStorage.setItem('muffinns_order_history', JSON.stringify(updated));
    
    const currentTracked = JSON.parse(localStorage.getItem('muffinns_tracked_orders') || '[]');
    if (!currentTracked.includes(sample.id)) {
      currentTracked.unshift(sample.id);
      localStorage.setItem('muffinns_tracked_orders', JSON.stringify(currentTracked));
    }
  };

  const getStatusStep = (status: OrderStatus): number => {
    switch (status) {
      case 'Pending': return 1;
      case 'Preparing': return 2;
      case 'Out for Delivery': return 3;
      case 'Completed': return 4;
      case 'Cancelled': return 0;
      default: return 1;
    }
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Preparing': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Out for Delivery': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Completed': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-brand-cream text-brand-chocolate border-brand-caramel/20';
    }
  };

  const steps = [
    { label: 'Order Registered', desc: 'Received in our system', icon: ClipboardCheck },
    { label: 'Kitchen Preparing', desc: 'Sweets and buns baking hot', icon: Clock },
    { label: 'Out for Delivery', desc: 'Scooter dispatched with fresh treats', icon: Truck },
    { label: 'Completed', desc: 'Delivered and enjoyed!', icon: CheckCircle }
  ];

  const currentStep = trackedOrder ? getStatusStep(trackedOrder.status) : 1;

  const getWhatsAppLink = (order: Order, phone: string = '923202587047') => {
    const message = encodeURIComponent(`Hi Muffinns! 🌸 I am checking on my sweet order ID *${order.id}* placed by ${order.customerName}. Current tracking status is: ${order.status}.`);
    return `https://wa.me/${phone}?text=${message}`;
  };

  // Filtered history
  const filteredHistory = historyOrders.filter(o => {
    if (!historyQuery.trim()) return true;
    const q = historyQuery.toLowerCase();
    const matchesId = o.id.toLowerCase().includes(q);
    const matchesName = o.customerName.toLowerCase().includes(q);
    const matchesItem = o.items.some(it => it.name.toLowerCase().includes(q));
    return matchesId || matchesName || matchesItem;
  });

  return (
    <section className="py-12 px-4 bg-brand-cream/20" id="tracker-section">
      <div className="container mx-auto max-w-4xl">
        
        {/* Header Title */}
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <h2 className="text-3xl sm:text-4xl font-serif text-brand-chocolate font-bold">
            Customer Dashboard & Orders
          </h2>
          <p className="text-xs text-brand-caramel font-semibold uppercase tracking-widest">
            Track Live Deliveries & Re-Order Favorite Bakery Treats
          </p>
          <div className="w-16 h-1 bg-brand-honey mx-auto rounded-full mt-2" />
        </div>

        {/* Fixed Floating Confirmation Toast Notification */}
        <AnimatePresence>
          {reorderNotification && (
            <motion.div
              key="reorder-toast-notification"
              initial={{ opacity: 0, y: -30, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="fixed top-24 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] bg-emerald-900/95 text-white backdrop-blur-md border border-emerald-400/30 rounded-2xl p-4 shadow-2xl space-y-3 pointer-events-auto"
            >
              <div className="flex items-start gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-6 h-6 text-emerald-400 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-emerald-200 flex items-center gap-1.5">
                      <span>{reorderNotification.title}</span>
                    </h4>
                    <p className="text-xs font-medium text-white/90 leading-snug mt-0.5">
                      {reorderNotification.message}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setReorderNotification(null)}
                  className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reorderNotification.subtext && (
                <p className="text-[11px] text-emerald-200/80 font-medium pl-13">
                  {reorderNotification.subtext}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 pt-1 border-t border-emerald-700/40 pl-1">
                <span className="text-[10px] text-emerald-300/80 font-bold uppercase tracking-wider">
                  Active Cart Updated
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setReorderNotification(null);
                      if (onOpenCart) onOpenCart();
                    }}
                    className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>View Cart & Checkout</span>
                  </button>
                </div>
              </div>

              {/* Progress bar countdown */}
              <motion.div 
                className="h-1 bg-emerald-400/60 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4.5, ease: 'linear' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Toast Reorder Banner (Inline fallback) */}
        <AnimatePresence>
          {reorderBanner && !reorderNotification && (
            <motion.div
              key="reorder-banner-toast"
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="mb-6 p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 shrink-0 animate-bounce" />
                <span>{reorderBanner}</span>
              </div>
              <button 
                onClick={onOpenCart}
                className="px-3 py-1.5 bg-white text-emerald-800 rounded-xl text-[11px] font-black hover:bg-emerald-50 transition-colors shrink-0"
              >
                View Cart
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB SWITCHER */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 bg-brand-sugar rounded-2xl border border-brand-caramel/15 shadow-sm text-xs font-bold">
            <button
              onClick={() => setActiveTab('track')}
              className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-brand-caramel text-brand-cream shadow-md'
                  : 'text-brand-chocolate/70 hover:text-brand-caramel hover:bg-brand-cream/50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Track Live Order</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-brand-caramel text-brand-cream shadow-md'
                  : 'text-brand-chocolate/70 hover:text-brand-caramel hover:bg-brand-cream/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Order History & Re-Order</span>
              {historyOrders.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'history' ? 'bg-brand-cream text-brand-chocolate' : 'bg-brand-caramel/15 text-brand-caramel'
                }`}>
                  {historyOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ================= TAB 1: LIVE ORDER TRACKER ================= */}
        {activeTab === 'track' && (
          <div>
            {/* Search bar */}
            <div className="max-w-xl mx-auto mb-10">
              <div className="flex gap-2.5 bg-white p-2 rounded-2xl shadow-md border border-brand-caramel/10">
                <div className="relative flex-grow flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-brand-caramel/50" />
                  <input
                    id="tracker-invoice-search-input"
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Enter Invoice ID e.g., MUFF-1234"
                    className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-sans focus:outline-none uppercase text-black placeholder:text-gray-400"
                    onKeyDown={(e) => { if (e.key === 'Enter') trackOrderById(searchId); }}
                  />
                </div>
                <button
                  onClick={() => trackOrderById(searchId)}
                  disabled={loading}
                  className="px-6 py-3 bg-brand-caramel hover:bg-brand-chocolate text-brand-cream font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  {loading ? 'Tracking...' : 'Search Invoice'}
                </button>
              </div>
              {errorMsg && (
                <p className="text-center text-xs text-red-600 font-medium mt-3">⚠️ {errorMsg}</p>
              )}
            </div>

            {/* Tracker Panel */}
            {trackedOrder && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-sugar rounded-2xl border border-brand-caramel/10 p-6 sm:p-8 shadow-xl space-y-8 text-brand-chocolate"
              >
                {/* Top row invoice summary */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-brand-caramel/5 pb-5">
                  <div className="space-y-1.5">
                    <div className="flex gap-2 flex-wrap items-center">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={trackedOrder.status}
                          initial={{ opacity: 0, y: -8, scale: 0.94 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.94 }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className={`inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider border shadow-xs ${
                            trackedOrder.id.startsWith('OFFLINE')
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : getStatusBadgeClass(trackedOrder.status)
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
                          {trackedOrder.id.startsWith('OFFLINE') ? 'Saved in IndexedDB (Pending Sync)' : trackedOrder.status}
                        </motion.span>
                      </AnimatePresence>
                      
                      {typeof Notification !== 'undefined' && (
                        <button
                          onClick={async () => {
                            if (Notification.permission === 'default') {
                              await Notification.requestPermission();
                              window.location.reload();
                            }
                          }}
                          className={`text-[9.5px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border cursor-pointer ${
                            Notification.permission === 'granted'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : Notification.permission === 'denied'
                              ? 'bg-red-50 border-red-200 text-red-600'
                              : 'bg-brand-sugar border-brand-caramel/25 text-brand-caramel hover:bg-brand-cream'
                          }`}
                        >
                          🔔 Alerts: {Notification.permission === 'granted' ? 'Enabled' : Notification.permission === 'denied' ? 'Blocked' : 'Click to Enable'}
                        </button>
                      )}
                    </div>
                    <h3 className="text-2xl font-serif font-black flex items-center gap-2">
                      <span>Invoice: {trackedOrder.id}</span>
                      <button 
                        onClick={() => handleCopyInvoice(trackedOrder.id)}
                        className="p-1 text-brand-caramel/60 hover:text-brand-caramel"
                        title="Copy Invoice ID"
                      >
                        {copiedId === trackedOrder.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </h3>
                    <p className="text-xs text-brand-chocolate/50 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Placed on {new Date(trackedOrder.createdAt).toLocaleString()}</span>
                    </p>
                  </div>

                  <div className="sm:text-right space-y-1">
                    <p className="text-xs text-brand-chocolate/40 font-semibold">Grand Total Paid</p>
                    <p className="text-2xl font-sans font-black text-brand-caramel">Rs. {trackedOrder.totalAmount.toLocaleString()}</p>
                    <p className="text-[10px] text-brand-chocolate/60 font-medium">Payment: <strong>{trackedOrder.paymentMethod}</strong></p>
                  </div>
                </div>

                {/* Offline Notice Banner if order is stored in IndexedDB */}
                {trackedOrder.id.startsWith('OFFLINE') && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-600/15 flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <p className="font-bold text-amber-900">
                          Saved in Browser IndexedDB Storage
                        </p>
                        <p className="text-amber-800/80 text-[11px]">
                          Your order details are safe. Our system will auto-transmit as soon as your internet reconnects.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={syncingOfflineId === trackedOrder.id}
                      onClick={() => handleSyncSingleOffline(trackedOrder.id)}
                      className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingOfflineId === trackedOrder.id ? 'animate-spin' : ''}`} />
                      <span>{syncingOfflineId === trackedOrder.id ? 'Syncing...' : 'Sync to Kitchen Now'}</span>
                    </button>
                  </div>
                )}

                {/* PROGRESS VISUAL TIMELINE */}
                {trackedOrder.status !== 'Cancelled' ? (
                  <div className="py-6">
                    <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                      <div className="absolute top-6 left-[12%] right-[12%] h-1.5 bg-brand-cream -z-10 hidden md:block rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-brand-caramel"
                          initial={{ width: "0%" }}
                          animate={{ width: `${Math.max(0, (currentStep - 1) / 3 * 100)}%` }}
                          transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                        />
                      </div>

                      {steps.map((st, sIdx) => {
                        const stepNum = sIdx + 1;
                        const isActive = stepNum <= currentStep;
                        const isCurrent = stepNum === currentStep;
                        const Icon = st.icon;

                        return (
                          <div key={`step-${st.label}-${sIdx}`} className="flex md:flex-col items-center md:text-center gap-4 md:gap-3 relative">
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ 
                                scale: isActive ? (isCurrent ? 1.15 : 1) : 0.95,
                                opacity: 1,
                                backgroundColor: isActive ? 'var(--color-brand-caramel)' : 'var(--color-brand-cream)',
                                borderColor: isActive ? 'var(--color-brand-caramel)' : 'rgba(142, 74, 35, 0.15)',
                                color: isActive ? 'var(--color-brand-sugar)' : 'rgba(61, 34, 19, 0.4)'
                              }}
                              transition={{ type: 'spring', stiffness: 100, damping: 12, delay: sIdx * 0.08 }}
                              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 relative z-10 ${
                                isCurrent ? 'shadow-lg shadow-brand-caramel/25 animate-pulse' : 'shadow-sm'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </motion.div>

                            <div className="space-y-0.5">
                              <h4 className={`text-xs font-bold leading-tight ${isActive ? 'text-brand-caramel' : 'text-brand-chocolate/50'}`}>
                                {st.label}
                              </h4>
                              <p className="text-[10px] text-brand-chocolate/60 max-w-[150px] leading-relaxed">
                                {st.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-100/60 rounded-xl border border-red-200 text-center space-y-1">
                    <h4 className="text-sm font-bold text-red-700">This order has been cancelled</h4>
                    <p className="text-xs text-red-600/80">Please contact our sweet complaints desk via Muffinnscomplain@gmail.com for assistance.</p>
                  </div>
                )}

                {/* Delivery address & items breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-brand-caramel/5">
                  <div className="bg-brand-cream/30 p-4 rounded-xl border border-brand-caramel/5 space-y-4">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-brand-caramel">Customer Delivery Details</h4>
                    <div className="space-y-3 text-xs leading-relaxed">
                      <p className="flex items-center gap-2 font-semibold">
                        <ClipboardCheck className="w-4 h-4 text-brand-caramel" />
                        <span>Recipient: {trackedOrder.customerName}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-brand-caramel" />
                        <span>WhatsApp: {trackedOrder.customerPhone}</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-brand-caramel mt-0.5 shrink-0" />
                        <span>Delivery Address: {trackedOrder.customerAddress}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs uppercase tracking-wider font-bold text-brand-caramel">Bakery Items Summary</h4>
                      <motion.button
                        onClick={() => handleReorderOrder(trackedOrder, `track-top-${trackedOrder.id}`)}
                        animate={
                          animatingBtnKey === `track-top-${trackedOrder.id}`
                            ? {
                                x: [0, -4, 4, -3, 3, -1, 1, 0],
                                scale: [1, 1.08, 0.96, 1.04, 1],
                              }
                            : { x: 0, scale: 1 }
                        }
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        whileTap={{ scale: 0.94 }}
                        className={`text-[11px] font-bold flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-lg transition-all ${
                          animatingBtnKey === `track-top-${trackedOrder.id}`
                            ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400/40 shadow-xs'
                            : 'text-brand-caramel hover:text-brand-chocolate hover:bg-brand-caramel/10'
                        }`}
                      >
                        <motion.div
                          animate={animatingBtnKey === `track-top-${trackedOrder.id}` ? { rotate: 360 } : { rotate: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          {animatingBtnKey === `track-top-${trackedOrder.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                        </motion.div>
                        <span>
                          {animatingBtnKey === `track-top-${trackedOrder.id}` ? 'Re-Added!' : 'Re-Order All'}
                        </span>
                      </motion.button>
                    </div>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto no-scrollbar pr-1">
                      {trackedOrder.items.map((it, idx) => {
                        const isFav = isItemFavorite(it);
                        const itemBtnKey = `track-item-${trackedOrder.id}-${idx}`;
                        const isItemAnimating = animatingBtnKey === itemBtnKey;

                        return (
                          <div key={`tracker-item-${trackedOrder.id}-${it.itemId || 'item'}-${idx}`} className="flex justify-between items-center text-xs p-2.5 bg-brand-cream/20 rounded-lg gap-2">
                            <div className="space-y-0.5 flex-grow">
                              <p className="font-bold text-brand-chocolate">{it.name} x{it.quantity}</p>
                              {it.notes && <p className="text-[10px] text-brand-honey italic">Notes: "{it.notes}"</p>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-semibold text-brand-caramel">Rs. {(it.price * it.quantity).toLocaleString()}</span>
                              <button
                                type="button"
                                onClick={() => toggleFavoriteItem(it)}
                                className={`p-1.5 rounded transition-colors cursor-pointer ${
                                  isFav
                                    ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                                    : 'bg-brand-cream/60 text-brand-chocolate/50 hover:text-rose-500 hover:bg-rose-50'
                                }`}
                                title={isFav ? "Remove from Favorites" : "Save as Favorite"}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                              </button>
                              <motion.button
                                onClick={() => handleReorderItem(it, itemBtnKey)}
                                animate={
                                  isItemAnimating
                                    ? {
                                        x: [0, -3, 3, -2, 2, 0],
                                        scale: [1, 1.15, 0.95, 1.05, 1],
                                      }
                                    : { x: 0, scale: 1 }
                                }
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                whileTap={{ scale: 0.92 }}
                                className={`p-1.5 rounded transition-all cursor-pointer ${
                                  isItemAnimating
                                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-md'
                                    : 'bg-brand-caramel/10 hover:bg-brand-caramel text-brand-caramel hover:text-white'
                                }`}
                                title={`Re-order ${it.name}`}
                              >
                                <motion.div
                                  animate={isItemAnimating ? { rotate: 360 } : { rotate: 0 }}
                                  transition={{ duration: 0.5 }}
                                >
                                  {isItemAnimating ? (
                                    <Check className="w-3.5 h-3.5" />
                                  ) : (
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  )}
                                </motion.div>
                              </motion.button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Interactive footer contact options */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-brand-caramel/5 justify-between items-center">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => generateReceiptPDF(trackedOrder)}
                      className="px-4 py-2 bg-brand-sugar hover:bg-brand-cream border border-brand-caramel/30 text-brand-chocolate text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-caramel" />
                      <span>Download PDF</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-brand-sugar hover:bg-brand-cream border border-brand-caramel/30 text-brand-chocolate text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Print Kitchen & POS Receipt"
                    >
                      <Printer className="w-3.5 h-3.5 text-brand-caramel" />
                      <span>Print Receipt</span>
                    </button>

                    <motion.button
                      onClick={() => handleReorderOrder(trackedOrder, `track-bottom-${trackedOrder.id}`)}
                      animate={
                        animatingBtnKey === `track-bottom-${trackedOrder.id}`
                          ? {
                              x: [0, -4, 4, -3, 3, -1, 1, 0],
                              scale: [1, 1.07, 0.96, 1.03, 1],
                            }
                          : { x: 0, scale: 1 }
                      }
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      whileTap={{ scale: 0.94 }}
                      className={`px-4 py-2 text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer ${
                        animatingBtnKey === `track-bottom-${trackedOrder.id}`
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/40 shadow-lg shadow-emerald-600/30'
                          : 'bg-brand-caramel hover:bg-brand-chocolate text-brand-cream'
                      }`}
                    >
                      <motion.div
                        animate={animatingBtnKey === `track-bottom-${trackedOrder.id}` ? { rotate: 360 } : { rotate: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        {animatingBtnKey === `track-bottom-${trackedOrder.id}` ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                      </motion.div>
                      <span>
                        {animatingBtnKey === `track-bottom-${trackedOrder.id}`
                          ? '✓ Basket Re-Ordered!'
                          : 'Re-Order Entire Basket'}
                      </span>
                    </motion.button>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    <a
                      href={getWhatsAppLink(trackedOrder, '923202587047')}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-1.5 transition-colors"
                      title="Contact Kitchen on WhatsApp: 0320 2587047"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp 0320 2587047</span>
                    </a>
                    <a
                      href={getWhatsAppLink(trackedOrder, '923166126926')}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-1.5 transition-colors"
                      title="Contact Kitchen Helpline: 0316 6126926"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp 0316 6126926</span>
                    </a>
                  </div>
                </div>

              </motion.div>
            )}

            {!trackedOrder && (
              <div className="bg-brand-sugar p-6 rounded-2xl border border-brand-caramel/10 text-brand-chocolate space-y-3 mt-8">
                <h4 className="text-xs uppercase tracking-wider font-bold text-brand-caramel">Where is my Invoice ID?</h4>
                <p className="text-xs text-brand-chocolate/80 leading-relaxed">
                  Your Invoice ID is generated automatically upon checkout (e.g. <strong>MUFF-1234</strong>) and can be used here anytime to track live kitchen baking progress.
                </p>
                <p className="text-xs text-brand-chocolate/80 leading-relaxed">
                  You can also switch to the <strong>Order History & Re-Order</strong> tab above to view all past purchases stored in your browser!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: ORDER HISTORY & RE-ORDER ================= */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header controls & filter */}
            <div className="bg-brand-sugar p-5 rounded-2xl border border-brand-caramel/10 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Search input in history */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-caramel/50" />
                <input
                  type="text"
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  placeholder="Search past orders or items..."
                  className="w-full pl-10 pr-4 py-2 bg-brand-cream/30 border border-brand-caramel/10 text-xs rounded-xl text-brand-chocolate focus:outline-none focus:ring-1 focus:ring-brand-caramel"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {historyOrders.length === 0 && (
                  <button
                    onClick={handleAddSampleOrder}
                    className="px-3.5 py-2 bg-brand-cream text-brand-chocolate hover:bg-brand-caramel/10 border border-brand-caramel/20 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-honey" />
                    <span>Load Demo Order</span>
                  </button>
                )}

                {historyOrders.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 border border-red-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    title="Clear history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear History</span>
                  </button>
                )}
              </div>
            </div>

            {/* Empty state */}
            {filteredHistory.length === 0 && (
              <div className="bg-brand-sugar p-12 rounded-2xl border border-brand-caramel/10 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-brand-cream rounded-full flex items-center justify-center mx-auto text-brand-caramel">
                  <History className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-serif font-bold text-brand-chocolate">No Past Orders Found</h3>
                  <p className="text-xs text-brand-chocolate/60 max-w-sm mx-auto">
                    {historyQuery ? `No orders match "${historyQuery}". Try searching for another item or order ID.` : 'You haven\'t placed any orders in this browser session yet.'}
                  </p>
                </div>
                
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  {onNavigateToMenu && (
                    <button
                      onClick={onNavigateToMenu}
                      className="px-6 py-2.5 bg-brand-caramel text-brand-cream text-xs font-bold rounded-xl shadow hover:bg-brand-chocolate transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Browse Menu & Order Fresh Treats</span>
                    </button>
                  )}
                  <button
                    onClick={handleAddSampleOrder}
                    className="px-5 py-2.5 bg-brand-cream border border-brand-caramel/20 text-brand-chocolate text-xs font-bold rounded-xl hover:bg-brand-caramel/10 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-honey" />
                    <span>Add Sample Past Order</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of past orders */}
            {filteredHistory.length > 0 && (
              <div className="space-y-4">
                {filteredHistory.map((order, orderIdx) => (
                  <motion.div
                    key={`history-order-${order.id}-${orderIdx}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-brand-sugar rounded-2xl border border-brand-caramel/10 p-5 shadow-md hover:shadow-lg transition-all space-y-4 text-brand-chocolate"
                  >
                    {/* Top Row Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-brand-caramel/5 pb-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-serif font-black text-lg text-brand-chocolate">#{order.id}</span>
                        <button
                          onClick={() => handleCopyInvoice(order.id)}
                          className="p-1 text-brand-caramel/50 hover:text-brand-caramel"
                          title="Copy Invoice ID"
                        >
                          {copiedId === order.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={order.status}
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase border ${
                              order.id.startsWith('OFFLINE')
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : getStatusBadgeClass(order.status)
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 shrink-0" />
                            {order.id.startsWith('OFFLINE') ? 'Saved in IndexedDB' : order.status}
                          </motion.span>
                        </AnimatePresence>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-brand-chocolate/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-brand-caramel/70" />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </span>
                        <span>•</span>
                        <span className="font-bold text-brand-caramel text-sm">Rs. {order.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Customer & Address details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-brand-chocolate/75 bg-brand-cream/20 p-3 rounded-xl border border-brand-caramel/5">
                      <p><strong>Customer:</strong> {order.customerName} ({order.customerPhone})</p>
                      <p className="truncate"><strong>Delivery:</strong> {order.customerAddress}</p>
                    </div>

                    {/* Order Items Table / Cards */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-caramel">Items in this order ({order.items.length})</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.items.map((it, idx) => {
                          const mappedCartItem = mapOrderItemToCartItem(it);
                          const isFav = isItemFavorite(it);
                          return (
                            <div 
                              key={`history-item-${order.id}-${it.itemId || 'item'}-${idx}`}
                              className="flex items-center justify-between p-2.5 bg-brand-cream/40 rounded-xl border border-brand-caramel/5 text-xs gap-2"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden pr-1">
                                <img 
                                  src={mappedCartItem.item.image} 
                                  alt={it.name}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-brand-caramel/10"
                                  onError={(e) => {
                                    e.currentTarget.src = '/assets/images/muffinns_three_milk_cake_1784645579407.jpg';
                                  }}
                                />
                                <div className="truncate">
                                  <p className="font-bold text-brand-chocolate truncate">{it.name}</p>
                                  <p className="text-[10px] text-brand-chocolate/60">
                                    Qty: {it.quantity} × Rs. {it.price}
                                    {it.size ? ` (${it.size})` : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => toggleFavoriteItem(it)}
                                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                    isFav
                                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                                      : 'bg-white border-brand-caramel/15 text-brand-chocolate/60 hover:text-rose-600 hover:bg-rose-50'
                                  }`}
                                  title={isFav ? "Remove from Favorites" : "Save as Favorite for quick re-ordering"}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                                  <span className="hidden sm:inline">{isFav ? 'Saved' : 'Fav'}</span>
                                </button>

                                {(() => {
                                  const histItemKey = `hist-item-${order.id}-${idx}`;
                                  const isHistItemAnimating = animatingBtnKey === histItemKey;

                                  return (
                                    <motion.button
                                      onClick={() => handleReorderItem(it, histItemKey)}
                                      animate={
                                        isHistItemAnimating
                                          ? {
                                              x: [0, -3, 3, -2, 2, 0],
                                              scale: [1, 1.12, 0.95, 1.05, 1],
                                            }
                                          : { x: 0, scale: 1 }
                                      }
                                      transition={{ duration: 0.5, ease: "easeInOut" }}
                                      whileTap={{ scale: 0.92 }}
                                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                                        isHistItemAnimating
                                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-md'
                                          : 'bg-brand-caramel/10 hover:bg-brand-caramel text-brand-caramel hover:text-white'
                                      }`}
                                      title={`Add ${it.name} to cart`}
                                    >
                                      <motion.div
                                        animate={isHistItemAnimating ? { rotate: 360 } : { rotate: 0 }}
                                        transition={{ duration: 0.5 }}
                                      >
                                        {isHistItemAnimating ? (
                                          <Check className="w-3 h-3" />
                                        ) : (
                                          <RotateCcw className="w-3 h-3" />
                                        )}
                                      </motion.div>
                                      <span>
                                        {isHistItemAnimating ? 'Added!' : 'Re-Add'}
                                      </span>
                                    </motion.button>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-brand-caramel/5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={() => handleTrackFromHistory(order.id)}
                          className="text-xs font-bold text-brand-chocolate/70 hover:text-brand-caramel flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Search className="w-3.5 h-3.5 text-brand-caramel" />
                          <span>Track Live Status</span>
                        </button>

                        <button
                          onClick={() => generateReceiptPDF(order)}
                          className="px-3.5 py-1.5 bg-brand-cream/80 hover:bg-brand-cream border border-brand-caramel/25 text-brand-chocolate text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-brand-caramel" />
                          <span>PDF Receipt</span>
                        </button>

                        {order.id.startsWith('OFFLINE') && (
                          <button
                            type="button"
                            disabled={syncingOfflineId === order.id}
                            onClick={() => handleSyncSingleOffline(order.id)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncingOfflineId === order.id ? 'animate-spin' : ''}`} />
                            <span>{syncingOfflineId === order.id ? 'Syncing...' : 'Sync to Kitchen'}</span>
                          </button>
                        )}
                      </div>

                      <motion.button
                        onClick={() => handleReorderOrder(order, `hist-order-${order.id}`)}
                        animate={
                          animatingBtnKey === `hist-order-${order.id}`
                            ? {
                                x: [0, -4, 4, -3, 3, -1, 1, 0],
                                scale: [1, 1.07, 0.96, 1.03, 1],
                              }
                            : { x: 0, scale: 1 }
                        }
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        whileTap={{ scale: 0.94 }}
                        className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer sm:ml-auto ${
                          animatingBtnKey === `hist-order-${order.id}`
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/40 shadow-lg shadow-emerald-600/30'
                            : 'bg-brand-caramel hover:bg-brand-chocolate text-brand-cream'
                        }`}
                      >
                        <motion.div
                          animate={animatingBtnKey === `hist-order-${order.id}` ? { rotate: 360 } : { rotate: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          {animatingBtnKey === `hist-order-${order.id}` ? (
                            <Check className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                        </motion.div>
                        <span>
                          {animatingBtnKey === `hist-order-${order.id}`
                            ? `✓ ${order.items.length} Items Re-Added!`
                            : `⚡ Re-Order Entire Basket (${order.items.length} items)`}
                        </span>
                      </motion.button>
                    </div>

                  </motion.div>
                ))}
              </div>
            )}

          </motion.div>
        )}

      </div>

      {/* Hidden Kitchen Receipt for Browser Printing in Tracker */}
      <KitchenReceipt order={trackedOrder} />

      {/* Clear History Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 border border-brand-caramel/20 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-stone-900 dark:text-stone-100"
            >
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <div className="p-2.5 bg-red-100 dark:bg-red-950/60 rounded-full">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">Clear Order History?</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                Are you sure you want to clear all your saved order receipts and tracking history from this browser?
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirmModal(false)}
                  className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAndClearHistory}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Clear History</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
