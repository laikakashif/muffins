import React, { useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Trash2, Plus, Minus, X, Copy, Check, Upload, CreditCard, MessageSquare, ShieldAlert, ShieldCheck, Lock, Smartphone, Eye, EyeOff, Shield, Share2, Heart, Sparkles, RotateCcw, WifiOff } from 'lucide-react';
import { CartItem, Order, FavoriteOrderItem, MenuItem } from '../types';
import { getStoredMenuItems } from '../utils/menuStorage';
import QRPaymentModal from './QRPaymentModal';
import SecurePaymentGatewayModal from './SecurePaymentGatewayModal';
import OfflineOrderSavedModal from './OfflineOrderSavedModal';
import { OfflineOrder, saveOfflineOrder, recordSyncedOrderInLocalStorage, offlineOrderToDisplayOrder } from '../utils/offlineOrderDB';
import MuffinnsQRCodeCard from './MuffinnsQRCodeCard';
import AnimatedPrice from './AnimatedPrice';
import { BRANCHES } from '../data/branches';
import { saveOrderToFirestore } from '../firebase/config';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: Order) => void;
  onAddToCart?: (item: CartItem) => void;
  theme?: string;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  onAddToCart,
  theme = 'classic'
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0].id);
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Credit / Debit Card' | 'Mobile Wallet' | 'Bank Transfer'>('Credit / Debit Card');
  
  // Online Card payment states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);

  // Mobile Wallet states
  const [walletProvider, setWalletProvider] = useState<'JazzCash' | 'EasyPaisa' | 'Raast'>('JazzCash');
  const [walletNumber, setWalletNumber] = useState('');

  // Recurring Favorite Items state
  const [favoriteItems, setFavoriteItems] = useState<FavoriteOrderItem[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('muffinns_favorite_items');
        if (saved) {
          setFavoriteItems(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error loading favorite items in CartDrawer:', e);
      }
    }
  }, [isOpen]);

  const handleAddFavoriteToCart = (fav: FavoriteOrderItem) => {
    const currentMenuItems = getStoredMenuItems();
    const matchedMenuItem = currentMenuItems.find(
      m => m.id === fav.itemId || m.name.toLowerCase() === fav.name.toLowerCase().split('(')[0].trim()
    );

    const fallbackMenuItem: MenuItem = {
      id: fav.itemId || `fav-${Date.now()}`,
      name: fav.name.replace(/\s*\([^)]*\)/, ''),
      category: (fav.category as any) || 'Savory Snacks',
      description: 'Saved favorite Muffinns bakery item',
      basePrice: fav.price,
      image: fav.image || 'https://i.ibb.co/KjxwTQQt/Whats-App-Image-2026-08-31-at-4-53-00-PM.jpg'
    };

    const selectedSizeOption = fav.size
      ? matchedMenuItem?.sizes?.find(s => s.label.toLowerCase() === fav.size?.toLowerCase()) || { label: fav.size, price: fav.price }
      : undefined;

    const cartItem: CartItem = {
      item: matchedMenuItem || fallbackMenuItem,
      selectedSize: selectedSizeOption,
      quantity: 1,
      notes: fav.notes
    };

    if (onAddToCart) {
      onAddToCart(cartItem);
    }
  };

  const handleRemoveFavorite = (favId: string) => {
    const updated = favoriteItems.filter(f => f.id !== favId);
    setFavoriteItems(updated);
    localStorage.setItem('muffinns_favorite_items', JSON.stringify(updated));
  };

  // Bank transfer specific states
  const [paymentReference, setPaymentReference] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Track order awaiting QR or Gateway payment verification
  const [createdOrderForQR, setCreatedOrderForQR] = useState<Order | null>(null);
  const [createdOrderForGateway, setCreatedOrderForGateway] = useState<Order | null>(null);
  const [offlineSavedOrder, setOfflineSavedOrder] = useState<OfflineOrder | null>(null);
  const [gatewayDetails, setGatewayDetails] = useState<{
    type: 'card' | 'wallet';
    cardName?: string;
    cardNumberLast4?: string;
    cardBrand?: string;
    walletType?: string;
    walletNumber?: string;
  }>({ type: 'card' });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const triggerConfettiAnimation = () => {
    // 1. Trigger localized canvas confetti inside CartDrawer overlay
    try {
      if (canvasRef.current) {
        const myConfetti = confetti.create(canvasRef.current, {
          resize: true,
          useWorker: true
        });
        myConfetti({
          particleCount: 120,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#D97706', '#F59E0B', '#F43F5E', '#EC4899', '#8B5CF6', '#10B981', '#3B82F6']
        });
      }
    } catch (err) {
      console.warn('Canvas confetti error:', err);
    }

    // 2. Trigger full viewport confetti burst for celebration
    try {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        zIndex: 99999,
        colors: ['#D97706', '#F59E0B', '#F43F5E', '#EC4899', '#8B5CF6', '#10B981', '#3B82F6']
      });

      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          zIndex: 99999,
          colors: ['#F59E0B', '#EC4899', '#8B5CF6', '#10B981']
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          zIndex: 99999,
          colors: ['#F59E0B', '#EC4899', '#8B5CF6', '#10B981']
        });
      }, 200);
    } catch (err) {
      console.warn('Viewport confetti error:', err);
    }
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = item.selectedSize ? item.selectedSize.price : item.item.basePrice;
      return sum + (price * item.quantity);
    }, 0);
  }, [cartItems]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('3398787000005900');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [shareCopied, setShareCopied] = useState(false);

  const handleShareOrder = async (platform?: 'whatsapp' | 'twitter' | 'native' | 'copy') => {
    if (cartItems.length === 0) return;

    const itemsList = cartItems
      .map(i => `• ${i.quantity}x ${i.item.name}${i.selectedSize ? ` (${i.selectedSize.label})` : ''} - Rs. ${((i.selectedSize ? i.selectedSize.price : i.item.basePrice) * i.quantity).toLocaleString()}`)
      .join('\n');

    const shareMessage = `🧁 *My Muffinns Bakery Order Details* 🧁\n\n${itemsList}\n\n💰 *Total Amount:* Rs. ${cartTotal.toLocaleString()}\n\nCheck out these fresh gourmet treats at Muffinns!`;

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank');
      return;
    }

    if (platform === 'twitter') {
      const tweetText = `Check out my delicious sweet order from Muffinns! Total: Rs. ${cartTotal.toLocaleString()} 🧁✨`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
      return;
    }

    if (platform === 'native' || (!platform && typeof navigator !== 'undefined' && 'share' in navigator)) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'My Muffinns Cart Order',
            text: shareMessage,
            url: window.location.href,
          });
          return;
        } catch (e) {
          // User cancelled native share
        }
      }
    }

    // Default fallback to copy to clipboard
    try {
      await navigator.clipboard.writeText(shareMessage);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy share message:', err);
    }
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setProofFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (cartItems.length === 0) {
      setErrorMessage('Your shopping cart is currently empty.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please provide your name and contact phone number.');
      return;
    }

    if (deliveryType === 'delivery' && !customerAddress.trim()) {
      setErrorMessage('Please provide your physical address for home delivery.');
      return;
    }

    if (paymentMethod === 'Credit / Debit Card') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      if (cleanCard.length < 13) {
        setErrorMessage('Please enter a valid 13 to 16 digit debit/credit card number.');
        return;
      }
      if (!cardExpiry.includes('/') || cardExpiry.trim().length < 5) {
        setErrorMessage('Please enter a valid card expiration date (MM/YY).');
        return;
      }
      if (cardCvv.trim().length < 3) {
        setErrorMessage('Please enter a valid 3 or 4 digit CVV security code.');
        return;
      }
    }

    if (paymentMethod === 'Mobile Wallet') {
      if (walletNumber.trim().length < 10) {
        setErrorMessage('Please enter your mobile wallet phone number.');
        return;
      }
    }

    setIsSubmitting(true);

    // Map cart items to backend format
    const itemsPayload = cartItems.map(it => ({
      itemId: it.item.id,
      name: `${it.item.name}${it.selectedSize ? ` (${it.selectedSize.label})` : ''}`,
      quantity: it.quantity,
      size: it.selectedSize?.label || '',
      price: it.selectedSize ? it.selectedSize.price : it.item.basePrice,
      notes: it.notes || ''
    }));

    const cleanCardNum = cardNumber.replace(/\D/g, '');
    const last4 = cleanCardNum.slice(-4) || '8821';
    const brand = cleanCardNum.startsWith('4') ? 'Visa' : cleanCardNum.startsWith('5') ? 'Mastercard' : cleanCardNum.startsWith('62') ? 'UnionPay' : 'Visa';

    let computedRef = undefined;
    if (paymentMethod === 'Bank Transfer') {
      computedRef = paymentReference.trim() || 'Awaiting QR Scan';
    } else if (paymentMethod === 'Credit / Debit Card') {
      computedRef = `256SSL-${brand.toUpperCase()}-${last4}`;
    } else if (paymentMethod === 'Mobile Wallet') {
      computedRef = `PUSH-${walletProvider.toUpperCase()}-${walletNumber.slice(-4) || '9900'}`;
    }

    const selectedBranchObj = BRANCHES.find(b => b.id === selectedBranch);
    const orderPayload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: deliveryType === 'delivery' ? customerAddress.trim() : `Pickup from: ${selectedBranchObj?.name || 'Main Branch'} (${selectedBranchObj?.address.split(',')[0]} - ${selectedBranchObj?.contact})`,
      items: itemsPayload,
      totalAmount: cartTotal,
      paymentMethod,
      paymentReference: computedRef,
    };

    const handleSaveOfflineFallback = async (reason: string) => {
      try {
        const randId = Math.floor(1000 + Math.random() * 9000);
        const offlineId = `OFFLINE-MUFF-${randId}`;
        const offlineOrder: OfflineOrder = {
          id: offlineId,
          orderPayload,
          createdAt: new Date().toISOString(),
          retryCount: 0,
          status: 'pending_sync',
          errorMessage: reason
        };

        await saveOfflineOrder(offlineOrder);
        const displayOrder = offlineOrderToDisplayOrder(offlineOrder);
        recordSyncedOrderInLocalStorage(displayOrder);

        // Reset cart and customer form fields
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setPaymentReference('');
        setCardNumber('');
        setCardName('');
        setCardExpiry('');
        setCardCvv('');
        setWalletNumber('');
        setProofFile(null);
        onClearCart();

        setOfflineSavedOrder(offlineOrder);
      } catch (err: any) {
        console.error('Failed to save order into IndexedDB:', err);
        setErrorMessage('Network is offline and saving to IndexedDB failed. Please check browser storage settings.');
      }
    };

    const buildDirectOrder = (): Order => {
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedId = `MUFF-${randSuffix}`;
      return {
        id: generatedId,
        order_id: generatedId,
        customerName: orderPayload.customerName,
        customer_name: orderPayload.customerName,
        customerPhone: orderPayload.customerPhone,
        phone: orderPayload.customerPhone,
        customerAddress: orderPayload.customerAddress,
        address: orderPayload.customerAddress,
        city: 'Bahawalpur',
        items: orderPayload.items,
        totalAmount: orderPayload.totalAmount,
        total_price: orderPayload.totalAmount,
        status: 'New',
        paymentMethod: orderPayload.paymentMethod,
        paymentReference: orderPayload.paymentReference,
        createdAt: new Date().toISOString(),
        created_at: new Date().toLocaleString()
      };
    };

    const handleDirectFirestorePlacement = async () => {
      const directOrder = buildDirectOrder();
      await saveOrderToFirestore(directOrder);
      recordSyncedOrderInLocalStorage(directOrder);

      if (paymentMethod === 'Bank Transfer') {
        setCreatedOrderForQR(directOrder);
      } else if (paymentMethod === 'Credit / Debit Card' || paymentMethod === 'Mobile Wallet') {
        setGatewayDetails({
          type: paymentMethod === 'Credit / Debit Card' ? 'card' : 'wallet',
          cardName: cardName || customerName,
          cardNumberLast4: last4,
          cardBrand: brand,
          walletType: walletProvider,
          walletNumber: walletNumber || customerPhone,
        });
        setCreatedOrderForGateway(directOrder);
      } else {
        triggerConfettiAnimation();
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setPaymentReference('');
        setCardNumber('');
        setCardName('');
        setCardExpiry('');
        setCardCvv('');
        setWalletNumber('');
        setProofFile(null);
        onClearCart();
        onOrderPlaced(directOrder);
      }
    };

    // If browser is already known to be offline, save immediately to IndexedDB
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await handleSaveOfflineFallback('Device is currently offline');
      setIsSubmitting(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      let response: Response | null = null;
      try {
        response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
          signal: controller.signal
        });
      } catch (fetchErr) {
        // Fetch to local /api failed (e.g. static host like Netlify)
        console.warn('API endpoint fetch not reachable, falling back to direct Firestore:', fetchErr);
      }

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.order) {
            saveOrderToFirestore(data.order).catch(err => console.warn('[Firestore] Sync notice:', err));
          }

          if (paymentMethod === 'Bank Transfer') {
            // Open QR code payment modal for interactive simulated clearance
            setCreatedOrderForQR(data.order);
          } else if (paymentMethod === 'Credit / Debit Card' || paymentMethod === 'Mobile Wallet') {
            // Open 256-bit Secure Online Payment Gateway 3D OTP Verification Modal
            setGatewayDetails({
              type: paymentMethod === 'Credit / Debit Card' ? 'card' : 'wallet',
              cardName: cardName || customerName,
              cardNumberLast4: last4,
              cardBrand: brand,
              walletType: walletProvider,
              walletNumber: walletNumber || customerPhone,
            });
            setCreatedOrderForGateway(data.order);
          } else {
            // Cash on Delivery
            triggerConfettiAnimation();
            setCustomerName('');
            setCustomerPhone('');
            setCustomerAddress('');
            setPaymentReference('');
            setCardNumber('');
            setCardName('');
            setCardExpiry('');
            setCardCvv('');
            setWalletNumber('');
            setProofFile(null);
            onClearCart();
            onOrderPlaced(data.order);
          }
          return;
        } else {
          setErrorMessage(data.error || 'Failed to register your order. Please check the details and try again.');
          return;
        }
      }

      // If /api returned 404/500 or was unreachable, fallback directly to Firestore (Netlify support)
      try {
        await handleDirectFirestorePlacement();
      } catch (directErr) {
        console.warn('Direct Firestore write failed, saving to IndexedDB offline storage:', directErr);
        await handleSaveOfflineFallback('Direct cloud sync unavailable');
      }
    } catch (err: any) {
      // Network fetch error, abort timeout, or server unreachable
      try {
        await handleDirectFirestorePlacement();
      } catch (directErr) {
        console.warn('Network error during order submission. Saving to IndexedDB:', err);
        await handleSaveOfflineFallback(err.name === 'AbortError' ? 'Network connection timed out' : 'Network connection lost');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cart-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-brand-chocolate/50 backdrop-blur-xs z-50 cursor-pointer"
        />
      )}
      {isOpen && (
        <motion.div
          key="cart-drawer-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:max-w-xl bg-brand-sugar shadow-2xl z-50 flex flex-col justify-between border-l border-brand-caramel/10 overflow-hidden"
        >
          {/* Canvas-based Confetti Layer */}
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 w-full h-full z-50"
          />
            {/* Header */}
            <div className="p-5 bg-brand-cream border-b border-brand-caramel/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand-chocolate">
                <ShoppingBag className="w-5 h-5 text-brand-caramel" />
                <h3 className="text-xl font-serif font-bold">Shopping Cart ({cartItems.length})</h3>
              </div>
              <div className="flex items-center gap-2">
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleShareOrder('native')}
                    title="Share Order Details"
                    className="px-2.5 py-1.5 rounded-full bg-brand-caramel/10 hover:bg-brand-caramel text-brand-caramel hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-brand-caramel/10 text-brand-chocolate/60 hover:text-brand-caramel flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-grow overflow-y-auto p-5 space-y-6 no-scrollbar text-brand-chocolate">
              {/* Saved Favorites Quick Re-Order Section */}
              {favoriteItems.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-rose-50/90 via-amber-50/50 to-pink-50/90 rounded-2xl border border-rose-200/50 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      <h4 className="text-xs font-serif font-bold text-brand-chocolate uppercase tracking-wider">
                        Saved Favorites ({favoriteItems.length})
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100/80 px-2.5 py-0.5 rounded-full">
                      1-Click Re-Order
                    </span>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                    {favoriteItems.map((fav) => (
                      <div
                        key={`cart-fav-${fav.id}`}
                        className="min-w-[170px] max-w-[190px] bg-white p-2.5 rounded-xl border border-brand-caramel/10 shadow-xs flex flex-col justify-between space-y-2 shrink-0 relative group"
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(fav.id)}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-600 flex items-center justify-center transition-colors text-[10px] cursor-pointer z-10"
                          title="Remove from saved favorites"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        <div className="flex items-center gap-2 pr-4">
                          <img
                            src={fav.image || 'https://i.ibb.co/KjxwTQQt/Whats-App-Image-2026-08-31-at-4-53-00-PM.jpg'}
                            alt={fav.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 bg-brand-cream border border-brand-caramel/10"
                            onError={(e) => {
                              e.currentTarget.src = '/assets/images/muffinns_three_milk_cake_1784645579407.jpg';
                            }}
                          />
                          <div className="truncate">
                            <p className="font-bold text-xs text-brand-chocolate truncate" title={fav.name}>{fav.name}</p>
                            <p className="text-[10px] text-brand-caramel font-semibold">
                              Rs. {fav.price.toLocaleString()}
                              {fav.size ? ` (${fav.size})` : ''}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddFavoriteToCart(fav)}
                          className="w-full py-1.5 px-2 bg-brand-caramel hover:bg-brand-chocolate text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Quick Re-Order</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cartItems.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <ShoppingBag className="w-16 h-16 text-brand-caramel/20 mx-auto animate-bounce" />
                  <p className="text-sm text-brand-chocolate/60 font-medium">Your bakery basket is empty.</p>
                  <p className="text-xs text-brand-chocolate/40 max-w-xs mx-auto">
                    Browse our gourmet sweet catalog to add fresh breads, rich fudge cakes, or traditional sweets!
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-brand-caramel text-brand-cream font-medium rounded-full text-xs shadow-md hover:bg-brand-chocolate transition-colors cursor-pointer"
                  >
                    Continue Browsing
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Items List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-brand-caramel/10 pb-2">
                      <h4 className="text-xs uppercase tracking-wider font-extrabold text-brand-caramel">Selected Treats ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</h4>
                      <span className="text-[10px] text-brand-chocolate/50 font-bold">✨ Tap + / - to adjust</span>
                    </div>
                    
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {cartItems.map((item, index) => {
                          const price = item.selectedSize ? item.selectedSize.price : item.item.basePrice;
                          return (
                            <motion.div
                              layout
                              key={`cart-item-${item.item.id}-${item.selectedSize?.label || 'base'}-${item.notes || ''}-${index}`}
                              initial={{ opacity: 0, scale: 0.7, y: 24, rotate: index % 2 === 0 ? -1 : 1 }}
                              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                              exit={{ 
                                opacity: 0, 
                                scale: 0.45, 
                                x: 80, 
                                filter: 'blur(4px)',
                                transition: { type: 'spring', stiffness: 550, damping: 26, mass: 0.7 } 
                              }}
                              transition={{ 
                                type: 'spring', 
                                stiffness: 480, 
                                damping: 24, 
                                mass: 0.8,
                                layout: { type: 'spring', stiffness: 450, damping: 30 }
                              }}
                              whileHover={{ scale: 1.015 }}
                              className="flex gap-3.5 p-3 bg-brand-cream/60 rounded-2xl border border-brand-caramel/10 justify-between items-center hover:bg-white hover:border-brand-caramel/25 shadow-xs transition-colors"
                            >
                              <motion.img
                                whileHover={{ scale: 1.1, rotate: 3 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                src={item.item.image}
                                alt={item.item.name}
                                referrerPolicy="no-referrer"
                                className="w-14 h-14 object-cover rounded-xl bg-brand-cream border border-brand-caramel/10 shrink-0 shadow-xs"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (!target.dataset.failed) {
                                    target.dataset.failed = 'true';
                                    target.src = '/assets/images/muffinns_three_milk_cake_1784645579407.jpg';
                                  }
                                }}
                              />
                              <div className="flex-grow space-y-1 min-w-0">
                                <h5 className="font-serif font-bold text-sm leading-tight text-brand-chocolate truncate">{item.item.name}</h5>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {item.selectedSize && (
                                    <span className="text-[10px] bg-brand-marshmallow px-2 py-0.5 rounded-md text-brand-caramel font-bold border border-brand-caramel/10">
                                      {item.selectedSize.label}
                                    </span>
                                  )}
                                  <AnimatedPrice value={price * item.quantity} className="text-xs font-black text-brand-caramel" />
                                </div>
                                {item.notes && (
                                  <p className="text-[10px] text-brand-honey italic font-medium truncate">Notes: "{item.notes}"</p>
                                )}
                              </div>

                              {/* Control Block with Tactile Physics */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1.5 bg-brand-cream/90 px-2 py-1 rounded-xl border border-brand-caramel/15 shadow-2xs">
                                  <motion.button
                                    whileHover={{ scale: 1.25, backgroundColor: 'rgba(142,74,37,0.15)' }}
                                    whileTap={{ scale: 0.75 }}
                                    transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                                    onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                                    className="p-1 rounded-lg text-brand-caramel hover:text-brand-chocolate transition-colors cursor-pointer"
                                    title="Decrease quantity"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </motion.button>
                                  
                                  {/* Bouncy quantity number pop */}
                                  <div className="w-5 text-center flex items-center justify-center overflow-hidden">
                                    <motion.span
                                      key={`qty-badge-${item.quantity}`}
                                      initial={{ scale: 1.6, y: -2, color: '#d97706' }}
                                      animate={{ scale: 1, y: 0, color: 'currentColor' }}
                                      transition={{ type: 'spring', stiffness: 700, damping: 16 }}
                                      className="text-xs font-black"
                                    >
                                      {item.quantity}
                                    </motion.span>
                                  </div>

                                  <motion.button
                                    whileHover={{ scale: 1.25, backgroundColor: 'rgba(142,74,37,0.15)' }}
                                    whileTap={{ scale: 0.75 }}
                                    transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                                    className="p-1 rounded-lg text-brand-caramel hover:text-brand-chocolate transition-colors cursor-pointer"
                                    title="Increase quantity"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </motion.button>
                                </div>

                                <motion.button
                                  whileHover={{ scale: 1.3, rotate: -12 }}
                                  whileTap={{ scale: 0.75, rotate: 15 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                  onClick={() => onRemoveItem(index)}
                                  className="p-1.5 rounded-xl text-red-500/70 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Remove treat from cart"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Social Media Sharing Banner */}
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-pink-50/60 rounded-2xl border border-brand-caramel/15 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-brand-chocolate font-bold">
                        <Share2 className="w-4 h-4 text-brand-caramel" />
                        <span>Share Order Details</span>
                      </div>
                      <span className="text-[10px] text-brand-chocolate/50 font-medium">Send cart to social media</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleShareOrder('whatsapp')}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <span>💬 WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareOrder('twitter')}
                        className="flex-1 py-1.5 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <span>🐦 Twitter / X</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareOrder('copy')}
                        className="py-1.5 px-3 bg-white hover:bg-brand-cream border border-brand-caramel/20 text-brand-chocolate rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        {shareCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-brand-caramel" />
                            <span>Copy List</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Summary & Form */}
                  <form onSubmit={handleSubmitOrder} className="space-y-6">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-brand-caramel border-b border-brand-caramel/5 pb-2">Delivery & Customer Details</h4>
                    
                    <div className="space-y-4">
                      {/* Name input */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-brand-chocolate/80">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Enter your beautiful name"
                          className="w-full px-4 py-2.5 bg-brand-cream border border-brand-caramel/10 focus:outline-none focus:ring-1 focus:ring-brand-caramel text-sm rounded-xl"
                        />
                      </div>

                      {/* Phone input */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-brand-chocolate/80">WhatsApp / Contact Phone *</label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="e.g. +92 300 1234567"
                          className="w-full px-4 py-2.5 bg-brand-cream border border-brand-caramel/10 focus:outline-none focus:ring-1 focus:ring-brand-caramel text-sm rounded-xl"
                        />
                      </div>

                      {/* Delivery type toggles */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setDeliveryType('delivery')}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            deliveryType === 'delivery'
                              ? 'bg-brand-caramel/15 border-brand-caramel text-brand-caramel'
                              : 'bg-brand-cream/60 border-brand-caramel/5 text-brand-chocolate/60 hover:bg-brand-cream'
                          }`}
                        >
                          <span>🛵 Home Delivery</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryType('pickup')}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            deliveryType === 'pickup'
                              ? 'bg-brand-caramel/15 border-brand-caramel text-brand-caramel'
                              : 'bg-brand-cream/60 border-brand-caramel/5 text-brand-chocolate/60 hover:bg-brand-cream'
                          }`}
                        >
                          <span>🏪 Takeaway Pickup</span>
                        </button>
                      </div>

                      {/* Address input */}
                      {deliveryType === 'delivery' && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-brand-chocolate/80">Complete Home Address *</label>
                          <textarea
                            required
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            placeholder="Street address, house number, town/sector, city"
                            rows={2}
                            className="w-full px-4 py-2.5 bg-brand-cream border border-brand-caramel/10 focus:outline-none focus:ring-1 focus:ring-brand-caramel text-sm rounded-xl"
                          />
                        </div>
                      )}

                      {deliveryType === 'pickup' && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-brand-chocolate/80">Select Pickup Branch *</label>
                          <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="w-full px-4 py-3 bg-brand-cream border border-brand-caramel/10 focus:outline-none focus:ring-1 focus:ring-brand-caramel text-xs rounded-xl text-brand-chocolate font-medium"
                          >
                            {BRANCHES.map((branch, bIdx) => (
                              <option key={`drawer-branch-${branch.id}-${bIdx}`} value={branch.id}>
                                {branch.name} — {branch.address.split(',')[0]} ({branch.contact})
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-brand-caramel font-semibold px-1">
                            ℹ️ You can pick up your order directly from the selected branch once prepared!
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Payment methods */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between border-b border-brand-caramel/10 pb-2">
                        <h4 className="text-xs uppercase tracking-wider font-bold text-brand-caramel">Secure Payment Method</h4>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit Encrypted
                        </span>
                      </div>
                      
                      {/* Grid of 4 Payment Options */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('Credit / Debit Card')}
                          className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            paymentMethod === 'Credit / Debit Card'
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm'
                              : 'bg-brand-cream/60 border-brand-caramel/10 text-brand-chocolate/70 hover:bg-brand-cream'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4 text-indigo-600" />
                            <span>Card Online</span>
                          </div>
                          <span className="text-[9px] text-indigo-600/80 font-medium">Visa / Mastercard / UnionPay</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('Mobile Wallet')}
                          className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            paymentMethod === 'Mobile Wallet'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                              : 'bg-brand-cream/60 border-brand-caramel/10 text-brand-chocolate/70 hover:bg-brand-cream'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <Smartphone className="w-4 h-4 text-emerald-600" />
                            <span>Mobile Wallet</span>
                          </div>
                          <span className="text-[9px] text-emerald-600/80 font-medium">JazzCash / EasyPaisa / Raast</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('Bank Transfer')}
                          className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            paymentMethod === 'Bank Transfer'
                              ? 'bg-brand-caramel/15 border-brand-caramel text-brand-caramel shadow-sm'
                              : 'bg-brand-cream/60 border-brand-caramel/10 text-brand-chocolate/70 hover:bg-brand-cream'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span>🏦 Direct Bank QR</span>
                          </div>
                          <span className="text-[9px] text-brand-chocolate/50 font-medium">Faysal Bank Instant</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('Cash on Delivery')}
                          className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            paymentMethod === 'Cash on Delivery'
                              ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                              : 'bg-brand-cream/60 border-brand-caramel/10 text-brand-chocolate/70 hover:bg-brand-cream'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span>💵 Cash on Delivery</span>
                          </div>
                          <span className="text-[9px] text-brand-chocolate/50 font-medium">Pay at doorstep</span>
                        </button>
                      </div>

                      {/* ================= OPTION 1: ONLINE CREDIT / DEBIT CARD ================= */}
                      {paymentMethod === 'Credit / Debit Card' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-indigo-600" />
                              256-Bit Online Card Processing
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                              <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">Visa</span>
                              <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">Mastercard</span>
                              <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">UnionPay</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-indigo-950">Cardholder Name *</label>
                            <input
                              type="text"
                              required
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              placeholder="Name on card"
                              className="w-full px-3.5 py-2 bg-white border border-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs rounded-xl text-brand-chocolate font-medium"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-indigo-950">Card Number *</label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                maxLength={19}
                                value={cardNumber}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, '');
                                  const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                                  setCardNumber(formatted);
                                }}
                                placeholder="4532 •••• •••• 8821"
                                className="w-full px-3.5 py-2 pr-16 bg-white border border-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold rounded-xl text-brand-chocolate"
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                                {cardNumber.startsWith('4') ? 'VISA' : cardNumber.startsWith('5') ? 'MC' : cardNumber.startsWith('62') ? 'UNIONPAY' : 'CARD'}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-indigo-950">Expiry Date *</label>
                              <input
                                type="text"
                                required
                                maxLength={5}
                                value={cardExpiry}
                                onChange={(e) => {
                                  let val = e.target.value.replace(/\D/g, '');
                                  if (val.length >= 3) {
                                    val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                                  }
                                  setCardExpiry(val);
                                }}
                                placeholder="MM/YY"
                                className="w-full px-3.5 py-2 bg-white border border-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono text-center font-bold rounded-xl text-brand-chocolate"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-indigo-950">CVV / CVC *</label>
                              <div className="relative">
                                <input
                                  type={showCvv ? "text" : "password"}
                                  required
                                  maxLength={4}
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                  placeholder="•••"
                                  className="w-full px-3.5 py-2 pr-8 bg-white border border-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono text-center font-bold rounded-xl text-brand-chocolate"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCvv(!showCvv)}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600"
                                >
                                  {showCvv ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1 text-[10px] text-indigo-900/70">
                            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Your transaction is encrypted with 256-bit bank-level SSL security.</span>
                          </div>
                        </motion.div>
                      )}

                      {/* ================= OPTION 2: MOBILE WALLET ================= */}
                      {paymentMethod === 'Mobile Wallet' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-3.5"
                        >
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-emerald-950">Select Mobile Wallet Provider *</label>
                            <div className="grid grid-cols-3 gap-2">
                              {(['JazzCash', 'EasyPaisa', 'Raast'] as const).map((prov, pIdx) => (
                                <button
                                  key={`prov-${prov}-${pIdx}`}
                                  type="button"
                                  onClick={() => setWalletProvider(prov)}
                                  className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition-all ${
                                    walletProvider === prov
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                      : 'bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-50'
                                  }`}
                                >
                                  {prov}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-emerald-950">{walletProvider} Account Mobile Number *</label>
                            <input
                              type="tel"
                              required
                              value={walletNumber}
                              onChange={(e) => setWalletNumber(e.target.value)}
                              placeholder="e.g. 0300 1234567"
                              className="w-full px-3.5 py-2 bg-white border border-emerald-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-mono font-bold rounded-xl text-brand-chocolate"
                            />
                          </div>

                          <div className="p-2.5 bg-emerald-100/60 rounded-xl text-[11px] text-emerald-900 leading-relaxed font-medium">
                            📲 Upon clicking checkout, an instant payment approval push notification will be sent to your {walletProvider} mobile app. Enter your MPIN to authorize.
                          </div>
                        </motion.div>
                      )}

                      {/* ================= OPTION 3: DIRECT BANK QR ================= */}
                      {paymentMethod === 'Bank Transfer' && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          {/* Replicated Yellow Payment Card with Live Scannable QRCodeSVG */}
                          <MuffinnsQRCodeCard accountNumber="3398787000005900" amount={cartTotal} compact={true} />

                          {/* Reference input field */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-brand-chocolate/80">Payment Transaction Ref ID *</label>
                            <input
                              type="text"
                              required
                              value={paymentReference}
                              onChange={(e) => setPaymentReference(e.target.value)}
                              placeholder="e.g. TRX-938210 or sender account name"
                              className="w-full px-4 py-2.5 bg-brand-cream border border-brand-caramel/10 focus:outline-none focus:ring-1 focus:ring-brand-caramel text-sm rounded-xl"
                            />
                          </div>

                          {/* Drag & Drop receipt upload box */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-brand-chocolate/80">Proof Receipt Screenshot (Optional)</label>
                            <div
                              onDragEnter={handleDrag}
                              onDragLeave={handleDrag}
                              onDragOver={handleDrag}
                              onDrop={handleDrop}
                              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                                dragActive
                                  ? 'border-brand-caramel bg-brand-caramel/5'
                                  : 'border-brand-caramel/20 bg-brand-cream/30 hover:bg-brand-cream/60'
                              }`}
                            >
                              <input
                                type="file"
                                id="receipt-upload"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                              <label htmlFor="receipt-upload" className="cursor-pointer block space-y-2">
                                <Upload className="w-6 h-6 text-brand-caramel/60 mx-auto animate-pulse" />
                                {proofFile ? (
                                  <p className="text-xs font-bold text-emerald-600 line-clamp-1">✅ {proofFile.name}</p>
                                ) : (
                                  <>
                                    <p className="text-xs font-bold text-brand-chocolate">Drag & Drop Receipt screenshot</p>
                                    <p className="text-[10px] text-brand-chocolate/50 font-medium">Or click to browse files</p>
                                  </>
                                )}
                              </label>
                            </div>
                          </div>

                          {/* Safe payment disclaimer */}
                          <div className="flex gap-2 p-2.5 bg-brand-marshmallow rounded-xl border border-brand-caramel/10 text-[11px] text-brand-chocolate/80 leading-relaxed">
                            <ShieldAlert className="w-5 h-5 text-brand-honey shrink-0 mt-0.5" />
                            <p>
                              Please transfer the exact amount of <strong><AnimatedPrice value={cartTotal} className="font-extrabold text-brand-caramel" /></strong> to our Faysal Bank account shown above, and provide the transaction reference so our team can approve your order immediately.
                            </p>
                          </div>

                        </motion.div>
                      )}
                    </div>

                    {/* Error display */}
                    {errorMessage && (
                      <div className="p-3 bg-red-100 text-red-700 text-xs rounded-xl font-medium">
                        ⚠️ {errorMessage}
                      </div>
                    )}
                  </form>
                </>
              )}
            </div>

            {/* Sticky Bottom Summary Bar */}
            {cartItems.length > 0 && (
              <div className="p-5 bg-brand-cream border-t border-brand-caramel/10 space-y-4">
                <div className="flex justify-between items-center text-brand-chocolate">
                  <div className="flex flex-col">
                    <span className="text-xs text-brand-chocolate/60">Cart Subtotal</span>
                    <span className="text-xs text-brand-chocolate/40 font-semibold uppercase">Inclusive of taxes</span>
                  </div>
                  <AnimatedPrice value={cartTotal} className="text-2xl font-serif font-black text-brand-caramel" showDirectionBadge={true} />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 text-brand-chocolate hover:text-brand-caramel font-semibold text-xs rounded-xl transition-all border border-brand-caramel/10 text-center"
                  >
                    Keep Browsing
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitOrder}
                    className="flex-1 py-3 bg-brand-caramel hover:bg-brand-chocolate text-brand-cream font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting Order...' : 'Submit Sweet Order'}</span>
                  </button>
                </div>
              </div>
            )}

          </motion.div>
      )}

      {/* QR Code Instant Payment Simulation Modal overlay */}
      <QRPaymentModal
        key="qr-payment-modal"
        isOpen={createdOrderForQR !== null}
        onClose={() => setCreatedOrderForQR(null)}
        order={createdOrderForQR}
        theme={theme}
        onPaymentSuccess={(updatedOrder) => {
          triggerConfettiAnimation();
          // Clear input fields on successful QR verification
          setCustomerName('');
          setCustomerPhone('');
          setCustomerAddress('');
          setPaymentReference('');
          setCardNumber('');
          setCardName('');
          setCardExpiry('');
          setCardCvv('');
          setWalletNumber('');
          setProofFile(null);
          onClearCart();
          onOrderPlaced(updatedOrder);
          setCreatedOrderForQR(null);
          onClose();
        }}
      />

      {/* 256-Bit Online Payment Gateway (3D Secure / OTP) Modal */}
      <SecurePaymentGatewayModal
        key="secure-payment-gateway-modal"
        isOpen={createdOrderForGateway !== null}
        onClose={() => setCreatedOrderForGateway(null)}
        order={createdOrderForGateway}
        paymentDetails={gatewayDetails}
        theme={theme}
        onPaymentSuccess={(updatedOrder) => {
          triggerConfettiAnimation();
          setCustomerName('');
          setCustomerPhone('');
          setCustomerAddress('');
          setPaymentReference('');
          setCardNumber('');
          setCardName('');
          setCardExpiry('');
          setCardCvv('');
          setWalletNumber('');
          setProofFile(null);
          onClearCart();
          onOrderPlaced(updatedOrder);
          setCreatedOrderForGateway(null);
          onClose();
        }}
      />

      {/* Offline Order Saved to IndexedDB Modal */}
      <OfflineOrderSavedModal
        isOpen={offlineSavedOrder !== null}
        offlineOrder={offlineSavedOrder}
        onClose={() => {
          setOfflineSavedOrder(null);
          onClose();
        }}
        onOrderSyncedSuccess={(syncedOrder) => {
          triggerConfettiAnimation();
          onOrderPlaced(syncedOrder);
          setOfflineSavedOrder(null);
          onClose();
        }}
      />
    </AnimatePresence>
  );
}
