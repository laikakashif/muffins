import React from 'react';
import { motion } from 'motion/react';

interface MuffinnsLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function MuffinnsLogo({ className = '', size = 52, animated = true }: MuffinnsLogoProps) {
  // SVG proportions: 195 width, 125 height.
  // Left side: Sparrow holding flowers in its beak.
  // Right side: Muffinns / Patashe badge.
  const width = size * (195 / 125);
  const height = size;

  return (
    <motion.svg 
      width={width} 
      height={height} 
      viewBox="0 0 195 125" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      initial={animated ? { scale: 0.9, opacity: 0 } : false}
      animate={animated ? { scale: 1, opacity: 1 } : false}
      transition={{ type: 'spring', stiffness: 120, damping: 14 }}
    >
      {/* ================= LEFT SIDE: SPARROW HOLDING FLOWERS ================= */}
      
      {/* FLOWERS & STEM HELD IN BEAK */}
      <g transform="translate(10, 52)">
        {/* Curved stem extending from beak (at x=40, y=14) down and curving left */}
        <path 
          d="M 32 12 C 26 14, 18 18, 12 25 C 8 30, 6 36, 4 42" 
          stroke="#5C4033" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
        />

        {/* Stem leaves */}
        <path d="M 22 17 Q 17 12 21 10 C 24 11 25 15 22 17 Z" fill="#6B8E23" />
        <path d="M 16 23 Q 12 20 12 26 C 15 27 18 25 16 23 Z" fill="#4B6B22" />
        <path d="M 10 32 Q 4 30 7 36 C 11 36 12 33 10 32 Z" fill="#6B8E23" />

        {/* Flower 1 - Vibrant Red/Pink Blossom held at end of stem */}
        <g transform="translate(4, 42)">
          {/* Petals */}
          <circle cx="-4" cy="0" r="4.5" fill="#E63946" opacity="0.9" />
          <circle cx="4" cy="0" r="4.5" fill="#E63946" opacity="0.9" />
          <circle cx="0" cy="-4" r="4.5" fill="#FF4D6D" opacity="0.9" />
          <circle cx="0" cy="4" r="4.5" fill="#C9184A" opacity="0.9" />
          <circle cx="-3" cy="-3" r="4" fill="#FF758F" opacity="0.9" />
          <circle cx="3" cy="-3" r="4" fill="#FF758F" opacity="0.9" />
          <circle cx="-3" cy="3" r="4" fill="#D80032" opacity="0.9" />
          <circle cx="3" cy="3" r="4" fill="#D80032" opacity="0.9" />
          {/* Golden Center */}
          <circle cx="0" cy="0" r="3" fill="#FFB703" />
          <circle cx="0" cy="0" r="1.5" fill="#FB8500" />
        </g>

        {/* Flower 2 - Smaller Blossom along stem */}
        <g transform="translate(14, 26)">
          <circle cx="-3" cy="0" r="3.5" fill="#FF4D6D" />
          <circle cx="3" cy="0" r="3.5" fill="#FF4D6D" />
          <circle cx="0" cy="-3" r="3.5" fill="#FF758F" />
          <circle cx="0" cy="3" r="3.5" fill="#C9184A" />
          <circle cx="0" cy="0" r="2" fill="#FFD166" />
        </g>

        {/* Flower 3 - Small Bud near beak */}
        <g transform="translate(25, 18)">
          <path d="M 0 0 C -3 -3, -4 -6, 0 -8 C 4 -6, 3 -3, 0 0 Z" fill="#FF4D6D" />
          <path d="M -2 1 C -1 4, 1 4, 2 1 Z" fill="#6B8E23" />
        </g>
      </g>

      {/* CHARMING BEAUTIFUL HOUSE SPARROW */}
      <g>
        {/* Back Wing (behind body - animating gently) */}
        <motion.path 
          d="M 52 52 C 58 36, 68 26, 73 30 C 76 34, 66 48, 56 58 Z" 
          fill="url(#sparrowBackWingGrad)" 
          animate={animated ? { 
            rotate: [0, -8, 0], 
            transformOrigin: "52px 52px" 
          } : {}}
          transition={animated ? { 
            repeat: Infinity, 
            duration: 0.35, 
            ease: "easeInOut" 
          } : {}}
        />

        {/* Sparrow Body - Soft plump belly & back */}
        {/* Back (Purple to Emerald Green Gradient) */}
        <path 
          d="M 40 58 C 46 54, 56 50, 66 52 C 74 54, 78 60, 72 68 C 65 74, 52 74, 40 68 Z" 
          fill="url(#sparrowBackGrad)" 
          filter="drop-shadow(0px 1px 2px rgba(88,28,135,0.3))"
        />

        {/* Plump Belly (Soft Glowing Lavender & Mint Pearl) */}
        <path 
          d="M 42 62 C 48 66, 56 70, 66 67 C 72 65, 70 69, 62 72 C 52 74, 44 71, 42 62 Z" 
          fill="url(#sparrowBellyGrad)" 
        />

        {/* Wing Feathers Pattern (Iridescent Purple, Violet & Emerald) */}
        <path 
          d="M 50 56 C 58 52, 68 54, 72 64 C 68 67, 58 66, 50 56 Z" 
          fill="url(#sparrowWingGrad)" 
        />
        {/* Feather wing bars (Mint / Lavender stripes on wing) */}
        <path d="M 54 58 L 62 60" stroke="url(#sparrowBarGrad)" strokeWidth="2" strokeLinecap="round" />
        <path d="M 52 61 L 60 63" stroke="#E9D5FF" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M 51 64 L 57 65.5" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />

        {/* Tail Feathers (Fanned with purple & emerald layers) */}
        <path 
          d="M 70 66 C 78 72, 85 77, 88 79 C 89 80, 86 82, 81 80 C 76 77, 70 71, 68 67 Z" 
          fill="url(#sparrowTail1Grad)" 
        />
        <path 
          d="M 72 68 C 79 74, 86 80, 87 81 C 86 82, 82 81, 78 78 C 74 74, 70 70, 69 68 Z" 
          fill="url(#sparrowTail2Grad)" 
        />

        {/* Sparrow Head */}
        {/* Crown (Vibrant Purple & Emerald) */}
        <path d="M 41 58 C 38 54, 38 48, 43 44 C 48 40, 54 42, 55 48 C 56 52, 50 58, 41 58 Z" fill="url(#sparrowCrownGrad)" />
        {/* Cheeks & Throat (Soft Pearl Lavender with Violet Blush) */}
        <path d="M 39 53 C 38 50, 42 47, 46 47 C 49 47, 50 51, 47 55 C 44 57, 40 56, 39 53 Z" fill="url(#sparrowCheekGrad)" />
        {/* Soft Blush Glow on Cheek */}
        <circle cx="47" cy="51" r="2.5" fill="#E879F9" opacity="0.4" />
        
        {/* Dark Throat Bib (Deep Indigo Chin) */}
        <path d="M 39 56 C 37 58, 42 62, 45 61 C 44 58, 41 56, 39 56 Z" fill="#2E1065" />

        {/* Sparrow Eye (Deep Onyx with Dual Emerald & White Catchlights) */}
        <circle cx="45" cy="48" r="2.2" fill="#180C04" />
        <circle cx="44.2" cy="47.2" r="0.9" fill="#FFFFFF" />
        <circle cx="45.6" cy="48.8" r="0.4" fill="#A7F3D0" />

        {/* Short Stout Triangular Beak holding the stem */}
        {/* Upper Beak */}
        <path d="M 40 52 L 31 54 L 39 56 Z" fill="url(#sparrowBeakTopGrad)" />
        {/* Lower Beak */}
        <path d="M 39 56 L 32 55 L 39 58 Z" fill="url(#sparrowBeakBotGrad)" />

        {/* Front Wing (Vibrant Purple to Emerald - Animating gently) */}
        <motion.path 
          d="M 48 55 C 48 38, 52 26, 57 28 C 61 30, 55 46, 52 56 Z" 
          fill="url(#sparrowFrontWingGrad)" 
          filter="drop-shadow(0px 2px 3px rgba(88,28,135,0.35))"
          animate={animated ? { 
            rotate: [0, 10, 0], 
            transformOrigin: "48px 55px" 
          } : {}}
          transition={animated ? { 
            repeat: Infinity, 
            duration: 0.35, 
            ease: "easeInOut" 
          } : {}}
        />
        {/* Front wing golden highlights */}
        <path d="M 50 48 L 54 35" stroke="#FBBF24" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M 52 49 L 55 38" stroke="#FDE68A" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      </g>


      {/* ================= RIGHT SIDE: OFFICIAL BADGE ================= */}
      
      {/* 1. Outer Frame: Beautiful gold/beige background border */}
      <rect x="85" y="8" width="102" height="108" rx="3" fill="#FDF7EA" stroke="#D3B888" strokeWidth="1.2" />

      {/* 2. Red Main Backdrop Square */}
      <rect x="88" y="11" width="96" height="102" rx="2" fill="#D32F2F" />

      {/* 3. Gold Corner Star Decals inside the Red square */}
      <g transform="translate(93, 16)">
        <circle cx="0" cy="0" r="1.5" fill="#FDF7EA" />
        <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="#FDF7EA" strokeWidth="0.6" />
      </g>
      <g transform="translate(179, 16)">
        <circle cx="0" cy="0" r="1.5" fill="#FDF7EA" />
        <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="#FDF7EA" strokeWidth="0.6" />
      </g>
      <g transform="translate(93, 108)">
        <circle cx="0" cy="0" r="1.5" fill="#FDF7EA" />
        <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="#FDF7EA" strokeWidth="0.6" />
      </g>
      <g transform="translate(179, 108)">
        <circle cx="0" cy="0" r="1.5" fill="#FDF7EA" />
        <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="#FDF7EA" strokeWidth="0.6" />
      </g>

      <path d="M 90 24 L 97 17" stroke="#FFF" strokeWidth="0.8" opacity="0.4" />
      <path d="M 182 24 L 175 17" stroke="#FFF" strokeWidth="0.8" opacity="0.4" />

      {/* 4. Turquoise Inner Arch Panel */}
      <path 
        d="M 94 105 L 94 54 A 42 42 0 0 1 178 54 L 178 105 Z" 
        fill="#FFFDF7" 
        stroke="#00B5B5" 
        strokeWidth="3.2" 
        strokeLinejoin="round"
      />
      <path 
        d="M 94 105 L 94 54 A 42 42 0 0 1 178 54 L 178 105 Z" 
        stroke="#3D2213" 
        strokeWidth="0.8" 
        fill="none"
      />

      {/* 5. Urdu Calligraphy: پتاشے (Patashe) */}
      <g transform="translate(136, 46)">
        <path 
          d="M 21 -3 C 12 -3, -15 -3, -24 -2 C -29 -1.5, -31 -0.5, -29 1 C -26 2.5, -12 2.5, 3 2.5 C 15 2.5, 26 1.2, 26 -0.5 C 26 -2.2, 23 -3, 21 -3 Z" 
          fill="#1C1816" 
        />
        
        <path 
          d="M 17 -10 C 15 -17, 9 -19, 5 -17 C 1 -15, -1 -11, 1 -7" 
          stroke="#1C1816" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          fill="none" 
        />
        <path 
          d="M 2 -6 Q -5 -13 -11 -6" 
          stroke="#1C1816" 
          strokeWidth="3.2" 
          strokeLinecap="round" 
          fill="none" 
        />
        <path 
          d="M -5 -4 L -7 -18 C -7 -19.5, -9 -19.5, -9 -18 L -11 -4" 
          stroke="#1C1816" 
          strokeWidth="2.8" 
          strokeLinecap="round" 
          fill="none" 
        />
        
        {/* Pe Dots */}
        <g transform="translate(-16, 5)">
          <rect x="-2" y="-2" width="2.4" height="2.4" transform="rotate(45)" fill="#1C1816" />
          <rect x="1.5" y="-2" width="2.4" height="2.4" transform="rotate(45)" fill="#1C1816" />
          <rect x="-0.2" y="1.5" width="2.4" height="2.4" transform="rotate(45)" fill="#1C1816" />
        </g>
        
        {/* Te Dots */}
        <g transform="translate(10, -21)">
          <rect x="-1.8" y="-1" width="2.5" height="2.5" transform="rotate(45)" fill="#1C1816" />
          <rect x="1.8" y="-1" width="2.5" height="2.5" transform="rotate(45)" fill="#1C1816" />
        </g>
        
        {/* Shin Dots */}
        <g transform="translate(-2, -23)">
          <rect x="-2" y="-2" width="2.3" height="2.3" transform="rotate(45)" fill="#1C1816" />
          <rect x="1.5" y="-2" width="2.3" height="2.3" transform="rotate(45)" fill="#1C1816" />
          <rect x="-0.2" y="-5" width="2.3" height="2.3" transform="rotate(45)" fill="#1C1816" />
        </g>

        <g transform="translate(-30, -11)">
          <circle cx="0" cy="0" r="2.8" stroke="#1C1816" strokeWidth="0.6" />
          <text x="0" y="1" fontSize="3" fontFamily="sans-serif" fontWeight="bold" fill="#1C1816" textAnchor="middle">R</text>
        </g>
      </g>


      {/* ================= 6. MUFFINNS TEXT & CENTRAL FLOWER/POT ================= */}
      
      <text 
        x="128" 
        y="80" 
        fill="#141110" 
        fontSize="14" 
        fontFamily="'Playfair Display', Georgia, serif" 
        fontWeight="900" 
        letterSpacing="-0.3"
        textAnchor="end"
      >
        MUFF
      </text>

      {/* Styled flower-pot / cupcake wrapper "I" in MUFFINNS */}
      <g transform="translate(131, 63)">
        <path d="M 2 16 L 1 12 L 9 12 L 8 16 Z" fill="#D32F2F" stroke="#141110" strokeWidth="1" strokeLinejoin="round" />
        <line x1="3.5" y1="12" x2="4.5" y2="16" stroke="#141110" strokeWidth="0.6" />
        <line x1="6.5" y1="12" x2="5.5" y2="16" stroke="#141110" strokeWidth="0.6" />
        
        <path d="M 5 12 Q 1 7 2 3 C 2 6 4 9 5 12" fill="#758A60" stroke="#141110" strokeWidth="0.8" />
        <path d="M 5 12 Q 9 7 8 3 C 8 6 6 9 5 12" fill="#5F744A" stroke="#141110" strokeWidth="0.8" />
        <line x1="5" y1="12" x2="5" y2="1" stroke="#141110" strokeWidth="1" />
        <circle cx="5" cy="1" r="2.2" fill="#F1C40F" stroke="#141110" strokeWidth="0.8" />
      </g>

      <text 
        x="144" 
        y="80" 
        fill="#141110" 
        fontSize="14" 
        fontFamily="'Playfair Display', Georgia, serif" 
        fontWeight="900" 
        letterSpacing="-0.3"
        textAnchor="start"
      >
        NNS
      </text>

      <g transform="translate(171, 70)">
        <circle cx="0" cy="0" r="2.2" stroke="#141110" strokeWidth="0.5" />
        <text x="0" y="0.8" fontSize="2.4" fontFamily="sans-serif" fontWeight="bold" fill="#141110" textAnchor="middle">R</text>
      </g>


      {/* ================= 7. SWEETS & BAKERS TEXT ================= */}
      <text 
        x="136" 
        y="93" 
        fill="#1C1816" 
        fontSize="6.8" 
        fontFamily="sans-serif" 
        fontWeight="900" 
        letterSpacing="1.1" 
        textAnchor="middle"
      >
        SWEETS & BAKERS
      </text>


      {/* ================= SVG DEFINITIONS (GRADIENTS etc) ================= */}
      <defs>
        {/* Sparrow Body Back Gradient (Purple to Green) */}
        <linearGradient id="sparrowBackGrad" x1="40" y1="58" x2="74" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#581C87" />
          <stop offset="50%" stopColor="#7E22CE" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Back Wing Gradient */}
        <linearGradient id="sparrowBackWingGrad" x1="52" y1="30" x2="68" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B0764" />
          <stop offset="60%" stopColor="#6B21A8" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Plump Glowing Belly Gradient */}
        <linearGradient id="sparrowBellyGrad" x1="42" y1="62" x2="66" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5F3FF" />
          <stop offset="40%" stopColor="#D1FAE5" />
          <stop offset="85%" stopColor="#A7F3D0" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>

        {/* Main Wing Feathers Gradient */}
        <linearGradient id="sparrowWingGrad" x1="50" y1="56" x2="72" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B0764" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Wing Feather Bar Stripe Gradient */}
        <linearGradient id="sparrowBarGrad" x1="54" y1="58" x2="62" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>

        {/* Tail Feathers Gradients */}
        <linearGradient id="sparrowTail1Grad" x1="70" y1="66" x2="88" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B0764" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="sparrowTail2Grad" x1="72" y1="68" x2="87" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#581C87" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Sparrow Crown (Head Top) Gradient */}
        <linearGradient id="sparrowCrownGrad" x1="40" y1="42" x2="55" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6B21A8" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Soft Cheek Pearl Gradient */}
        <linearGradient id="sparrowCheekGrad" x1="39" y1="47" x2="48" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FAF5FF" />
          <stop offset="70%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#D1FAE5" />
        </linearGradient>

        {/* Beak Gradients */}
        <linearGradient id="sparrowBeakTopGrad" x1="31" y1="52" x2="40" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4C1D95" />
          <stop offset="50%" stopColor="#2E1065" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
        <linearGradient id="sparrowBeakBotGrad" x1="32" y1="55" x2="39" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2E1065" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Front Wing Animating Gradient */}
        <linearGradient id="sparrowFrontWingGrad" x1="48" y1="28" x2="57" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7E22CE" />
          <stop offset="40%" stopColor="#A855F7" />
          <stop offset="80%" stopColor="#059669" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

