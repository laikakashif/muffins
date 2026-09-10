import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TrailItem {
  id: string;
  x: number;
  y: number;
  type: number; // Index to choose which delicious treat SVG to render
  rotation: number;
  scale: number;
  size: number;
}

interface CursorPhotoTrailProps {
  theme?: 'classic' | 'velvet' | 'pistachio' | 'espresso' | 'golden_sprinkle';
}

const getThemePalette = (theme: string) => {
  switch (theme) {
    case 'velvet':
      return {
        primary: '#801832',     // Plum
        secondary: '#DCAE9E',   // Rose Gold
        accent: '#C07B88',      // Soft Berry Pink
        sparkle: '#FF9EAE',     // Sweet Rose Sparkle
        name: 'Royal Velvet 🍇'
      };
    case 'pistachio':
      return {
        primary: '#2D5F39',     // Forest Sage
        secondary: '#94C475',   // Pistachio Mint
        accent: '#73AA43',      // Lime Matcha
        sparkle: '#A7F3D0',     // Green Mint Sparkle
        name: 'Pistachio Mint 🍃'
      };
    case 'espresso':
      return {
        primary: '#2B231F',     // Espresso Dark Cocoa
        secondary: '#DDA15E',   // Warm Caramel Macchiato
        accent: '#E6CCB2',      // Milky Cream Foam
        sparkle: '#FDE68A',     // Golden Latte Sparkle
        name: 'Midnight Espresso ☕'
      };
    case 'golden_sprinkle':
      return {
        primary: '#FF3E6C',     // Vivid Ruby Pink
        secondary: '#D4AF37',   // Glitter Gold
        accent: '#00F0FF',      // Electric Cyan
        sparkle: '#39FF14',     // Neon Lime Green
        name: 'Golden Sprinkle ✨'
      };
    case 'classic':
    default:
      return {
        primary: '#801832',     // Royal Plum accent
        secondary: '#DCAE9E',   // Rose Gold / Honey
        accent: '#801832',      // Classic accent
        sparkle: '#FCD34D',     // Golden Honey Sparkle
        name: 'Classic Honey 🍯'
      };
  }
};

