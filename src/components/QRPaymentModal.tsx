import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, ShieldCheck, CheckCircle2, Loader2, Sparkles, AlertCircle, X, CreditCard, Clock, Smartphone, Landmark, Copy, Check } from 'lucide-react';
import { Order } from '../types';
import MuffinnsQRCodeCard from './MuffinnsQRCodeCard';

interface QRPaymentModalProps {
  key?: React.Key;
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onPaymentSuccess: (updatedOrder: Order) => void;
  theme?: string;
}

type Step = 'initializing' | 'waiting_scan' | 'processing_payment' | 'decrypting' | 'success' | 'failed';

export default function QRPaymentModal({
  isOpen,
  onClose,
  order,
  onPaymentSuccess,
  theme = 'classic'
}: QRPaymentModalProps) {
  const [step, setStep] = useState<Step>('initializing');
  const [viewMode, setViewMode] = useState<'poster' | 'vector'>('poster');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('3398787000005900');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-advance from initializing to waiting_scan
  useEffect(() => {
    if (!isOpen || !order) return;
    setStep('initializing');
    setErrorMessage('');
    setTimeLeft(300);

    const timer = setTimeout(() => {
      setStep('waiting_scan');
    }, 1800);

    return () => clearTimeout(timer);
  }, [isOpen, order]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || step === 'success' || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStep('failed');
          setErrorMessage('Payment window expired. Please try checked out again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, step, timeLeft]);

  if (!isOpen || !order) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Triggers the simulated payment validation flow
  const handleSimulatePaymentApproval = async () => {
    if (step !== 'waiting_scan') return;
    
    setStep('processing_payment');
    
    // Step 1: Simulated processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setStep('decrypting');

    // Step 2: Decrypting transfer payload
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      // Step 3: Hit simulated full-stack payment validation endpoint
      const simulatedRef = `FBL-QR-${Math.floor(100000 + Math.random() * 900000)}`;
      const response = await fetch(`/api/orders/${order.id}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: simulatedRef })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTransactionRef(simulatedRef);
        setStep('success');
        // Notify parent application after another small delay for celebration
        setTimeout(() => {
          onPaymentSuccess(data.order);
        }, 3000);
      } else {
        setStep('failed');
        setErrorMessage(data.error || 'Failed to authorize transaction with Faysal Bank.');
      }
    } catch (err) {
      setStep('failed');
      setErrorMessage('Network timeout during bank handshakes.');
    }
  };

  return (
    <AnimatePresence>
      <div key="qr-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          key="qr-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step === 'success' || step === 'processing_payment' || step === 'decrypting' ? undefined : onClose}
          className="fixed inset-0 bg-brand-chocolate/75 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          key="qr-modal-panel"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="relative w-full max-w-md bg-brand-sugar rounded-3xl border-4 border-brand-caramel/25 shadow-2xl p-6 overflow-hidden text-brand-chocolate z-10"
        >
          {/* Top header corner branding details */}
          <div className="flex items-center justify-between border-b border-brand-caramel/10 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-brand-caramel" />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-honey block leading-none">Instant Checkout</span>
                <h4 className="font-serif font-black text-sm text-brand-chocolate">Faysal Bank Direct QR</h4>
              </div>
            </div>
            
            {/* Always-accessible prominent Close (X) button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition-colors cursor-pointer border border-red-200 shadow-xs"
              title="Close QR Code Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic state UI renderer */}
          <div className="space-y-6 flex flex-col items-center text-center">

            {/* INITIALIZING PHASE */}
            {step === 'initializing' && (
              <div className="py-12 space-y-4">
                <Loader2 className="w-12 h-12 text-brand-caramel animate-spin mx-auto" />
                <div>
                  <p className="text-sm font-bold">Connecting to Faysal Bank Gateway...</p>
                  <p className="text-xs text-brand-chocolate/40 mt-1">Generating unique encrypted transaction payload</p>
                </div>
              </div>
            )}

            {/* WAITING SCAN STATE */}
            {step === 'waiting_scan' && (
              <>
                {/* QR Code Container */}
                <div className="relative w-full">
                  {/* Glowing border ring */}
                  <div className="absolute inset-[-12px] bg-gradient-to-tr from-brand-caramel via-brand-honey to-yellow-400 rounded-3xl opacity-20 blur-sm animate-pulse" />
                  
                  {/* Replicated Yellow Payment Card with Live Scannable QRCodeSVG & Cross Button */}
                  <MuffinnsQRCodeCard accountNumber="3398787000005900" amount={order.totalAmount} onClose={onClose} />
                </div>

                {/* Sub-details & scan prompt */}
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold font-mono">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>Expires in {formatTime(timeLeft)}</span>
                  </span>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-brand-chocolate/95">Scan using any EasyPaisa, JazzCash, or Banking App</p>
                    <p className="text-xs text-brand-chocolate/40 font-medium">Instantly debits the order value from your wallet</p>
                  </div>
                </div>

                {/* Order Summary & Billing */}
                <div className="w-full bg-brand-cream/60 rounded-2xl p-4 border border-brand-caramel/10 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-chocolate/50 font-bold uppercase">Order Reference</span>
                    <span className="font-mono font-bold text-brand-chocolate bg-brand-marshmallow px-2 py-0.5 rounded text-[11px]">{order.id}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-chocolate/50 font-bold uppercase">Customer Name</span>
                    <span className="font-medium text-brand-chocolate">{order.customerName}</span>
                  </div>
                  <div className="border-t border-brand-caramel/5 pt-2.5 flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-chocolate/60">Total Bill Amount</span>
                    <span className="text-lg font-serif font-black text-brand-caramel">Rs. {order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Simulated Payment Verification Triggers */}
                <div className="w-full space-y-2.5 pt-2">
                  <button
                    onClick={handleSimulatePaymentApproval}
                    className="w-full py-3 bg-brand-caramel hover:bg-brand-chocolate text-brand-cream font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Simulate Mobile App Scan & Pay</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close / Cancel QR Payment</span>
                  </button>
                  <p className="text-[10px] text-brand-chocolate/40 font-medium">
                    ⚡ Clicking simulates the customer scanning the QR code, authorizing the pin, and sending a real bank webhook.
                  </p>
                </div>
              </>
            )}

            {/* PROCESSING PAYMENT STREAM */}
            {step === 'processing_payment' && (
              <div className="py-12 space-y-5 w-full">
                <div className="relative w-16 h-16 mx-auto">
                  <Loader2 className="w-16 h-16 text-brand-honey animate-spin" />
                  <Smartphone className="w-6 h-6 text-brand-caramel absolute inset-0 m-auto animate-bounce" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-brand-chocolate">Authorizing Transaction with Faysal Bank...</p>
                  <p className="text-xs text-brand-chocolate/40 font-medium">Verifying standard 2-way handshake security clearance</p>
                </div>
                {/* Visual Fake Progress pipeline */}
                <div className="w-48 mx-auto h-1.5 bg-brand-cream rounded-full overflow-hidden relative border border-brand-caramel/5">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-y-0 w-1/2 bg-brand-honey rounded-full"
                  />
                </div>
              </div>
            )}

            {/* DECRYPTING BLOCK */}
            {step === 'decrypting' && (
              <div className="py-12 space-y-5 w-full">
                <div className="relative w-16 h-16 mx-auto">
                  <Loader2 className="w-16 h-16 text-brand-caramel animate-spin" />
                  <QrCode className="w-6 h-6 text-brand-honey absolute inset-0 m-auto" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-brand-chocolate">Verifying Cryptographic Ledger Record...</p>
                  <p className="text-xs text-brand-chocolate/40 font-medium">Depositing Rs. {order.totalAmount.toLocaleString()} to Muffinns Sweets Account</p>
                </div>
              </div>
            )}

            {/* SUCCESS STATE */}
            {step === 'success' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-6 space-y-6 w-full text-center"
              >
                {/* Success animation elements */}
                <div className="relative w-20 h-20 mx-auto">
                  {/* Outer waves */}
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-emerald-100 rounded-full"
                  />
                  <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg relative border-4 border-white">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <Sparkles className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-serif font-black text-emerald-600">Payment Successfully Verified!</h3>
                  <p className="text-xs text-brand-chocolate/55">Order ID <strong className="text-brand-chocolate">{order.id}</strong> is now locked & authorized</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-left space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-800/60 font-bold uppercase">Transaction Ref ID</span>
                    <span className="font-mono font-bold text-emerald-800">{transactionRef}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-800/60 font-bold uppercase">Status Response</span>
                    <span className="font-bold text-emerald-600 uppercase tracking-wider text-[10px] bg-emerald-100 px-2 py-0.5 rounded">Credit Cleared</span>
                  </div>
                  <div className="border-t border-emerald-100/60 pt-2.5 text-center">
                    <p className="text-[11px] text-emerald-700/80 font-medium">
                      🧁 The kitchen has been auto-notified! They are beginning preparation on your pastries right now.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-brand-chocolate/40 animate-pulse font-medium">
                  Redirecting you to active tracking screen...
                </p>
              </motion.div>
            )}

            {/* FAILED STATE */}
            {step === 'failed' && (
              <div className="py-8 space-y-5 w-full text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto border-2 border-red-200">
                  <AlertCircle className="w-8 h-8 text-red-600 animate-bounce" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-md font-bold text-red-600">Payment Verification Failed</p>
                  <p className="text-xs text-brand-chocolate/60 max-w-xs mx-auto leading-relaxed">{errorMessage}</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setStep('waiting_scan')}
                    className="flex-1 py-2.5 bg-brand-caramel hover:bg-brand-chocolate text-brand-cream font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                  >
                    Try QR Scan Again
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 bg-brand-cream border border-brand-caramel/10 text-brand-chocolate hover:text-brand-caramel font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Choose Cash on Delivery
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Secure Trust Stamp */}
          <div className="mt-6 border-t border-brand-caramel/5 pt-3.5 flex items-center justify-center gap-1.5 text-[10px] text-brand-chocolate/30 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-500/60" />
            <span>Encrypted payment processed safely by Faysal Bank Islamic Gateway</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
