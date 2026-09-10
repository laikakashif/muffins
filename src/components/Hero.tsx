import { useState, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShoppingBag, MessageSquareCode, ArrowRight, Phone } from 'lucide-react';

const threeMilkCakeImg = 'https://i.ibb.co/jk7rk9Hk/three-milk-cake.webp';

interface HeroProps {
  onNavigate: (view: 'menu' | 'chat' | 'tracker') => void;
  theme?: 'classic' | 'velvet' | 'pistachio' | 'espresso' | 'cozy_brown' | 'golden_sprinkle' | 'muffin_galaxy' | 'muffin_oasis' | 'muffin_party' | 'midnight_muffins' | 'sprinkle_noir';
}

const THEME_CONTENT = {
  sprinkle_noir: {
    badge: "Welcome to Sprinkle Noir ✨🖤 • Luxury Dark Bakery Confections",
    titlePart1: "Golden Sprinkles &",
    titleAccent: "Silver Highlights",
    titlePart2: "Crafted for Midnight Connoisseurs",
    description: "Welcome to Sprinkle Noir! Draped in deep dark navy and blue (#1A1A2E), sprinkled with shimmering golden particles (#EAB543) and silver accents (#C4C4C4) over rich warm muffin orange.",
    highlightBadge: "Noir Special ✨",
    highlightName: "Golden Sprinkle Dark Cocoa Velvet Muffin",
    highlightDesc: "Infused with rich dark Dutch cocoa, dusted with 24k golden sprinkles, silver highlight flakes, and a warm muffin caramel core.",
    highlightPrice: "Rs. 380 / Piece",
    highlightImage: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800&auto=format&fit=crop&q=80",
    tags: ["Deep Dark Blue", "Golden Sprinkle ✨", "Silver Highlight", "Muffin Orange"],
    glowColor: "rgba(234, 181, 67, 0.45)",
    sparkleColor: "text-[#EAB543]"
  },
  midnight_muffins: {
    badge: "Welcome to Midnight Muffins 🌙🍪 • Freshly Baked After Dark",
    titlePart1: "Midnight Oven Drops &",
    titleAccent: "Warm Orange Glows",
    titlePart2: "For Late Night Bakery Connoisseurs",
    description: "Welcome to Midnight Muffins! Nestled in deep midnight blue with golden crumble highlights and warm orange muffin glazes. Freshly baked every night for your cozy late-night cravings.",
    highlightBadge: "Midnight Special 🌙",
    highlightName: "Midnight Salted Caramel Crumble Muffin",
    highlightDesc: "Infused with rich dark cocoa, topped with warm orange muffin drizzle, golden toasted crumble, and a cherry red glaze drop.",
    highlightPrice: "Rs. 320 / Piece",
    highlightImage: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800&auto=format&fit=crop&q=80",
    tags: ["Deep Midnight Blue", "Warm Orange Glaze", "Golden Crumble", "Cherry Red Accent"],
    glowColor: "rgba(230, 126, 34, 0.45)",
    sparkleColor: "text-[#F4A261]"
  },
  muffin_party: {
    badge: "Welcome to Muffin Party 🎈🍊 • Pop, Crunch & Smile!",
    titlePart1: "Let's Get This",
    titleAccent: "Party Started",
    titlePart2: "With Vibrant Fresh Muffins!",
    description: "Welcome to Muffin Party! Bursting with bright orange citrus glazes, party green sprinkles, hot pink berry explosions, and sky blue frosting pops that will put a big smile on your face 😄",
    highlightBadge: "Party Pop Special 🎈",
    highlightName: "Citrus Confetti Party Blast Muffin",
    highlightDesc: "A giant double-baked bright orange citrus muffin overflowing with hot pink berry glaze, sky blue sugar confetti, and party green mint crumbles!",
    highlightPrice: "Rs. 290 / Piece",
    highlightImage: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800&auto=format&fit=crop&q=80",
    tags: ["Bright Orange Citrus", "Hot Pink Berry Glaze", "Party Green Mint", "Sky Blue Confetti"],
    glowColor: "rgba(255, 159, 28, 0.45)",
    sparkleColor: "text-[#FF9F1C]"
  },
  muffin_oasis: {
    badge: "Welcome to Muffin Oasis 🌴🍰 • Glossy & Trendy Confections",
    titlePart1: "Glossy, Cute &",
    titleAccent: "Instagrammable",
    titlePart2: "Gourmet Muffin Sanctuary",
    description: "Step into Muffin Oasis! Enjoy fresh pink glazes, sunshine yellow crumbles, and minty green sprinkles on ultra-fluffy artisan muffins. Experience pure bliss in every glossy bite.",
    highlightBadge: "Instagram Viral Special 🍓",
    highlightName: "Strawberry Glaze Blossom Muffin",
    highlightDesc: "Fluffy vanilla bean muffin topped with a glossy pink strawberry glaze, sunshine sugar sparkles, and mint cream drizzle.",
    highlightPrice: "Rs. 260 / Piece",
    highlightImage: "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=800&auto=format&fit=crop&q=80",
    tags: ["Glossy Fresh Pink Glaze", "Sunshine Yellow Crumble", "Minty Sprinkle Magic"],
    glowColor: "rgba(255, 107, 107, 0.4)",
    sparkleColor: "text-[#FF6B6B]"
  },
  muffin_galaxy: {
    badge: "Welcome to Muffin Galaxy 🪐 • Cosmic Bakery Delights",
    titlePart1: "Interstellar",
    titleAccent: "Muffins",
    titlePart2: "Baked Beyond The Milky Way",
    description: "Blast off into sweet outer space! Indulge in gourmet cosmic muffins, orbital stardust cupcakes, solar-flare red velvet bakes, and golden crumble pastries crafted in deep space purple elegance.",
    highlightBadge: "Galactic Star Special",
    highlightName: "Nebula Stardust Muffin Supreme",
    highlightDesc: "A fluffy deep chocolate-berry sponge crowned with golden crumble stardust and orbiting orange caramel glaze. Baked fresh in cosmic ovens daily.",
    highlightPrice: "Rs. 280 / Piece",
    highlightImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
    tags: ["Muffin Orange Glaze", "Golden Stardust", "Space Purple Sponge"],
    glowColor: "rgba(244, 162, 97, 0.45)",
    sparkleColor: "text-[#F4A261]"
  },
  classic: {
    badge: "Now Serving Freshly Baked Magic Daily",
    titlePart1: "Crafting Sweet",
    titleAccent: "Moments",
    titlePart2: "Of Pure Confectionery Bliss",
    description: "Welcome to Muffinns Sweets & Bakers (پتاشے), where culinary heritage meets premium modern baking. Explore our rich variety of gourmet sweets, standard bakes, and customizable wedding and birthday cakes.",
    highlightBadge: "Signature Masterpiece",
    highlightName: "Muffinns Three Milk Cake",
    highlightDesc: "The ultimate gourmet sponge drenched in three kinds of sweet condensed milk, blanketed in chilled whipped vanilla cream. Baked fresh daily.",
    highlightPrice: "Rs. 2,050",
    highlightImage: threeMilkCakeImg,
    tags: ["Milk Infusion", "Fresh Cream", "Baker Specialty"],
    glowColor: "rgba(212, 175, 55, 0.25)",
    sparkleColor: "text-brand-honey"
  },
  velvet: {
    badge: "Indulge in Majestic Berry Royale & Velvet Delights",
    titlePart1: "Exquisite Berry",
    titleAccent: "Prestige",
    titlePart2: "Under Royal Crimson Canopies",
    description: "Welcome to our Royal Velvet Salon (پتاشے). Celebrating legendary gourmet Red Velvet cakes, signature macarons, and sweet pastries draped in premium rose gold and dark plums.",
    highlightBadge: "Royal Speciality",
    highlightName: "Gourmet Red Velvet Cupcakes",
    highlightDesc: "Fluffy premium red velvet sponges topped with a rich, silky cream cheese crown and light raspberry glaze. Crowned with gold leaf.",
    highlightPrice: "Rs. 240 / Piece",
    highlightImage: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=800&auto=format&fit=crop&q=80",
    tags: ["Cream Cheese", "Berry Drizzle", "Royal Gold Leaf"],
    glowColor: "rgba(128, 24, 50, 0.35)",
    sparkleColor: "text-rose-400"
  },
  pistachio: {
    badge: "Naturally Fresh Mint & Organic Matcha Harmony",
    titlePart1: "Earthy Botanical",
    titleAccent: "Harmony",
    titlePart2: "With Light Low-Sugar Sensory Bliss",
    description: "Welcome to the tranquility of Pistachio Mint (پتاشے). Discover matcha-infused pastries, earthy pistachio bakes, and fresh mint-crowned delicacies crafted with light organic ingredients.",
    highlightBadge: "Zen Masterpiece",
    highlightName: "Matcha Pistachio Macarons",
    highlightDesc: "Exquisite French-style almond macarons with a smooth matcha green tea shell and rich salted pistachio ganache core.",
    highlightPrice: "Rs. 180 / Piece",
    highlightImage: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800&auto=format&fit=crop&q=80",
    tags: ["Matcha Green Tea", "Salted Pistachio", "Organic Almonds"],
    glowColor: "rgba(45, 95, 57, 0.25)",
    sparkleColor: "text-emerald-400"
  },
  espresso: {
    badge: "Rich Cocoa Aromas & Double Shot Espresso Infusions",
    titlePart1: "Aromatic Cocoa",
    titleAccent: "Warmth",
    titlePart2: "For the Discerning Dark Roast Connoisseur",
    description: "Step into our Midnight Espresso Sanctuary (پتاشے). Enjoy warm roasted hazelnut sweets, rich cocoa truffles, Tiramisu cups, and caramelized pastries baked to perfection.",
    highlightBadge: "Dark Roast Creation",
    highlightName: "Cappuccino Espresso Tiramisu",
    highlightDesc: "Gourmet espresso-soaked ladyfingers blanketed in rich mascarpone cream, dusted with dark Belgian cocoa powder and roasted coffee beans.",
    highlightPrice: "Rs. 1,850",
    highlightImage: "https://images.unsplash.com/photo-1571115177098-24ec4209b5d5?w=800&auto=format&fit=crop&q=80",
    tags: ["Espresso Soak", "Mascarpone Cream", "Belgian Cocoa"],
    glowColor: "rgba(43, 35, 31, 0.45)",
    sparkleColor: "text-amber-500"
  }
};

