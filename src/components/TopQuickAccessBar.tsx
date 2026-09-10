import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Palette, Clock, Flame, Utensils, Star, MapPin, Video, 
  Receipt, ShieldCheck, Phone, QrCode, Sparkles, MessageSquare,
  ChevronRight, Volume2
} from 'lucide-react';

interface TopQuickAccessBarProps {
  currentTheme: string;
  onOpenThemeModal: () => void;
  onOpenKitchenTimeModal: () => void;
  onNavigateSection: (sectionId: string) => void;
  onNavigateView: (view: 'home' | 'menu' | 'tracker' | 'admin') => void;
  onOpenQrPay: () => void;
  activeView: string;
}

export default function TopQuickAccessBar({
  currentTheme,
  onOpenThemeModal,
  onOpenKitchenTimeModal,
  onNavigateSection,
  onNavigateView,
  onOpenQrPay,
  activeView
}: TopQuickAccessBarProps) {
  const [lahoreTime, setLahoreTime] = useState<string>('');
  const [isOpenNow, setIsOpenNow] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      setLahoreTime(now.toLocaleTimeString('en-US', options));

      const pktHour = parseInt(
        now.toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour: 'numeric', hour12: false }),
        10
      );
      setIsOpenNow((pktHour >= 8 && pktHour <= 23) || (pktHour === 0));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const themeDisplayNames: Record<string, string> = {
    muffin_galaxy: 'Muffin Galaxy 🪐',
    sprinkle_noir: 'Sprinkle Noir ✨🖤',
    midnight_muffins: 'Midnight Muffins 🌙🍪',
    muffin_party: 'Muffin Party 🎈🍊',
    muffin_oasis: 'Muffin Oasis 🌴🍰',
    classic: 'Classic Honey 🍯',
    golden_sprinkle: 'Golden Sprinkle ✨',
    velvet: 'Royal Velvet 🍇',
    pistachio: 'Pistachio Mint 🍃',
    espresso: 'Midnight Espresso ☕',
    cozy_brown: 'Chestnut & Mocha 🍂'
  };

  const currentThemeLabel = themeDisplayNames[currentTheme] || currentTheme;

  return (
    <div className="w-full bg-brand-sugar border-b border-brand-caramel/15 select-none text-brand-chocolate">
      {/* Upper Status Ribbon: Live Kitchen Time, Hotline, Theme Indicator */}
      <div className="bg-brand-chocolate text-brand-cream text-[11px] font-medium py-1.5 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Left: Live Kitchen Time & Open Status (Interactive Pill) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={onOpenKitchenTimeModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer text-[11px] font-mono font-bold"
              title="Click to view full Kitchen Baking Schedule & Branch Timings"
            >
              <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Kitchen Time: {lahoreTime || '08:00 PM'} PKT</span>
              <span className="text-[10px] text-amber-200/80 font-sans hidden sm:inline">(8:00 AM – 1:00 AM)</span>
            </button>

            <span className="hidden md:inline-flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Fresh Ovens Baking • Avg Prep 15–20 min</span>
            </span>
          </div>

          {/* Right: Direct Theme Swatch & WhatsApp Order Helpline */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Colour Theme Button on Top Ribbon */}
            <button
              onClick={onOpenThemeModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-brand-cream border border-white/20 transition-all cursor-pointer text-[11px] font-bold"
              title="Open Bakery Colour Theme Palette"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-amber-200">Theme:</span>
              <span className="truncate max-w-[120px] sm:max-w-none">{currentThemeLabel}</span>
            </button>

            {/* Helpline phone link */}
            <a
              href="https://wa.me/923202587047"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors text-[11px] font-bold"
              title="WhatsApp Ordering Helpline"
            >
              <Phone className="w-3 h-3" />
              <span>Order Desk: 0320 2587047</span>
            </a>
          </div>

        </div>
      </div>

      {/* Lower Quick-Access Strip: Horizontal Scrollable Section Badges */}
      <div className="py-2 px-3 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 min-w-max">
          
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-honey mr-1 hidden sm:inline-block">
            Quick Sections:
          </span>

          {/* 1. Colour Theme */}
          <button
            onClick={onOpenThemeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-cream hover:bg-brand-cream/90 border border-brand-caramel/25 hover:border-brand-caramel font-bold text-xs text-brand-chocolate transition-all cursor-pointer shadow-2xs group"
          >
            <Palette className="w-3.5 h-3.5 text-amber-600 group-hover:rotate-45 transition-transform" />
            <span>Colour Theme</span>
          </button>

          {/* 2. Kitchen Time */}
          <button
            onClick={onOpenKitchenTimeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 font-bold text-xs text-amber-950 transition-all cursor-pointer shadow-2xs group"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
            <span>Kitchen Time</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </button>

          {/* 3. Digital Menu */}
          <button
            onClick={() => onNavigateSection('menu-section')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-cream hover:bg-brand-cream/90 border border-brand-caramel/20 hover:border-brand-caramel font-bold text-xs text-brand-chocolate transition-all cursor-pointer shadow-2xs"
          >
            <Utensils className="w-3.5 h-3.5 text-brand-honey" />
            <span>Digital Menu</span>
          </button>

          {/* 4. Specialties */}
          <button
            onClick={() => onNavigateSection('specialties-section')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-cream hover:bg-brand-cream/90 border border-brand-caramel/20 hover:border-brand-caramel font-bold text-xs text-brand-chocolate transition-all cursor-pointer shadow-2xs"
          >
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span>Specialties</span>
          </button>

          {/* 5. Our Branches */}
          <button
            onClick={() => onNavigateSection('branches-section')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-cream hover:bg-brand-cream/90 border border-brand-caramel/20 hover:border-brand-caramel font-bold text-xs text-brand-chocolate transition-all cursor-pointer shadow-2xs"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>4 Branches</span>
          </button>

          {/* 6. Video Reel */}
          <button
            onClick={() => onNavigateSection('video-section')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-cream hover:bg-brand-cream/90 border border-brand-caramel/20 hover:border-brand-caramel font-bold text-xs text-brand-chocolate transition-all cursor-pointer shadow-2xs"
          >
            <Video className="w-3.5 h-3.5 text-purple-600" />
            <span>Video Reel</span>
          </button>

          {/* 7. Live Order Tracker */}
          <button
            onClick={() => onNavigateView('tracker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-2xs ${
              activeView === 'tracker'
                ? 'bg-brand-caramel text-brand-cream border-brand-caramel font-black'
                : 'bg-brand-cream hover:bg-brand-cream/90 border-brand-caramel/20 text-brand-chocolate'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>Order Tracker</span>
          </button>

          {/* 8. Complaints & Feedback */}
          <button
            onClick={() => onNavigateSection('complaints-section')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-cream hover:bg-brand-cream/90 border border-brand-caramel/20 hover:border-brand-caramel font-bold text-xs text-brand-chocolate transition-all cursor-pointer shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Feedback</span>
          </button>

          {/* 9. Instant Bank QR Pay */}
          <button
            onClick={onOpenQrPay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs transition-all cursor-pointer shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-950" />
            <span>QR Pay</span>
          </button>

          {/* 10. Back-Office Admin */}
          <button
            onClick={() => onNavigateView('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-2xs ${
              activeView === 'admin'
                ? 'bg-brand-caramel text-brand-cream border-brand-caramel font-black'
                : 'bg-brand-cream hover:bg-brand-cream/90 border-brand-caramel/20 text-brand-chocolate'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-honey" />
            <span>Back-Office</span>
          </button>

        </div>
      </div>
    </div>
  );
}
