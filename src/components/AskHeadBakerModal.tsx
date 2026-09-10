import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChefHat, 
  Sparkles, 
  X, 
  Film, 
  Flame, 
  Thermometer, 
  ShoppingCart, 
  ArrowRight, 
  Check, 
  Share2, 
  Send, 
  RefreshCw, 
  Instagram,
  Clock,
  Lightbulb
} from 'lucide-react';
import { MenuItem, SizeOption } from '../types';
import { MENU_ITEMS } from '../data/menu';

interface AskHeadBakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (payload: { item: MenuItem; selectedSize?: SizeOption; quantity: number; notes?: string }) => void;
  onFilterMenu?: (category: string, search: string) => void;
}

export interface BakerTipData {
  title: string;
  season: string;
  headline: string;
  quote: string;
  tips: string[];
  servingAdvice: string;
  recommendedItemNames: string[];
  reelHighlight?: {
    title: string;
    code: string;
  };
}

const SEASONAL_TOPICS = [
  { id: 'seasonal-specials', label: '☀️ Summer Mango & Refreshing Treats', icon: '🥭' },
  { id: 'mithai-secrets', label: '🥮 Artisanal Mithai & Ghee Heritage', icon: '🍯' },
  { id: 'cakes-masterclass', label: '🎂 Celebration Cakes & Ganache Secrets', icon: '✨' },
  { id: 'morning-bakes', label: '🥐 5 AM Oven Drop & Savory Patties', icon: '🔥' },
];

const PRESET_BAKER_TIPS: Record<string, BakerTipData> = {
  'seasonal-specials': {
    title: "Head Baker's Summer Mango & Chilled Delights",
    season: "Summer Peak Selection",
    headline: "Fresh Sindhri Mangoes Infused with Velvety Sponge & Cream",
    quote: "Our secret is chilling the Mango Three Milk Cake at 3°C so the infused cardamom-saffron milk melts in your mouth without soaking out the crisp sponge base.",
    tips: [
      "Fruit cream cakes taste best within 24-36 hours of baking—keep refrigerated at 4°C.",
      "Pair our fresh Mango Tart with an iced cardamom latte or fresh brewed green tea.",
      "For afternoon gatherings, combine 1 cream cake with 1 savory chicken patty box for the perfect sweet-savory balance."
    ],
    servingAdvice: "Chill for 25 minutes in refrigerator before slicing. Serve with a dessert fork.",
    recommendedItemNames: ["Mango Three Milk Cake", "Mango Tart Special", "Mango Pistachio Cake", "Sundae Ice Cream Cups"],
    reelHighlight: {
      title: "Viral Live Mango Tart & Cake Glazing at Muffinns",
      code: "DZx1rZhD6BL"
    }
  },
  'mithai-secrets': {
    title: "Artisanal Mithai, Patashay & Halwa Heritage",
    season: "Royal Traditional Selection",
    headline: "Pure Desi Ghee Roasting with Premium Roasted Nuts",
    quote: "Traditional Badam Burfi and Qalakand need slow gentle warming—just 8 seconds in the microwave unlocks the fragrant desi ghee and freshly crushed green cardamom.",
    tips: [
      "Never freeze dry mithai; store in an airtight container at cool room temperature.",
      "Warm Sohan Halwa or Gajar Halwa gently in a non-stick pan with a spoon of milk for fresh-out-of-the-karahi taste.",
      "Pair classic Patashay sweets with piping hot Kashmiri chai or Karak Doodh Patti."
    ],
    servingAdvice: "Warm for 8-10 seconds before serving. Garnish with slivered almonds.",
    recommendedItemNames: ["Badam Burfi Special", "Special Patashay Sweets", "Akhroti Sohan Halwa", "Panjeri Special"],
    reelHighlight: {
      title: "Traditional Mithai & Desi Ghee Roasting Secrets",
      code: "DZx1rZhD6BL"
    }
  },
  'cakes-masterclass': {
    title: "Master Baker's Celebration Cake Secrets",
    season: "Celebrations & Parties",
    headline: "Multi-layered Belgium Chocolate & Lotus Biscoff Textures",
    quote: "For multi-tiered chocolate cakes, let the slice rest on the counter for 5 minutes before eating—this softens the dark ganache to velvety perfection.",
    tips: [
      "Dip your slicing knife in warm water and wipe dry between each slice for razor-sharp bakery-style cuts.",
      "Lotus Biscoff and Fudge cakes pair divinely with unsweetened black Americano or French Vanilla latte.",
      "Custom Bento Cakes are pre-portioned for intimate 2-person celebrations without leftover waste."
    ],
    servingAdvice: "Bring to room temperature 10 mins before cutting for the smoothest ganache.",
    recommendedItemNames: ["Lotus Biscoff Cake", "Belgian Malt Cake", "Red Velvet Special", "Bento Celebration Cakes"],
    reelHighlight: {
      title: "Watch Our Pastry Chefs Pipe Royal Rose Frosting",
      code: "DZx1rZhD6BL"
    }
  },
  'morning-bakes': {
    title: "Early Morning 5 AM Oven Drop & Savory Secrets",
    season: "Fresh Daily Oven Selection",
    headline: "Flaky Golden Puff Pastry & Soft Sweet Milky Loaves",
    quote: "We start kneading our signature Milky Bread dough at 4:30 AM every morning with pure whole milk to achieve that cloud-soft, pillowy texture.",
    tips: [
      "Reheat chicken patties and samosas in an air fryer or oven at 180°C for 3 minutes instead of microwave to restore the 64-layer crunch.",
      "Toast Milky Bread on low heat with salted butter for golden caramelized crust.",
      "Baqir Khani and French Hearts are crafted with pure butter laminations—perfect for dipping in hot tea."
    ],
    servingAdvice: "Air fry or oven toast for 3 minutes at 180°C for maximum flake and crunch.",
    recommendedItemNames: ["Fresh Chicken Patty", "Milky Bread", "Special Baqir Khani Puffs", "French Heart Cookies"],
    reelHighlight: {
      title: "Crisp 64-Layer Puff Pastry Fresh from the Oven",
      code: "DZx1rZhD6BL"
    }
  }
};

