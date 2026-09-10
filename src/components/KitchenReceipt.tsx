import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, CheckCircle, Sparkles, X } from 'lucide-react';
import { Order } from '../types';

interface KitchenReceiptProps {
  order: Order | null;
  isPrinting?: boolean;
  onClosePrinting?: () => void;
}

export default function KitchenReceipt({ order, isPrinting: externalIsPrinting, onClosePrinting }: KitchenReceiptProps) {
  const lastOrderRef = useRef<Order | null>(null);
  const [internalIsPrinting, setInternalIsPrinting] = useState(false);

  useEffect(() => {
    const handleBeforePrint = () => {
      setInternalIsPrinting(true);
    };

    const handleAfterPrint = () => {
      setTimeout(() => {
        setInternalIsPrinting(false);
        if (onClosePrinting) onClosePrinting();
      }, 1200);
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClosePrinting]);

  const showPrintingOverlay = externalIsPrinting || internalIsPrinting;

  if (order) {
    lastOrderRef.current = order;
  }

  const activeOrder = order || lastOrderRef.current;
  if (!activeOrder) return null;

  const formattedDate = new Date(activeOrder.createdAt).toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <>
      {/* Visual On-Screen Thermal POS Printing Feedback Animation */}
      <AnimatePresence>
        {showPrintingOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 print:hidden"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-amber-500/30 text-stone-100 relative"
            >
              {/* POS Printer Machine Top */}
              <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center animate-pulse border border-amber-500/30">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1.5">
                      <span>POS-80 THERMAL PRINTER</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    </h3>
                    <p className="text-[10px] text-stone-400 font-mono">Feeding thermal receipt paper...</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setInternalIsPrinting(false);
                    if (onClosePrinting) onClosePrinting();
                  }}
                  className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thermal Paper Feed Exit Slot */}
              <div className="h-3 bg-stone-950 shadow-inner flex justify-center items-center relative overflow-hidden">
                <div className="w-3/4 h-1 bg-amber-500/30 rounded-full blur-xs" />
              </div>

              {/* Thermal Receipt Paper Animated Feed-Out Container */}
              <div className="p-4 bg-stone-900 flex justify-center max-h-[70vh] overflow-y-auto no-scrollbar relative">
                <motion.div
                  initial={{ y: -80, opacity: 0.3, scaleY: 0.2 }}
                  animate={{ y: 0, opacity: 1, scaleY: 1 }}
                  transition={{ duration: 0.75, ease: 'easeOut' }}
                  className="w-full bg-stone-50 text-stone-900 p-5 rounded-t-sm shadow-xl font-mono text-xs relative border-t-2 border-stone-300 transform origin-top"
                >
                  {/* Subtle Scanline Effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent animate-pulse pointer-events-none" />

                  {/* Header */}
                  <div className="text-center pb-2 border-b-2 border-dashed border-stone-800 space-y-0.5">
                    <p className="font-black text-sm uppercase tracking-wider text-stone-900">MUFFINNS SWEETS & BAKERS</p>
                    <p className="text-xs font-bold">پتاشے - Artisanal Bakery</p>
                    <p className="text-[9px] text-stone-600">Model Town & Gulberg Branches</p>
                    <div className="mt-1 py-0.5 bg-stone-900 text-stone-100 text-[10px] font-black uppercase tracking-widest">
                      *** KITCHEN POS RECEIPT ***
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="py-2 border-b border-dashed border-stone-800 text-[11px] space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>INVOICE #:</span>
                      <span>{activeOrder.id}</span>
                    </div>
                    <div className="flex justify-between text-stone-700">
                      <span>DATE:</span>
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>STATUS:</span>
                      <span className="text-emerald-700 font-bold">{activeOrder.status.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="py-2 border-b-2 border-dashed border-stone-800 space-y-1">
                    <p className="font-bold text-[9px] uppercase pb-0.5 border-b border-stone-400 flex justify-between text-stone-600">
                      <span>QTY x ITEM</span>
                      <span>PKR</span>
                    </p>
                    {activeOrder.items.map((it, idx) => (
                      <div key={`receipt-anim-${it.itemId || 'item'}-${idx}`} className="flex justify-between text-[11px] font-bold">
                        <span>{it.quantity}x {it.name} {it.size ? `(${it.size})` : ''}</span>
                        <span>{(it.price * it.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="pt-2 pb-1 border-b-2 border-stone-900 font-bold flex justify-between text-xs">
                    <span>TOTAL PAYABLE:</span>
                    <span className="font-black text-sm text-stone-950">Rs. {activeOrder.totalAmount.toLocaleString()}</span>
                  </div>

                  {/* Zigzag Paper Tear Edge Visual */}
                  <div className="absolute -bottom-3 left-0 right-0 h-3 bg-stone-50 [clip-path:polygon(0%_0%,_5%_100%,_10%_0%,_15%_100%,_20%_0%,_25%_100%,_30%_0%,_35%_100%,_40%_0%,_45%_100%,_50%_0%,_55%_100%,_60%_0%,_65%_100%,_70%_0%,_75%_100%,_80%_0%,_85%_100%,_90%_0%,_95%_100%,_100%_0%)]" />
                </motion.div>
              </div>

              {/* Printing Status Footer */}
              <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
                  <CheckCircle className="w-4 h-4 animate-bounce" />
                  <span>Receipt printed successfully!</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInternalIsPrinting(false);
                    if (onClosePrinting) onClosePrinting();
                  }}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Native Kitchen Receipt for Browser Printing */}
      <div 
        id="printable-kitchen-receipt" 
        className="hidden print:block animate-fade-in transition-opacity duration-300"
      >
        <div className="text-center pb-2 border-b-2 border-dashed border-black">
          <h1 className="text-base font-black uppercase tracking-wider">MUFFINNS SWEETS & BAKERS</h1>
          <p className="text-sm font-bold">پتاشے - Artisanal Bakery</p>
          <p className="text-[10px]">Model Town & Gulberg Branches</p>
          <p className="text-[10px] font-mono">UAN / WhatsApp: +92 300 1234567</p>
          <div className="mt-2 py-0.5 bg-black text-white text-xs font-black uppercase tracking-widest">
            *** KITCHEN POS RECEIPT ***
          </div>
        </div>

        {/* Meta Info */}
        <div className="py-2 border-b border-dashed border-black text-xs space-y-1 font-mono">
          <div className="flex justify-between font-bold">
            <span>INVOICE #:</span>
            <span>{activeOrder.id}</span>
          </div>
          <div className="flex justify-between">
            <span>DATE & TIME:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span>STATUS:</span>
            <span className="font-bold">{activeOrder.status.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>PAYMENT MODE:</span>
            <span>{activeOrder.paymentMethod}</span>
          </div>
          {activeOrder.paymentReference && (
            <div className="flex justify-between text-[10px]">
              <span>REF ID:</span>
              <span>{activeOrder.paymentReference}</span>
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="py-2 border-b border-dashed border-black text-xs space-y-1 font-mono">
          <p className="font-bold uppercase text-[10px] underline">CUSTOMER & DELIVERY DETAILS:</p>
          <p><span className="font-bold">NAME:</span> {activeOrder.customerName || 'Valued Guest'}</p>
          <p><span className="font-bold">PHONE:</span> {activeOrder.customerPhone || 'N/A'}</p>
          <p><span className="font-bold">ADDRESS:</span> {activeOrder.customerAddress || 'Store Pickup / On-site'}</p>
        </div>

        {/* Items List */}
        <div className="py-2 border-b-2 border-dashed border-black font-mono">
          <p className="font-bold uppercase text-[10px] pb-1 border-b border-black mb-1 flex justify-between">
            <span>QTY x ITEM / SPECIFICATION</span>
            <span>PRICE (PKR)</span>
          </p>

          <div className="space-y-2">
            {activeOrder.items.map((it, idx) => (
              <div key={`receipt-item-${activeOrder.id || 'order'}-${it.itemId || 'item'}-${idx}`} className="text-xs">
                <div className="flex justify-between font-bold">
                  <span>{it.quantity}x {it.name} {it.size ? `(${it.size})` : ''}</span>
                  <span>{(it.price * it.quantity).toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-gray-700 pl-3">
                  @ Rs. {it.price.toLocaleString()} each
                </div>
                {it.notes && (
                  <div className="text-[10px] italic pl-3 font-semibold">
                    * Note: {it.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="py-2 border-b-2 border-black text-xs font-mono space-y-1">
          <div className="flex justify-between">
            <span>ITEMS TOTAL:</span>
            <span>Rs. {activeOrder.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>DELIVERY / PACKAGING:</span>
            <span>FREE</span>
          </div>
          <div className="flex justify-between font-black text-sm pt-1 border-t border-dashed border-black mt-1">
            <span>TOTAL PAYABLE:</span>
            <span>Rs. {activeOrder.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Footer / Kitchen Instructions */}
        <div className="pt-3 text-center text-[10px] font-mono space-y-1">
          <p className="font-bold">✦ FRESHLY BAKED & CRAFTED WITH PASSION ✦</p>
          <p>Keep refrigerated below 4°C for cakes & desserts.</p>
          <p className="pt-1 text-[9px] text-gray-600">Generated by Muffinns Sweets & Bakers POS System</p>
          <p className="font-bold text-xs pt-1">*** THANK YOU! ***</p>
        </div>
      </div>
    </>
  );
}