// Render gorgeous vector bakes (patisseries) and sparkling "Patashe" drops
const renderSweetVector = (type: number, colors: ReturnType<typeof getThemePalette>) => {
  const shapesCount = 5;
  switch (type % shapesCount) {
    case 0: // Traditional Patashe (Faceted crystalline sugar star drop)
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full p-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sweet outer glow */}
          <path d="M20 2 L25 15 L38 20 L25 25 L20 38 L15 25 L2 20 L15 15 Z" fill={colors.accent} />
          {/* Inner crystal facet */}
          <path d="M20 7 L23 17 L33 20 L23 23 L20 33 L17 23 L7 20 L17 17 Z" fill="#FFFFFF" opacity="0.65" />
          {/* Inner sweet core */}
          <circle cx="20" cy="20" r="3.5" fill={colors.secondary} />
          <circle cx="20" cy="20" r="1.5" fill="#FFFFFF" />
        </svg>
      );
    case 1: // French Macaron
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top smooth cookie cap */}
          <path d="M 6 18 C 6 11, 34 11, 34 18 C 34 20, 6 20, 6 18 Z" fill={colors.primary} />
          <path d="M 10 14 C 15 12, 25 12, 30 14" stroke="#FFFFFF" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
          {/* Cream filling layer */}
          <rect x="8" y="19" width="24" height="3" rx="1" fill={colors.secondary} />
          <rect x="11" y="20" width="18" height="1" fill="#FFFFFF" opacity="0.9" />
          {/* Bottom cookie cap */}
          <path d="M 6 22 C 6 20, 34 20, 34 22 C 34 29, 6 29, 6 22 Z" fill={colors.primary} />
        </svg>
      );
    case 2: // Glazed Bakery Donut
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="14" fill={colors.secondary} stroke={colors.primary} strokeWidth="1.5" />
          {/* Sweet theme glaze drip */}
          <path d="M 9 15 C 11 11, 29 11, 31 15 C 34 21, 29 31, 20 31 C 11 31, 6 21, 9 15 Z" fill={colors.primary} opacity="0.85" />
          {/* Hole */}
          <circle cx="20" cy="20" r="4.5" fill="#FFFFFF" stroke={colors.primary} strokeWidth="1" />
          {/* Custom confectionery sprinkles */}
          <line x1="12" y1="12" x2="15" y2="10" stroke={colors.sparkle} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="25" y1="11" x2="28" y2="13" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="13" y1="26" x2="16" y2="28" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="27" y1="24" x2="24" y2="26" stroke={colors.sparkle} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 3: // Fluffy Mini Muffin
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Pleated Muffin Cup Liner */}
          <path d="M 11 23 L 14 34 Q 15 36 17 36 L 23 36 Q 25 36 26 34 L 29 23 Z" fill={colors.primary} />
          {/* Liner pleat lines */}
          <line x1="16" y1="23" x2="18" y2="36" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.3" />
          <line x1="20" y1="23" x2="20" y2="36" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.3" />
          <line x1="24" y1="23" x2="22" y2="36" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.3" />
          {/* Gourmet sponge muffin top */}
          <path d="M 9 23 C 7 23, 9 16, 15 16 C 14 13, 20 9, 25 11 C 29 9, 32 13, 30 18 C 33 19, 33 23, 31 23 Z" fill={colors.secondary} stroke={colors.primary} strokeWidth="1" />
          {/* Golden sweet bulb on top */}
          <circle cx="20" cy="11" r="3" fill={colors.sparkle} />
          <path d="M 20 8 C 20 5, 23 4, 25 3" stroke={colors.primary} strokeWidth="0.8" strokeLinecap="round" />
        </svg>
      );
    case 4: // Twinkling Magic Sparkler Star
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full p-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 20 2 L 23 15 L 35 12 L 26 21 L 32 32 L 20 24 L 8 32 L 14 21 L 5 12 L 17 15 Z" fill={colors.sparkle} />
          <circle cx="20" cy="20" r="4.5" fill="#FFFFFF" />
          <circle cx="20" cy="20" r="2" fill={colors.primary} />
        </svg>
      );
    default:
      return null;
  }
};

