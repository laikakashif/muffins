import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Flame, CheckCircle2, Phone, MapPin, X, Sparkles, 
  ChefHat, AlertCircle, Calendar, ArrowRight, Utensils
} from 'lucide-react';

interface KitchenTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderNow?: () => void;
}

export default function KitchenTimeModal({ isOpen, onClose, onOrderNow }: KitchenTimeModalProps) {
  const [lahoreTime, setLahoreTime] = useState<string>('');
  const [timeZoneDetails, setTimeZoneDetails] = useState<string>('');
  const [isOpenNow, setIsOpenNow] = useState<boolean>(true);
  const [nextBatchCountdown, setNextBatchCountdown] = useState<string>('00:14:32');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format to Pakistan Standard Time (PKT, UTC+5)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      const timeStr = now.toLocaleTimeString('en-US', options);
      setLahoreTime(timeStr);

      const dateStr = now.toLocaleDateString('en-US', {
        timeZone: 'Asia/Karachi',
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
      setTimeZoneDetails(dateStr);

      // Check if kitchen is open (8:00 AM - 1:00 AM PKT)
      const pktHour = parseInt(
        now.toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour: 'numeric', hour12: false }),
        10
      );
      // Open from 8 (8am) to 24 (midnight) and 0 (midnight to 1am)
      const openStatus = (pktHour >= 8 && pktHour <= 23) || (pktHour === 0);
      setIsOpenNow(openStatus);

      // Simulated next fresh batch countdown
      const mins = 14 - (now.getMinutes() % 15);
      const secs = 59 - now.getSeconds();
      setNextBatchCountdown(`00:${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-brand-sugar border-2 border-brand-caramel/30 rounded-3xl shadow-2xl overflow-hidden text-brand-chocolate my-8"
        >
          {/* Header Top Accent */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-brand-caramel p-5 sm:p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Clock className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/25 px-2 py-0.5 rounded-md text-white border border-white/30">
                    Live Kitchen Status
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-100">
                    <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                    {isOpenNow ? 'Ovens Baking Now' : 'Kitchen Closed'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight mt-0.5">
                  Muffinns Kitchen & Baking Schedule
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer focus:outline-none"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-brand-caramel/20">
            {/* Live Clock Display Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-brand-cream/80 border border-brand-caramel/20 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-honey flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Lahore Local Time (PKT)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/20">
                    UTC +5
                  </span>
                </div>
                <div className="my-2">
                  <span className="text-3xl sm:text-4xl font-mono font-black text-brand-chocolate tracking-tight">
                    {lahoreTime || '08:00:00 PM'}
                  </span>
                  <p className="text-xs text-brand-chocolate/70 font-medium mt-0.5">{timeZoneDetails}</p>
                </div>
                <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 pt-2 border-t border-brand-caramel/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Kitchen Shift Active • 08:00 AM – 01:00 AM (Mon–Sun)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-600 animate-bounce" />
                    Fresh Oven Batch
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-amber-950 font-black">
                    Live Countdown
                  </span>
                </div>
                <div className="my-2">
                  <span className="text-3xl sm:text-4xl font-mono font-black text-amber-950 tracking-tight">
                    {nextBatchCountdown}
                  </span>
                  <p className="text-xs text-amber-900/80 font-medium mt-0.5">Estimated warm muffin & cake batch</p>
                </div>
                <div className="text-[11px] font-semibold text-amber-950 flex items-center gap-1 pt-2 border-t border-amber-500/20">
                  <ChefHat className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Average Online Prep Time: 15–20 Mins</span>
                </div>
              </div>
            </div>

            {/* Daily Oven Schedule Timeline */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-caramel flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Daily Master Baking Shifts
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-brand-cream/50 border border-brand-caramel/15 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Morning Batch</span>
                    <span className="text-[10px] font-bold text-brand-chocolate bg-amber-500/15 px-1.5 py-0.5 rounded">8:30 AM</span>
                  </div>
                  <h4 className="text-xs font-bold text-brand-chocolate">Fresh Breads & Croissants</h4>
                  <p className="text-[11px] text-brand-chocolate/70 leading-snug">
                    Stone ground milk breads, rusks, butter croissants & warm breakfast rolls.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-brand-cream/50 border border-brand-caramel/15 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Afternoon Batch</span>
                    <span className="text-[10px] font-bold text-brand-chocolate bg-amber-500/15 px-1.5 py-0.5 rounded">3:30 PM</span>
                  </div>
                  <h4 className="text-xs font-bold text-brand-chocolate">Patashay Sweets & Tea Cakes</h4>
                  <p className="text-[11px] text-brand-chocolate/70 leading-snug">
                    Traditional Desi Ghee Pateesa, Badam Burfi, Almond cookies & chocolate tea cake.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-brand-cream/50 border border-brand-caramel/15 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Evening Batch</span>
                    <span className="text-[10px] font-bold text-brand-chocolate bg-amber-500/15 px-1.5 py-0.5 rounded">7:00 PM</span>
                  </div>
                  <h4 className="text-xs font-bold text-brand-chocolate">Celebration Cakes & Savories</h4>
                  <p className="text-[11px] text-brand-chocolate/70 leading-snug">
                    Gourmet birthday cakes, chicken patties, pizza rolls & warm samosas.
                  </p>
                </div>
              </div>
            </div>

            {/* Branch Timings & Contact Hotlines */}
            <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-caramel/15 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-chocolate flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-honey" />
                  Branch Service Timings & Kitchen Dispatch
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  All 4 Branches Open
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-brand-sugar border border-brand-caramel/10 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-brand-chocolate">Central Model Town Bakery</p>
                    <p className="text-[11px] text-brand-chocolate/60">08:00 AM – 01:00 AM Daily</p>
                  </div>
                  <a href="tel:03202587047" className="text-brand-caramel hover:underline font-bold text-[11px]">
                    0320 2587047
                  </a>
                </div>

                <div className="p-2.5 rounded-xl bg-brand-sugar border border-brand-caramel/10 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-brand-chocolate">Gulberg Main Market</p>
                    <p className="text-[11px] text-brand-chocolate/60">08:00 AM – 01:00 AM Daily</p>
                  </div>
                  <a href="tel:03166126926" className="text-brand-caramel hover:underline font-bold text-[11px]">
                    0316 6126926
                  </a>
                </div>

                <div className="p-2.5 rounded-xl bg-brand-sugar border border-brand-caramel/10 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-brand-chocolate">DHA Phase 5 Outlet</p>
                    <p className="text-[11px] text-brand-chocolate/60">09:00 AM – 01:30 AM Daily</p>
                  </div>
                  <a href="tel:03202587047" className="text-brand-caramel hover:underline font-bold text-[11px]">
                    0320 2587047
                  </a>
                </div>

                <div className="p-2.5 rounded-xl bg-brand-sugar border border-brand-caramel/10 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-brand-chocolate">Johar Town Commercial</p>
                    <p className="text-[11px] text-brand-chocolate/60">08:30 AM – 01:00 AM Daily</p>
                  </div>
                  <a href="tel:03166126926" className="text-brand-caramel hover:underline font-bold text-[11px]">
                    0316 6126926
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-brand-chocolate/70">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Urgent order? Call kitchen hotline: <strong>0320 2587047</strong></span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-brand-caramel/20 hover:bg-brand-cream font-bold text-xs cursor-pointer text-brand-chocolate transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOrderNow) onOrderNow();
                  }}
                  className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-brand-caramel hover:bg-amber-600 text-brand-cream font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Order Fresh Batch Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