function generateSmartFallback(question: string, topic: string): BakerTipData {
  const q = question.toLowerCase();
  
  if (q.includes('anniversary') || q.includes('birthday') || q.includes('party') || q.includes('cake') || q.includes('chocolate')) {
    return {
      title: "Chef Farhan's Celebration Cake Recommendation",
      season: "Special Occasion Guide",
      headline: "Rich Belgium Malt & Lotus Biscoff Cream Layers",
      quote: "For celebratory events, our Belgian Malt Cake paired with Lotus Biscoff cupcakes ensures both rich dark cocoa lovers and caramel crunch enthusiasts are delighted!",
      tips: [
        "Store multi-tier cakes in the bakery box inside the fridge until 15 minutes before the candle ceremony.",
        "Use a serrated chef knife dipped in warm water for picture-perfect party slices.",
        "Add custom message plaques on our Bento Cakes for personalized celebrations."
      ],
      servingAdvice: "Serve at 18°C (cool room temperature) with champagne or iced coffee.",
      recommendedItemNames: ["Belgian Malt Cake", "Lotus Biscoff Cake", "Red Velvet Special", "Bento Celebration Cakes"]
    };
  }

  if (q.includes('burfi') || q.includes('mithai') || q.includes('ghee') || q.includes('halwa') || q.includes('sweet') || q.includes('patashay')) {
    return {
      title: "Master Confectioner's Pure Desi Ghee Secrets",
      season: "Traditional Confectionery",
      headline: "Slow Caramelized Khoya with Saffron & Green Cardamom",
      quote: "Our Badam Burfi uses 100% natural almond meal and pure farm desi ghee. To preserve its velvety crumb, keep in an airtight tin away from direct sunlight.",
      tips: [
        "Warm dry mithai for 6-8 seconds in a microwave before eating to revive the roasted nutty aroma.",
        "Never refrigerate Patashay sweets in high-humidity zones to avoid surface stickiness.",
        "Pair with piping hot Cardamom Chai or Kashmiri Pink Tea."
      ],
      servingAdvice: "Serve gently warmed on a silver platter with crushed pistachios.",
      recommendedItemNames: ["Badam Burfi Special", "Special Patashay Sweets", "Akhroti Sohan Halwa", "Panjeri Special"]
    };
  }

  if (q.includes('chai') || q.includes('tea') || q.includes('evening') || q.includes('snack') || q.includes('patty') || q.includes('samosa') || q.includes('savory')) {
    return {
      title: "Chef Farhan's Evening Tea & Savory Pairing",
      season: "Teatime & Evening High Tea",
      headline: "Flaky 64-Layer Chicken Patties & Roasted Baqir Khani",
      quote: "Our bakery patties are folded with pure Danish puff margarine. A 3-minute crisp in an air fryer restores that oven-fresh bakery crunch effortlessly!",
      tips: [
        "Reheat patties at 180°C in an oven or air fryer for 3 minutes (avoid microwave to prevent sogginess).",
        "Dip crispy Baqir Khani puffs into sweet Karak Chai for the authentic Lahore teatime tradition.",
        "Pair sweet French Heart cookies with savory mini chicken rolls for balanced high tea."
      ],
      servingAdvice: "Serve piping hot straight from the air fryer with mint chutney.",
      recommendedItemNames: ["Fresh Chicken Patty", "Special Baqir Khani Puffs", "French Heart Cookies", "Milky Bread"]
    };
  }

  const base = PRESET_BAKER_TIPS[topic] || PRESET_BAKER_TIPS['seasonal-specials'];
  return {
    ...base,
    title: `Head Baker's Advice for "${question.length > 28 ? question.substring(0, 25) + '...' : question}"`,
    quote: `Regarding "${question}": Our head baking team recommends choosing items baked in morning drops, maintained at optimal serving temperatures for peak flavor and aroma.`
  };
}

