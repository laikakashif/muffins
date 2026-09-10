import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Minus, Check, ShoppingBag, Phone, MapPin, User, 
  MessageSquare, Sparkles, ShieldCheck, AlertCircle, ArrowRight, ExternalLink 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MenuItem, SizeOption, Order, CartItem } from '../types';
import { saveOrderToFirestore } from '../firebase/config';

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onAddToCart: (cartItem: CartItem) => void;
  onOrderPlaced: (order: Order) => void;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  isOpen,
  onClose,
  item,
  onAddToCart,
  onOrderPlaced
}) => {
  const [selectedSize, setSelectedSize] = useState<SizeOption | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  
  // Customer info form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [city, setCity] = useState('Bahawalpur');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Bank Transfer' | 'JazzCash / EasyPaisa'>('Cash on Delivery');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  // Initialize or reset when item changes
  useEffect(() => {
    if (item) {
      if (item.sizes && item.sizes.length > 0) {
        setSelectedSize(item.sizes[0]);
      } else {
        setSelectedSize(undefined);
      }
      setQuantity(1);
      setNotes('');
      setFormError('');
      setSuccessOrder(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const unitPrice = selectedSize ? selectedSize.price : item.basePrice;
  const totalPrice = unitPrice * quantity;

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(50, prev + delta)));
  };

  const handleDirectAddToCart = () => {
    onAddToCart({
      item,
      selectedSize,
      quantity,
      notes: notes.trim() || undefined
    });
    onClose();
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Strict validation for compulsory fields: Name, Phone, Address, Item, Quantity
    if (!customerName.trim()) {
      setFormError('Please enter your Name (Compulsory).');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setFormError('Please enter a valid Phone Number (Compulsory for delivery coordination).');
      return;
    }
    if (!customerAddress.trim()) {
      setFormError('Please enter your Delivery Address (Compulsory).');
      return;
    }
    if (quantity < 1) {
      setFormError('Quantity must be at least 1.');
      return;
    }

    setIsSubmitting(true);

    const randId = Math.floor(10000 + Math.random() * 90000);
    const orderId = `ORD-${randId}`;
    const nowIso = new Date().toISOString();
    const nowFormatted = new Date().toLocaleString('en-PK', {
      timeZone: 'Asia/Karachi',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const itemTitle = `${item.name}${selectedSize ? ` (${selectedSize.label})` : ''}`;
    const orderItems = [
      {
        itemId: item.id,
        name: itemTitle,
        itemTitle,
        quantity,
        qty: quantity,
        price: unitPrice,
        size: selectedSize?.label || '',
        notes: notes.trim() || '',
        total: totalPrice
      }
    ];

    const newOrder: Order = {
      id: orderId,
      order_id: orderId,
      customerName: customerName.trim(),
      customer_name: customerName.trim(),
      customerPhone: customerPhone.trim(),
      phone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      address: customerAddress.trim(),
      city: city.trim() || 'Bahawalpur',
      items: orderItems,
      totalAmount: totalPrice,
      total_price: totalPrice,
      status: 'New',
      paymentMethod,
      createdAt: nowIso,
      created_at: nowFormatted
    };

    try {
      let savedToFirestore = false;
      let savedToServer = false;

      // 1. SAVE DIRECTLY TO FIRESTORE COLLECTION "orders"
      try {
        await saveOrderToFirestore(newOrder);
        savedToFirestore = true;
      } catch (firestoreErr) {
        console.warn('[QuickOrderModal] Direct Firestore write notice:', firestoreErr);
      }

      // 2. ALSO SUBMIT TO SERVER FOR PERSISTENCE & BROADCAST
      try {
        const resp = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerAddress: customerAddress.trim(),
            city: city.trim() || 'Bahawalpur',
            items: orderItems,
            totalAmount: totalPrice,
            paymentMethod
          })
        });
        if (resp.ok) {
          savedToServer = true;
        }
      } catch (serverErr) {
        console.warn('[QuickOrderModal] Server endpoint notice:', serverErr);
      }

      if (!savedToFirestore && !savedToServer) {
        throw new Error('Order could not be saved to backend or Firestore');
      }

      // 3. TRIGGER CELEBRATION
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSuccessOrder(newOrder);
      onOrderPlaced(newOrder);
    } catch (err: any) {
      console.error('Error placing order:', err);
      setFormError('Could not record order right now. Please try again or WhatsApp us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMsg = successOrder
    ? encodeURIComponent(
        `🧁 *New Muffinns Order #${successOrder.id}*\n` +
        `👤 *Customer:* ${successOrder.customerName}\n` +
        `📞 *Phone:* ${successOrder.customerPhone}\n` +
        `📍 *Address:* ${successOrder.customerAddress}, ${successOrder.city}\n` +
        `📦 *Item:* ${item.name} (${quantity}x)\n` +
        `💰 *Total:* Rs. ${successOrder.totalAmount?.toLocaleString()}\n` +
        `💳 *Payment:* ${successOrder.paymentMethod}\n\n` +
        `Please confirm my bakery order!`
      )
    : '';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-stone-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-amber-200/70 w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* TOP HEADER */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black">
                🧁
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {successOrder ? 'Order Placed Successfully!' : 'Quick Order Checkout'}
                </h3>
                <p className="text-[11px] text-amber-100 font-medium">
                  {successOrder ? 'Sent directly to Muffinns Admin Panel' : 'Instant placement with Live Bakery Dispatch'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* BODY CONTENT */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
            {successOrder ? (
              /* SUCCESS STATE */
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-200">
                    Order ID: #{successOrder.id}
                  </span>
                  <h4 className="text-xl font-black text-stone-900 pt-2">
                    Thank You, {successOrder.customerName}!
                  </h4>
                  <p className="text-xs text-stone-600 max-w-xs mx-auto">
                    Your order has reached our Admin Panel and notified all registered bakery admins.
                  </p>
                </div>

                {/* SUMMARY BOX */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left text-xs space-y-2">
                  <div className="flex justify-between font-bold text-stone-800 pb-2 border-b border-stone-200">
                    <span>{item.name} ({quantity}x)</span>
                    <span className="text-orange-600">Rs. {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="text-stone-600 space-y-1 text-[11px]">
                    <p><strong>Phone:</strong> {successOrder.customerPhone}</p>
                    <p><strong>Address:</strong> {successOrder.customerAddress}, {successOrder.city}</p>
                    <p><strong>Payment:</strong> {successOrder.paymentMethod}</p>
                    <p><strong>Status:</strong> <span className="text-emerald-700 font-bold">New (Awaiting Admin Dispatch)</span></p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="space-y-2 pt-2">
                  <a
                    href={`https://api.whatsapp.com/send?phone=923017778181&text=${whatsappMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition"
                  >
                    <span>💬 Confirm via WhatsApp (0301-7778181)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={onClose}
                    className="w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition"
                  >
                    Continue Browsing Menu
                  </button>
                </div>
              </div>
            ) : (
              /* ORDER FORM STATE */
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                {/* ITEM PREVIEW CARD */}
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover border border-amber-300/60 shadow-xs shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-bold text-stone-900 truncate">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-black text-orange-600 font-mono">
                        Rs. {unitPrice.toLocaleString()} each
                      </span>
                    </div>
                  </div>
                </div>

                {/* SIZES / PORTION SELECTION IF AVAILABLE */}
                {item.sizes && item.sizes.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                      Select Portion / Size:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {item.sizes.map((s, idx) => (
                        <button
                          key={`size-opt-${idx}`}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                            selectedSize?.label === s.label
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          <span>{s.label}</span>
                          <span className="text-[10px] opacity-90">Rs. {s.price.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* QUANTITY AND LIVE TOTAL PRICE */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200">
                  <div>
                    <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                      Quantity
                    </span>
                    <span className="text-xs text-stone-500">How many packs/pieces?</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      className="w-8 h-8 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 flex items-center justify-center font-bold transition cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono font-black text-base text-stone-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      className="w-8 h-8 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 flex items-center justify-center font-bold transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* TOTAL PRICE HIGHLIGHT */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 font-bold text-sm">
                  <span>Total Calculated Price:</span>
                  <span className="text-base font-black text-orange-600 font-mono">
                    Rs. {totalPrice.toLocaleString()}
                  </span>
                </div>

                {/* USER INFORMATION FORM (NAME, PHONE, ADDRESS ARE COMPULSORY) */}
                <div className="space-y-3 pt-1 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      <span>Customer Details</span>
                    </span>
                    <span className="text-[10px] text-amber-800 font-medium">
                      * Marked fields are compulsory
                    </span>
                  </div>

                  {/* CUSTOMER NAME (COMPULSORY) */}
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">
                      Full Name <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Muhammad Ali"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 font-medium"
                    />
                  </div>

                  {/* PHONE NUMBER (COMPULSORY) */}
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">
                      WhatsApp / Mobile Phone <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0301-7778181"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 font-medium"
                    />
                  </div>

                  {/* DELIVERY ADDRESS (COMPULSORY) */}
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">
                      Full Delivery Address <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="House / Flat #, Street, Near Landmark, Sector / Colony"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 font-medium"
                    />
                  </div>

                  {/* CITY (OPTIONAL) & PAYMENT METHOD */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">
                        City / Town (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Bahawalpur"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e: any) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 font-medium"
                      >
                        <option value="Cash on Delivery">Cash on Delivery</option>
                        <option value="Bank Transfer">Bank Transfer / Raast</option>
                        <option value="JazzCash / EasyPaisa">JazzCash / EasyPaisa</option>
                      </select>
                    </div>
                  </div>

                  {/* NOTES / MESSAGE ON CAKE (OPTIONAL) */}
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">
                      Baking Instructions / Message (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Happy Birthday Fatima / Less sweet"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 font-medium"
                    />
                  </div>
                </div>

                {/* ERROR BANNER */}
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* SUBMIT BUTTONS */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <span>Sending Order to Bakers...</span>
                    ) : (
                      <>
                        <span>⚡ Place Order Now • Rs. {totalPrice.toLocaleString()}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDirectAddToCart}
                    className="w-full py-2.5 px-4 rounded-xl border border-amber-300 hover:bg-amber-50 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Or Add to Cart & Keep Shopping</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickOrderModal;