export default function Hero({ onNavigate, theme = 'classic' }: HeroProps) {
  // 3D Tilt state for the main hero image card
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const content = THEME_CONTENT[theme] || THEME_CONTENT.classic;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    // Convert to rotation angles (-15 to 15 degrees)
    const rY = (mouseX / (width / 2)) * 15;
    const rX = -(mouseY / (height / 2)) * 15;
    
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center py-10 sm:py-16 px-3 sm:px-6 w-full max-w-full overflow-hidden" id="home-section">
      {/* Background 3D-like floating blurred blobs */}
      <div className="absolute top-1/4 left-1/10 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-brand-honey/10 blur-3xl animate-float-slow -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-brand-caramel/5 blur-3xl animate-float-reverse-slow -z-10 pointer-events-none" />
      
      {/* Dynamic Ambient Glow overlay based on chosen theme */}
      <div 
        className="absolute inset-0 opacity-10 transition-colors duration-1000 -z-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${content.glowColor} 0%, transparent 70%)`
        }}
      />

      {/* Interactive grid container */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left column: Epic typography & CTAs */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6 sm:space-y-8 min-w-0"
        >
          {/* Badge */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={theme + '-badge'}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full glass-panel text-brand-caramel text-xs font-semibold border border-brand-caramel/10 max-w-full truncate"
            >
              <Sparkles className={`w-4 h-4 animate-pulse shrink-0 ${content.sparkleColor}`} />
              <span className="truncate">{content.badge}</span>
            </motion.div>
          </AnimatePresence>

          {/* Majestic Title */}
          <div className="space-y-3 sm:space-y-4">
            <AnimatePresence mode="wait">
              <motion.h1 
                key={theme + '-title'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-brand-chocolate leading-tight tracking-tight break-words"
              >
                {content.titlePart1} <br />
                <span className="text-brand-caramel relative inline-block">
                  {content.titleAccent}
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-brand-honey" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0,7 C30,2 70,2 100,7" stroke="currentColor" strokeWidth="3" fill="none" />
                  </svg>
                </span> <br />
                {content.titlePart2}
              </motion.h1>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.p 
                key={theme + '-desc'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xs sm:text-base text-brand-chocolate/80 font-sans max-w-lg leading-relaxed pt-1 sm:pt-2"
              >
                {content.description}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Staggered CTAs */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3.5 pt-2 sm:pt-4 w-full">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(142,74,37,0.25)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('menu')}
              className="w-full sm:w-auto px-6 sm:px-7 py-3.5 bg-brand-caramel text-brand-cream font-bold rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:bg-brand-chocolate transition-colors text-sm shrink-0"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Explore Digital Menu</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </motion.button>

            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="https://wa.me/923202587047"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-4 sm:px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors text-xs sm:text-sm shrink-0"
              title="Order or inquire on WhatsApp: 0320 2587047"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>WhatsApp: 0320 2587047</span>
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="https://wa.me/923166126926"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-4 sm:px-5 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors text-xs sm:text-sm shrink-0"
              title="Order or inquire on WhatsApp: 0316 6126926"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>0316 6126926</span>
            </motion.a>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('chat')}
              className="w-full sm:w-auto px-5 sm:px-6 py-3.5 bg-brand-sugar text-brand-caramel border border-brand-caramel/20 font-bold rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:border-brand-caramel transition-colors text-sm shrink-0"
            >
              <MessageSquareCode className="w-4 h-4 text-brand-honey shrink-0" />
              <span>Ask Butler AI</span>
            </motion.button>
          </div>

          {/* Quick stats board */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 sm:pt-6 border-t border-brand-caramel/10 max-w-md w-full">
            <div>
              <p className="text-xl sm:text-3xl font-serif font-bold text-brand-caramel">150+</p>
              <p className="text-[9px] sm:text-[10px] text-brand-chocolate/60 uppercase tracking-widest font-bold">Baked Dishes</p>
            </div>
            <div>
              <p className="text-xl sm:text-3xl font-serif font-bold text-brand-caramel">10k+</p>
              <p className="text-[9px] sm:text-[10px] text-brand-chocolate/60 uppercase tracking-widest font-bold">Sweet Orders</p>
            </div>
            <div>
              <p className="text-xl sm:text-3xl font-serif font-bold text-brand-caramel">4.9★</p>
              <p className="text-[9px] sm:text-[10px] text-brand-chocolate/60 uppercase tracking-widest font-bold">Customer Rating</p>
            </div>
          </div>
        </motion.div>

        {/* Right column: 3D interactive floating card showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex justify-center relative cursor-grab active:cursor-grabbing w-full max-w-full"
          style={{ perspective: 1000 }}
        >
          {/* Ambient light ring behind card */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-80 h-72 sm:h-80 rounded-full blur-3xl animate-pulse -z-10 transition-colors duration-1000" 
            style={{ backgroundColor: content.glowColor }}
          />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={theme + '-card'}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.1s ease-out'
              }}
              className="w-full max-w-[420px] rounded-2xl bg-brand-sugar p-4 sm:p-5 shadow-2xl relative border border-brand-caramel/15"
            >
              {/* Top glass ornament */}
              <div className="absolute -top-3 right-2 sm:-top-4 sm:-right-4 glass-panel px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-brand-caramel border border-brand-caramel/15 animate-float-slow shadow-md flex items-center gap-1.5 z-10 max-w-[calc(100%-16px)] truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="truncate">Direct order & same-day delivery</span>
              </div>

              {/* Main dish image with premium shadow */}
              <div className="rounded-xl overflow-hidden aspect-[4/3] bg-brand-cream shadow-inner relative group">
                <motion.img 
                  src={content.highlightImage} 
                  alt={content.highlightName} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-chocolate/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Card info */}
              <div className="mt-4 sm:mt-5 space-y-2.5 sm:space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-brand-caramel truncate">{content.highlightBadge}</span>
                  <span className="text-xs bg-brand-marshmallow px-2.5 py-1 rounded-full text-brand-caramel font-semibold shrink-0">{content.highlightPrice}</span>
                </div>
                <h3 className="text-lg sm:text-2xl font-serif text-brand-chocolate font-bold leading-snug">{content.highlightName}</h3>
                <p className="text-xs sm:text-sm text-brand-chocolate/70 leading-relaxed">
                  {content.highlightDesc}
                </p>

                {/* Floating ingredient nodes for visual depth */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                  {content.tags.map((tag, tIdx) => (
                    <span key={`${tag}-${tIdx}`} className="text-[10px] bg-brand-cream border border-brand-caramel/10 px-2.5 sm:px-3 py-1 rounded-full font-bold text-brand-caramel">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Extra floating background cookies for 3D layout rhythm */}
          <div className="absolute -bottom-6 left-0 sm:-bottom-8 sm:-left-6 animate-float-slow opacity-90 hidden sm:block">
            <div className="glass-panel p-2.5 sm:p-3 rounded-2xl flex items-center gap-2.5 sm:gap-3 border border-brand-caramel/15 shadow-lg">
              <span className="text-base">🍩</span>
              <div>
                <p className="text-xs font-bold text-brand-chocolate">Special Treats</p>
                <p className="text-[10px] text-brand-caramel font-bold">Try our menu</p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