export default function AskHeadBakerModal({
  isOpen,
  onClose,
  onAddToCart,
  onFilterMenu
}: AskHeadBakerModalProps) {
  const [activeTab, setActiveTab] = useState<'tips' | 'reel' | 'ask'>('tips');
  const [selectedTopic, setSelectedTopic] = useState('seasonal-specials');
  const [tipData, setTipData] = useState<BakerTipData>(() => PRESET_BAKER_TIPS['seasonal-specials']);
  const [isLoading, setIsLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [addedItemName, setAddedItemName] = useState<string | null>(null);
  const [copiedTip, setCopiedTip] = useState(false);

  // Sync selected topic with preset immediately and attempt server fetch
  const loadTopicAdvice = useCallback(async (topicId: string) => {
    // Set preset first for zero latency
    const fallback = PRESET_BAKER_TIPS[topicId] || PRESET_BAKER_TIPS['seasonal-specials'];
    setTipData(fallback);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/baker-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicId }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.title) {
          setTipData(data);
        }
      }
    } catch {
      // Fallback already set, nothing to error out
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTopicAdvice(selectedTopic);
    }
  }, [isOpen, selectedTopic, loadTopicAdvice]);

  const handleAskCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = customQuestion.trim();
    if (!prompt || isLoading) return;

    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('/api/baker-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, topic: selectedTopic }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.title) {
          setTipData(data);
          setActiveTab('tips');
          setIsLoading(false);
          setCustomQuestion('');
          return;
        }
      }
    } catch {
      // Handled gracefully via smart fallback below
    }

    // Smart instant response fallback
    const smartAnswer = generateSmartFallback(prompt, selectedTopic);
    setTipData(smartAnswer);
    setActiveTab('tips');
    setIsLoading(false);
    setCustomQuestion('');
  };

  // Find matching menu item objects from recommended names
  const recommendedMenuItems: MenuItem[] = React.useMemo(() => {
    if (!tipData || !tipData.recommendedItemNames) return [];
    return tipData.recommendedItemNames
      .map(name => {
        return MENU_ITEMS.find(
          m => m.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(m.name.toLowerCase())
        );
      })
      .filter((item): item is MenuItem => Boolean(item));
  }, [tipData]);

  const handleAddItemToCart = (item: MenuItem) => {
    if (onAddToCart) {
      onAddToCart({
        item,
        selectedSize: item.sizes && item.sizes.length > 0 ? item.sizes[0] : undefined,
        quantity: 1,
        notes: 'Head Baker Recommendation'
      });
      setAddedItemName(item.name);
      setTimeout(() => setAddedItemName(null), 2000);
    }
  };

  const handleShareTip = () => {
    if (!tipData) return;
    const text = `👨‍🍳 *Head Baker's Seasonal Secret from Muffinns Sweets & Bakers*\n\n"${tipData.quote}"\n\n📌 *Pro Tip:* ${tipData.tips?.[0] || 'Enjoy freshly baked treats daily.'}\n\nCheck out the artisanal menu at Muffinns!`;
    navigator.clipboard.writeText(text);
    setCopiedTip(true);
    setTimeout(() => setCopiedTip(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="ask-head-baker-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 25 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative max-w-4xl w-full bg-brand-sugar rounded-3xl overflow-hidden shadow-2xl border border-brand-honey/30 text-brand-chocolate my-auto max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="bg-stone-950 text-white p-4 sm:p-6 border-b border-amber-500/30 relative shrink-0">
            {/* Background sparkle glow */}
            <div className="absolute -top-10 right-10 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3.5">
                {/* Chef Avatar with live badge */}
                <div className="relative">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500 p-0.5 shadow-lg flex items-center justify-center">
                    <div className="w-full h-full bg-stone-900 rounded-2xl flex items-center justify-center text-amber-300">
                      <ChefHat className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-stone-900 flex items-center justify-center" title="Master Baker Active in Kitchen">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-serif font-black text-white tracking-wide">
                      Chef's Kitchen Table
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3 text-stone-950" />
                      <span>Live Confectionery</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-200 font-semibold mt-0.5">
                    Muffinns Master Baker • Seasonal Secrets, Serving Guides & Video Reels
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-white/20"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-800 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('tips')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'tips'
                    ? 'bg-amber-400 text-stone-950 shadow-md ring-2 ring-amber-300 scale-105'
                    : 'bg-stone-800/90 text-white hover:bg-stone-700 border border-stone-700'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                <span>Seasonal Secrets & Tips</span>
              </button>

              <button
                onClick={() => setActiveTab('reel')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'reel'
                    ? 'bg-amber-400 text-stone-950 shadow-md ring-2 ring-amber-300 scale-105'
                    : 'bg-stone-800/90 text-white hover:bg-stone-700 border border-stone-700'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Live Kitchen Video Reel</span>
                <span className="px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-[9px] font-black">Live</span>
              </button>

              <button
                onClick={() => setActiveTab('ask')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'ask'
                    ? 'bg-amber-400 text-stone-950 shadow-md ring-2 ring-amber-300 scale-105'
                    : 'bg-stone-800/90 text-white hover:bg-stone-700 border border-stone-700'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Ask Custom Question</span>
              </button>
            </div>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-stone-50">
            
            {/* Quick Topic Chips Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>Choose Seasonal Inspiration:</span>
                </span>
                {isLoading && (
                  <span className="text-xs text-amber-800 font-black flex items-center gap-1.5 animate-pulse bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Baker formulating tip...</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SEASONAL_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopic(topic.id);
                      if (activeTab === 'ask') setActiveTab('tips');
                    }}
                    className={`p-3 rounded-2xl text-left transition-all border-2 cursor-pointer flex flex-col justify-between shadow-xs ${
                      selectedTopic === topic.id
                        ? 'bg-amber-50 border-amber-500 shadow-md'
                        : 'bg-white border-stone-200 hover:border-amber-400 hover:bg-amber-50/40'
                    }`}
                  >
                    <span className="text-xl mb-1.5">{topic.icon}</span>
                    <span className={`text-xs font-extrabold leading-snug ${selectedTopic === topic.id ? 'text-amber-950' : 'text-stone-900'}`}>
                      {topic.label.split(' ').slice(1).join(' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: SEASONAL TIPS & ADVICE */}
            {activeTab === 'tips' && (
              <div className="space-y-6 animate-fade-in">
                {tipData ? (
                  <>
                    {/* Head Baker Featured Quote Card */}
                    <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-amber-400/80 shadow-lg relative overflow-hidden">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-md font-black">
                          <ChefHat className="w-6 h-6" />
                        </div>
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-amber-950 bg-amber-300 px-3 py-1 rounded-full border border-amber-400 shadow-xs">
                              {tipData.season || 'Seasonal Selection'}
                            </span>
                            <span className="text-xs font-extrabold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-stone-300">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Fresh Daily Guidance</span>
                            </span>
                          </div>

                          <h4 className="text-xl sm:text-2xl font-serif font-black text-stone-950 tracking-tight leading-snug">
                            {tipData.title}
                          </h4>

                          <p className="text-sm sm:text-base font-bold text-amber-900 bg-amber-50/90 px-3 py-1.5 rounded-xl border border-amber-200/80">
                            ✦ {tipData.headline}
                          </p>

                          <div className="pt-2 mt-2">
                            <div className="bg-stone-900 text-amber-50 p-4 rounded-2xl border-l-4 border-amber-400 shadow-sm">
                              <p className="text-xs text-amber-300 font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>Master Baker's Secret Note</span>
                              </p>
                              <p className="text-sm sm:text-base text-white leading-relaxed font-serif italic">
                                "{tipData.quote}"
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Practical Pro Tips Grid */}
                      {tipData.tips && tipData.tips.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-stone-200 space-y-2.5">
                          <span className="text-xs sm:text-sm font-black text-stone-950 uppercase tracking-wide block">
                            ✦ Serving & Storage Recommendations:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {tipData.tips.map((tip, idx) => (
                              <div key={`tip-item-${idx}`} className="flex items-start gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200 shadow-xs">
                                <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                                  {idx + 1}
                                </span>
                                <p className="text-xs sm:text-sm text-stone-900 font-semibold leading-snug">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Temperature & Pairing Badges */}
                      {tipData.servingAdvice && (
                        <div className="mt-4 flex items-center gap-2.5 flex-wrap text-xs sm:text-sm bg-amber-100 p-3.5 rounded-2xl border border-amber-300">
                          <div className="flex items-center gap-1.5 font-black text-amber-950">
                            <Thermometer className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>Serving Temperature & Advice:</span>
                          </div>
                          <span className="text-stone-950 font-bold bg-white px-2.5 py-0.5 rounded-lg border border-amber-200">{tipData.servingAdvice}</span>
                        </div>
                      )}

                      {/* Card Actions */}
                      <div className="mt-5 pt-3 border-t border-stone-200 flex items-center justify-between gap-3 flex-wrap">
                        <button
                          onClick={handleShareTip}
                          className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-950 font-extrabold text-xs border border-stone-300 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                        >
                          {copiedTip ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-amber-600" />}
                          <span>{copiedTip ? 'Tip Copied to Clipboard!' : 'Share Secret Tip'}</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('reel')}
                          className="px-4 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-300 font-extrabold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md border border-amber-500/40 ml-auto"
                        >
                          <Film className="w-4 h-4 text-pink-400" />
                          <span>Watch Kitchen Reel</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Recommended Menu Items matching this tip */}
                    {recommendedMenuItems.length > 0 && (
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <h5 className="text-base font-serif font-black text-stone-950 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span>Head Baker's Featured Seasonal Picks</span>
                          </h5>
                          <span className="text-xs text-stone-600 font-semibold">Tap to add directly or view in catalog</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                          {recommendedMenuItems.map((item) => (
                            <div
                              key={`baker-rec-${item.id}`}
                              className="bg-white p-4 rounded-2xl border-2 border-stone-200 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between"
                            >
                              <div className="flex items-start gap-3">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                                  />
                                )}
                                <div className="space-y-0.5 flex-1">
                                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                                    {item.category}
                                  </span>
                                  <p className="font-extrabold text-xs sm:text-sm text-stone-950 line-clamp-1">
                                    {item.name}
                                  </p>
                                  <p className="text-xs sm:text-sm font-black text-amber-950">
                                    Rs. {item.basePrice.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center gap-2">
                                <button
                                  onClick={() => handleAddItemToCart(item)}
                                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  {addedItemName === item.name ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-stone-950" />
                                      <span>Added!</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="w-3.5 h-3.5" />
                                      <span>Add to Cart</span>
                                    </>
                                  )}
                                </button>

                                {onFilterMenu && (
                                  <button
                                    onClick={() => {
                                      onFilterMenu(item.category, item.name);
                                      onClose();
                                    }}
                                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer border border-stone-300 font-bold"
                                    title="View in Menu Catalog"
                                  >
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}

            {/* TAB 2: LIVE KITCHEN VIDEO REEL EMBED */}
            {activeTab === 'reel' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-stone-200 shadow-md">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-pink-700 bg-pink-100 px-3 py-1 rounded-full inline-block mb-1 border border-pink-200">
                        Live Viral Instagram Reel
                      </span>
                      <h4 className="text-xl font-serif font-black text-stone-950">
                        Artisanal Kitchen Footage & Live Cake Icing 🎥
                      </h4>
                    </div>

                    <a
                      href="https://www.instagram.com/reel/DZx1rZhD6BL/?igsh=MXRza3Z5MnhqNWhlNQ=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
                    >
                      <Instagram className="w-4 h-4" />
                      <span>Open on Instagram</span>
                    </a>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-800 font-medium mb-4">
                    Watch our master confectionery team craft fresh cakes, traditional patashay mithai, and signature desserts live from our ovens!
                  </p>

                  {/* Embed Container */}
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[500px] w-full max-w-sm mx-auto shadow-xl border border-stone-800">
                    <iframe
                      src="https://www.instagram.com/reel/DZx1rZhD6BL/embed"
                      className="w-full h-full min-h-[480px] border-0"
                      allow="encrypted-media"
                      title="Muffinns Sweets & Bakers Video Reel"
                    />
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-xs sm:text-sm text-stone-800 font-semibold">
                      Official Handle: <strong className="text-pink-600 font-extrabold">@patashay_muffins</strong> • TikTok: <strong className="text-stone-950 font-extrabold">@muffinns_sweetsbaker</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ASK CUSTOM QUESTION TO HEAD BAKER */}
            {activeTab === 'ask' && (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-stone-200 shadow-md space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xl font-serif font-black text-stone-950 flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-amber-600" />
                      <span>Ask Chef Farhan Directly</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-800 font-medium">
                      Need custom pairing advice, dietary suggestions, wedding gift box recommendations, or dessert storage instructions? Ask below!
                    </p>
                  </div>

                  {/* Suggested Instant Questions */}
                  <div className="space-y-2">
                    <span className="text-xs font-black text-stone-900 uppercase tracking-wider block">
                      Quick Questions:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "What is the best cake for an anniversary party?",
                        "How do I keep Badam Burfi fresh for 5 days?",
                        "Which savory items pair best with evening Kashmiri Chai?",
                        "What are your top 3 bestselling signature treats?"
                      ].map((prompt, pIdx) => (
                        <button
                          key={`prompt-chip-${pIdx}`}
                          type="button"
                          onClick={() => setCustomQuestion(prompt)}
                          className="px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-stone-950 text-xs border border-amber-300 text-left transition-colors cursor-pointer font-bold shadow-xs"
                        >
                          "{prompt}"
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleAskCustomQuestion} className="space-y-3 pt-2">
                    <textarea
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder="Type your question for the Head Baker here (e.g. Can I pre-order customized heart cakes? What sweets are made in pure desi ghee?)..."
                      rows={3}
                      className="w-full p-4 rounded-2xl border-2 border-stone-300 bg-white text-stone-950 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-3 focus:ring-amber-500/30 focus:border-amber-600 transition-all resize-none font-medium shadow-inner"
                    />

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-xs text-stone-700 font-bold">
                        ✦ AI-powered by Head Baker's knowledgebase
                      </span>

                      <button
                        type="submit"
                        disabled={!customQuestion.trim() || isLoading}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Consulting Baker...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Ask Head Baker</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>

          {/* Footer Bar */}
          <div className="bg-white p-4 px-6 border-t border-stone-200 flex items-center justify-between text-xs text-stone-800 font-semibold shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-xs text-stone-900">Muffinns Artisanal Bakery • Model Town & Gulberg Branches</span>
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-950 font-black text-xs transition-colors cursor-pointer ml-auto"
            >
              Close Window
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
