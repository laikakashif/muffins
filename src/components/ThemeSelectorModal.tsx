import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Check, X, Sparkles, Wand2 } from 'lucide-react';

export interface ThemeOption {
  id: 'classic' | 'velvet' | 'pistachio' | 'espresso' | 'cozy_brown' | 'golden_sprinkle' | 'muffin_galaxy' | 'muffin_oasis' | 'muffin_party' | 'midnight_muffins' | 'sprinkle_noir';
  name: string;
  badge: string;
  desc: string;
  bgColor: string;
  accentColor: string;
  textColor: string;
  dots: string[];
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'muffin_galaxy',
    name: 'Muffin Galaxy 🪐',
    badge: 'Cosmic Purple & Orange',
    desc: 'Deep cosmic nebula, stardust orange accents, floating asteroid particles',
    bgColor: '#1A1423',
    accentColor: '#F4A261',
    textColor: '#FFFFFF',
    dots: ['bg-[#2A1B3D]', 'bg-[#F4A261]', 'bg-[#E76F51]', 'bg-[#E9C46A]']
  },
  {
    id: 'sprinkle_noir',
    name: 'Sprinkle Noir ✨🖤',
    badge: 'Luxury Dark Blue',
    desc: 'Deep navy noir, golden celebration sprinkle sparkles & silver chrome highlights',
    bgColor: '#141423',
    accentColor: '#EAB543',
    textColor: '#FFFFFF',
    dots: ['bg-[#1A1A2E]', 'bg-[#EAB543]', 'bg-[#C4C4C4]', 'bg-[#E67E22]']
  },
  {
    id: 'midnight_muffins',
    name: 'Midnight Muffins 🌙🍪',
    badge: 'Midnight Slate & Amber',
    desc: 'Moody twilight blue, warm oven glow, rustic golden crumble contrast',
    bgColor: '#1A252F',
    accentColor: '#E67E22',
    textColor: '#FFFFFF',
    dots: ['bg-[#2C3E50]', 'bg-[#E67E22]', 'bg-[#F4A261]', 'bg-[#E74C3C]']
  },
  {
    id: 'muffin_party',
    name: 'Muffin Party 🎈🍊',
    badge: 'Vibrant & Playful',
    desc: 'Bright sunny orange, festive emerald green, hot pink & confetti animations',
    bgColor: '#FFFDF9',
    accentColor: '#FF9F1C',
    textColor: '#1D2A44',
    dots: ['bg-[#FF9F1C]', 'bg-[#2BAE66]', 'bg-[#F72585]', 'bg-[#00BBF9]']
  },
  {
    id: 'muffin_oasis',
    name: 'Muffin Oasis 🌴🍰',
    badge: 'Pastel Dream',
    desc: 'Glossy strawberry pink, fresh mint turquoise, sunshine pastel glazes',
    bgColor: '#FFFDFB',
    accentColor: '#FF6B6B',
    textColor: '#2D3748',
    dots: ['bg-[#FF6B6B]', 'bg-[#4ECDC4]', 'bg-[#FFE66D]', 'bg-[#F0FBF9]']
  },
  {
    id: 'classic',
    name: 'Classic Honey 🍯',
    badge: 'Original Lahore Bakery',
    desc: 'Warm butterscotch, caramelized honey, sweet heritage amber tones',
    bgColor: '#FFFDF9',
    accentColor: '#D97706',
    textColor: '#451A03',
    dots: ['bg-amber-500', 'bg-amber-600', 'bg-amber-700']
  },
  {
    id: 'golden_sprinkle',
    name: 'Golden Sprinkle ✨',
    badge: 'Sparkle Particle Magic',
    desc: 'Falling golden stars, rainbow pastry sprinkles, festive celebration atmosphere',
    bgColor: '#FFFBEB',
    accentColor: '#D97706',
    textColor: '#78350F',
    dots: ['bg-yellow-400', 'bg-rose-400', 'bg-cyan-400', 'bg-emerald-400']
  },
  {
    id: 'velvet',
    name: 'Royal Velvet 🍇',
    badge: 'Prestige Red & Plum',
    desc: 'Deep red velvet crumb, dark berry wine, rich artisanal pastry vibe',
    bgColor: '#FFF5F5',
    accentColor: '#E11D48',
    textColor: '#4C0519',
    dots: ['bg-rose-600', 'bg-pink-500', 'bg-purple-900']
  },
  {
    id: 'pistachio',
    name: 'Pistachio Mint 🍃',
    badge: 'Earthy Green & Kulfi',
    desc: 'Herbal pistachio, natural cardamom sage, fresh bakery morning glow',
    bgColor: '#F0FDF4',
    accentColor: '#059669',
    textColor: '#064E3B',
    dots: ['bg-emerald-500', 'bg-teal-600', 'bg-emerald-800']
  },
  {
    id: 'espresso',
    name: 'Midnight Espresso ☕',
    badge: 'Dark Roast Cafe',
    desc: 'Cozy roasted espresso beans, dark dark cocoa, creamy milk froth',
    bgColor: '#18181B',
    accentColor: '#D97706',
    textColor: '#FAFAFA',
    dots: ['bg-amber-700', 'bg-zinc-800', 'bg-amber-500']
  },
  {
    id: 'cozy_brown',
    name: 'Chestnut & Mocha 🍂',
    badge: 'Warm Autumn Bakery',
    desc: 'Roasted chestnuts, warm cinnamon, toasted crust & mocha glaze',
    bgColor: '#FAF5EF',
    accentColor: '#92400E',
    textColor: '#451A03',
    dots: ['bg-amber-200', 'bg-amber-700', 'bg-amber-950']
  }
];

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onSelectTheme: (themeId: any) => void;
}