export default function CursorPhotoTrail({ theme = 'classic' }: CursorPhotoTrailProps) {
  const [items, setItems] = useState<TrailItem[]>([]);
  const lastPosition = useRef({ x: 0, y: 0 });
  const itemIndexRef = useRef(0);
  const [isEnabled, setIsEnabled] = useState(true);

  const colors = getThemePalette(theme);

  useEffect(() => {
    // Read local trail preferences
    const saved = localStorage.getItem('muffinns_photo_trail');
    if (saved !== null) {
      setIsEnabled(saved === 'true');
    }
  }, []);

  const toggleTrail = () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    localStorage.setItem('muffinns_photo_trail', String(nextState));
  };

  useEffect(() => {
    if (!isEnabled) {
      setItems([]);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const dx = clientX - lastPosition.current.x;
      const dy = clientY - lastPosition.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only spawn elements when moving the cursor at least 45px (responsive & satisfying spacing)
      if (distance > 45) {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const rotation = Math.random() * 32 - 16; // Random tilt
        const scale = 0.8 + Math.random() * 0.45;  // Satisfying size dynamics
        const size = Math.random() * 8 + 32;       // Size varies between 32px and 40px

        const newItem: TrailItem = {
          id,
          x: clientX,
          y: clientY,
          type: itemIndexRef.current,
          rotation,
          scale,
          size
        };

        itemIndexRef.current += 1;

        // Keep at most 18 sparkling items in history to remain extremely lightweight
        setItems((prev) => [...prev.slice(-18), newItem]);
        lastPosition.current = { x: clientX, y: clientY };

        // Clean up this element after 900ms (fast, snappy trail)
        setTimeout(() => {
          setItems((prev) => prev.filter((it) => it.id !== id));
        }, 900);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isEnabled]);

  return (
    <>
      {/* Floating Control Toggle Button in bottom-left */}
      <div className="fixed bottom-24 left-4 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTrail}
          style={{ borderColor: colors.primary + '30' }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-xl backdrop-blur-md border cursor-pointer select-none transition-all ${
            isEnabled 
              ? 'bg-brand-sugar/95 text-brand-chocolate' 
              : 'bg-brand-chocolate/95 text-brand-cream border-transparent'
          }`}
        >
          <span 
            className="w-2 h-2 rounded-full animate-pulse" 
            style={{ backgroundColor: isEnabled ? colors.sparkle : '#9CA3AF' }} 
          />
          <span>✨ Trailing: {isEnabled ? `Patashe ✨` : 'OFF'}</span>
        </motion.button>
      </div>

      {/* Render Floating Trail Vector Delights with high-precision Framer Motion */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        <AnimatePresence>
          {items.map((item, itemIdx) => (
            <motion.div
              key={`trail-item-${item.id}`}
              initial={{ 
                opacity: 0, 
                scale: 0.2, 
                x: item.x - item.size / 2, 
                y: item.y - item.size / 2, 
                rotate: item.rotation - 20 
              }}
              animate={{ 
                opacity: [0, 1, 1, 0.7, 0], // Quick entry, steady glide, soft fade-out
                scale: item.scale, 
                x: item.x - item.size / 2, 
                y: item.y - item.size / 2 - 20, // Float upward slowly
                rotate: item.rotation 
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.1, 
                y: item.y - item.size / 2 - 60, // Rapid drift upward on dismiss
                rotate: item.rotation * 2 
              }}
              transition={{ 
                opacity: { type: 'tween', ease: 'easeInOut', duration: 0.9 },
                default: { type: 'spring', stiffness: 120, damping: 14 }
              }}
              style={{ 
                width: item.size, 
                height: item.size,
                filter: `drop-shadow(0 4px 10px ${colors.primary}25)`
              }}
              className="absolute pointer-events-none z-40"
            >
              {renderSweetVector(item.type, colors)}
              
              {/* Little sparkling star tail behind each sweet */}
              {theme === 'golden_sprinkle' ? (
                <>
                  <motion.span 
                    animate={{ scale: [1, 2, 0], opacity: [0.8, 1, 0], y: [0, 12, 24], x: [-6, -12, -18] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="absolute -bottom-1 left-1/2 block w-1 h-1 rounded-full"
                    style={{ backgroundColor: '#FF3E6C', filter: 'drop-shadow(0 0 4px #FF3E6C)' }}
                  />
                  <motion.span 
                    animate={{ scale: [1.2, 2.2, 0], opacity: [0.9, 1, 0], y: [0, 18, 36], x: [0, 0, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 block w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#D4AF37', filter: 'drop-shadow(0 0 5px #D4AF37)' }}
                  />
                  <motion.span 
                    animate={{ scale: [1, 2, 0], opacity: [0.8, 1, 0], y: [0, 12, 24], x: [6, 12, 18] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                    className="absolute -bottom-1 left-1/2 block w-1 h-1 rounded-full"
                    style={{ backgroundColor: '#00F0FF', filter: 'drop-shadow(0 0 4px #00F0FF)' }}
                  />
                </>
              ) : (
                <motion.span 
                  animate={{ 
                    scale: [1, 1.8, 0], 
                    opacity: [0.8, 1, 0],
                    y: [0, 15, 30] 
                  }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 block w-1 h-1 rounded-full"
                  style={{ backgroundColor: colors.sparkle }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
