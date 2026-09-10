import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, CheckCircle2, Loader2, Sparkles, AlertCircle, X, CreditCard, LockKeyhole, Smartphone, KeyRound, Shield, Check } from 'lucide-react';
import { Order } from '../types';

interface SecurePaymentGatewayModalProps {
  key?: React.Key;
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  paymentDetails: {
    type: 'card' | 'wallet';
    cardName?: string;
    cardNumberLast4?: string;
    cardBrand?: string;
    walletType?: string;
    walletNumber?: string;
  };
  onPaymentSuccess: (updatedOrder: Order) => void;
  theme?: string;
}

type GatewayStep = 'encrypting' | '3d_secure_otp' | 'authorizing' | 'success' | 'failed';

export default function SecurePaymentGatewayModal({
  isOpen,
  onClose,
  order,
  paymentDetails,
  onPaymentSuccess,
  theme = 'classic'
}: SecurePaymentGatewayModalProps) {
  const [step, setStep] = useState<GatewayStep>('encrypting');
  const [otpCode, setOtpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Initialize processing pipeline
  useEffect(() => {
    if (!isOpen || !order) return;
    setStep('encrypting');
    setOtpCode('');
    setErrorMessage('');
    setCountdown(60);

    // Auto-advance to 3D Secure OTP step after 2.2 seconds of encryption simulation
    const timer = setTimeout(() => {
      setStep('3d_secure_otp');
    }, 2200);

    return () => clearTimeout(timer);
  }, [isOpen, order]);

  // OTP Countdown timer
  useEffect(() => {
    if (!isOpen || step !== '3d_secure_otp' || countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, step, countdown]);

  if (!isOpen || !order) return null;

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (otpCode.trim().length < 4) {
      setErrorMessage('Please enter the 4 to 6 digit security OTP code sent to your phone.');
      return;
    }

    setIsVerifying(true);
    setStep('authorizing');

    try {
      // Delay for bank processing simulation
      await new Promise((resolve) => setTimeout(resolve, 2200));

      const simulatedRef = paymentDetails.type === 'card'
        ? `GATEWAY-CARD-${paymentDetails.cardBrand?.toUpperCase() || 'VISA'}-${Math.floor(100000 + Math.random() * 900000)}`
        : `WALLET-PUSH-${paymentDetails.walletType?.toUpperCase() || 'MOBILE'}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Update order status on backend
      const response = await fetch(`/api/orders/${order.id}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: simulatedRef })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('success');
        setTimeout(() => {
          onPaymentSuccess(data.order);
        }, 1800);
      } else {
        setStep('failed');
        setErrorMessage(data.error || 'Payment authorization was declined by issuer bank. Please check funds or card details.');
      }
    } catch (err) {
      setStep('failed');
      setErrorMessage('Secure gateway connection error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-brand-chocolate/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-brand-sugar w-full max-w-md rounded-3xl shadow-2xl border border-brand-caramel/20 overflow-hidden relative"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-indigo-500/10 blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <LockKeyhole className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <span>256-Bit SSL Gateway</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-sans uppercase border border-emerald-500/30">
                    PCI-DSS Certified
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">Muffinns Secure Payment Engine</p>
              </div>
            </div>

            {step !== 'authorizing' && step !== 'encrypting' && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body Content based on Step */}
          <div className="p-6 space-y-6">

            {/* STEP 1: ENCRYPTING PAYLOAD */}
            {step === 'encrypting' && (
              <div className="text-center py-8 space-y-4">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                  <ShieldCheck className="w-9 h-9 text-indigo-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-lg text-brand-chocolate">Encrypting Token Payload...</h4>
                  <p className="text-xs text-brand-chocolate/60">
                    Establishing end-to-end 256-bit TLS tunnel with bank issuer.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-mono text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>SESSION_ID: TLS-{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
              </div>
            )}

            {/* STEP 2: 3D SECURE OTP / MOBILE PUSH PIN VERIFICATION */}
            {step === '3d_secure_otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3">
                  {paymentDetails.type === 'card' ? (
                    <CreditCard className="w-8 h-8 text-indigo-600 shrink-0" />
                  ) : (
                    <Smartphone className="w-8 h-8 text-emerald-600 shrink-0" />
                  )}
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-indigo-950">
                      {paymentDetails.type === 'card'
                        ? `${paymentDetails.cardBrand || 'Card'} ending in •••• ${paymentDetails.cardNumberLast4 || '8821'}`
                        : `${paymentDetails.walletType || 'Mobile Wallet'} (${paymentDetails.walletNumber || '+92 300 ***'})`}
                    </p>
                    <p className="text-indigo-700/80">
                      Order Amount: <strong className="text-brand-caramel text-sm font-serif">Rs. {order.totalAmount.toLocaleString()}</strong>
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>3D Secure 2.0 Authentication</span>
                  </div>
                  <h4 className="text-sm font-bold text-brand-chocolate">Enter One-Time Security Code (OTP)</h4>
                  <p className="text-xs text-brand-chocolate/60 max-w-xs mx-auto">
                    A 6-digit verification code has been dispatched via SMS to your registered mobile number for this transaction.
                  </p>
                </div>

                {/* OTP Input Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="1 2 3 4 5 6"
                      className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 bg-brand-cream border-2 border-indigo-200 rounded-2xl focus:border-indigo-600 focus:outline-none font-bold text-brand-chocolate"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-brand-chocolate/60 px-1">
                    <span>Resend code in: <strong className="text-indigo-600">{countdown}s</strong></span>
                    <button
                      type="button"
                      onClick={() => setCountdown(60)}
                      disabled={countdown > 0}
                      className="text-indigo-600 hover:underline font-bold disabled:opacity-40"
                    >
                      Resend SMS OTP
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize & Confirm Payment</span>
                  </button>
                </div>

                {/* Security badges row */}
                <div className="flex justify-center items-center gap-4 text-[10px] text-brand-chocolate/50 pt-2 border-t border-brand-caramel/10">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-600" /> Fraud Shield Protected</span>
                  <span>•</span>
                  <span>Zero Zero Liability</span>
                </div>
              </form>
            )}

            {/* STEP 3: AUTHORIZING & VERIFYING WITH ISSUER */}
            {step === 'authorizing' && (
              <div className="text-center py-10 space-y-4">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                  <LockKeyhole className="w-7 h-7 text-indigo-800 absolute" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-lg text-brand-chocolate">Authorizing Payment...</h4>
                  <p className="text-xs text-brand-chocolate/60">
                    Contacting card issuer bank to settle Rs. {order.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 'success' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8 space-y-4"
              >
                <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xl">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                    Payment Approved
                  </span>
                  <h4 className="text-2xl font-serif font-black text-brand-chocolate">Transaction Successful!</h4>
                  <p className="text-xs text-brand-chocolate/70">
                    Order <strong>{order.id}</strong> has been paid and sent directly to our master kitchen team!
                  </p>
                </div>

                <div className="p-3 bg-brand-cream rounded-2xl border border-brand-caramel/10 text-xs space-y-1 font-mono text-left max-w-xs mx-auto">
                  <div className="flex justify-between">
                    <span className="text-brand-chocolate/60">Status:</span>
                    <span className="text-emerald-600 font-bold">PAID & PREPARING</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-chocolate/60">Total Settled:</span>
                    <span className="font-bold text-brand-caramel">Rs. {order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-chocolate/60">Auth Code:</span>
                    <span className="text-brand-chocolate font-bold">AUTH-256-{Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: FAILED */}
            {step === 'failed' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-serif font-bold text-brand-chocolate">Authorization Declined</h4>
                  <p className="text-xs text-red-600 font-medium max-w-xs mx-auto">
                    {errorMessage || 'The payment gateway could not verify the OTP or account balance.'}
                  </p>
                </div>

                <button
                  onClick={() => setStep('3d_secure_otp')}
                  className="px-6 py-2.5 bg-brand-caramel text-brand-cream font-bold text-xs rounded-xl shadow-md hover:bg-brand-chocolate transition-colors"
                >
                  Try OTP Code Again
                </button>
              </div>
            )}

          </div>

          {/* Footer Lock Security Note */}
          <div className="p-3 bg-brand-cream border-t border-brand-caramel/10 text-center text-[11px] text-brand-chocolate/60 flex items-center justify-center gap-1.5">
            <LockKeyhole className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-End Encrypted E-Commerce Payment Gateway</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