export default function ThemeSelectorModal({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme
}: ThemeSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-brand-sugar border-2 border-brand-caramel/30 rounded-3xl shadow-2xl overflow-hidden text-brand-chocolate my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 via-brand-caramel to-amber-600 p-5 sm:p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Palette className="w-6 h-6 text-white animate-spin" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/25 px-2 py-0.5 rounded-md text-white border border-white/30">
                  Customization Studio
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight mt-0.5">
                  Bakery Colour Theme Gallery
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

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-brand-caramel/20">
            <div className="flex items-center justify-between text-xs text-brand-chocolate/70">
              <p>Choose from 11 artisanal color palettes with live interactive CSS themes.</p>
              <span className="font-bold text-brand-caramel">{THEME_OPTIONS.length} Themes Available</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {THEME_OPTIONS.map((th) => {
                const isSelected = currentTheme === th.id;
                return (
                  <motion.button
                    key={`theme-card-${th.id}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectTheme(th.id);
                      onClose();
                    }}
                    className={`p-4 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden group ${
                      isSelected
                        ? 'border-brand-caramel bg-brand-cream ring-2 ring-brand-caramel/30 shadow-md'
                        : 'border-brand-caramel/15 bg-brand-cream/40 hover:bg-brand-cream/80 hover:border-brand-caramel/40'
                    }`}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-brand-caramel text-brand-cream rounded-full text-[9px] font-black uppercase flex items-center gap-1 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Active</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: th.accentColor }}
                        />
                        <h4 className="font-serif font-black text-sm text-brand-chocolate group-hover:text-brand-caramel transition-colors">
                          {th.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-brand-honey uppercase tracking-wider block">
                        {th.badge}
                      </span>
                      <p className="text-[11px] text-brand-chocolate/70 leading-snug">
                        {th.desc}
                      </p>
                    </div>

                    {/* Color Swatch Dots */}
                    <div className="flex items-center justify-between pt-2 border-t border-brand-caramel/10">
                      <div className="flex items-center gap-1.5">
                        {th.dots.map((dotClass, dIdx) => (
                          <span
                            key={`swatch-dot-${th.id}-${dIdx}`}
                            className={`w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs ${dotClass}`}
                          />
                        ))}
                      </div>

                      <span className="text-[10px] font-bold text-brand-caramel group-hover:underline">
                        Apply &rarr;
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-brand-caramel/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-brand-chocolate text-brand-cream text-xs font-bold hover:bg-black transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
