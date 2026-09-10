import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Phone, Mail, MapPin, Clock, Menu, X, Sparkles, MessageSquare, 
  HelpCircle, ShieldCheck, Heart, ChefHat, CheckCircle2, ChevronRight, Copy, Palette,
  Instagram, Facebook, QrCode, Smartphone, Check, Landmark, Loader2, Star, Download, Printer,
  Mic, MicOff
} from 'lucide-react';
import { generateReceiptPDF } from './utils/pdfReceipt';

// Components
import Hero from './components/Hero';
import MenuSection from './components/MenuSection';
import CartDrawer from './components/CartDrawer';
import AIChat from './components/AIChat';
import OrderTracker from './components/OrderTracker';
import AdminDashboard from './components/AdminDashboard';
import NotificationManager from './components/NotificationManager';
import CursorPhotoTrail from './components/CursorPhotoTrail';
import BranchLocations from './components/BranchLocations';
import FeaturedVideoReel from './components/FeaturedVideoReel';
import AmbientBakerySound from './components/AmbientBakerySound';
import QRPaymentModal from './components/QRPaymentModal';
import MuffinnsQRCodeCard from './components/MuffinnsQRCodeCard';
import KitchenReceipt from './components/KitchenReceipt';
import NavSearchBar from './components/NavSearchBar';
import OfflineSyncBanner from './components/OfflineSyncBanner';
import TopQuickAccessBar from './components/TopQuickAccessBar';
import KitchenTimeModal from './components/KitchenTimeModal';
import ThemeSelectorModal from './components/ThemeSelectorModal';

import { CartItem, Order } from './types';
import MuffinnsLogo from './components/MuffinnsLogo';
import { initFirestoreMenuSync } from './utils/menuStorage';
import { initOfflineOrderAutoSync } from './utils/offlineOrderDB';
import { addInquiryToFirestore } from './firebase/config';

const TikTokIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 24 24" 
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.32a6.33 6.33 0 0 0-1-.08 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.28 8.28 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.01-.1z" />
  </svg>
);

export default function App() {
  const [activeView, setActiveView] = useState<'home' | 'menu' | 'tracker' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      if (p.startsWith('/admin') || p.startsWith('/bwp-panel-7781')) {
        return 'admin';
      }
    }
    return 'home';
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Theme configuration states
  const [theme, setTheme] = useState<'classic' | 'velvet' | 'pistachio' | 'espresso' | 'cozy_brown' | 'golden_sprinkle' | 'muffin_galaxy' | 'muffin_oasis' | 'muffin_party' | 'midnight_muffins' | 'sprinkle_noir'>('muffin_galaxy');
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isKitchenTimeOpen, setIsKitchenTimeOpen] = useState(false);
  const [isStandaloneQrOpen, setIsStandaloneQrOpen] = useState(false);
  const [isInlineQrClosed, setIsInlineQrClosed] = useState(false);
  
  // Theme Transition Wipe effect state & preloading CSS variables
  const isInitialMountRef = useRef(true);
  const [themeTransition, setThemeTransition] = useState<{ label: string; themeKey: string } | null>(null);

  // Synchronize body class and preload theme CSS variables for seamless switching
  useLayoutEffect(() => {
    const root = document.documentElement;
    // Remove stale theme classes on html/body
    root.classList.forEach((cls) => {
      if (cls.startsWith('theme-')) {
        root.classList.remove(cls);
      }
    });
    root.classList.add(`theme-${theme}`);

    // Pre-load theme specific CSS variable overrides for instant smooth rendering
    const THEME_VARIABLE_MAP: Record<string, Record<string, string>> = {
      sprinkle_noir: {
        '--color-brand-cream': '#141423',
        '--color-brand-sugar': '#1A1A2E',
        '--color-brand-caramel': '#EAB543',
        '--color-brand-honey': '#EAB543',
        '--color-brand-gold': '#C4C4C4',
        '--color-brand-chocolate': '#F5F5F7',
        '--color-brand-marshmallow': '#22223B',
        '--color-brand-glaze': 'rgba(234, 181, 67, 0.2)'
      },
      midnight_muffins: {
        '--color-brand-cream': '#1A252F',
        '--color-brand-sugar': '#2C3E50',
        '--color-brand-caramel': '#E67E22',
        '--color-brand-honey': '#F4A261',
        '--color-brand-gold': '#E74C3C',
        '--color-brand-chocolate': '#ECF0F1',
        '--color-brand-marshmallow': '#213140',
        '--color-brand-glaze': 'rgba(230, 126, 34, 0.25)'
      },
      muffin_party: {
        '--color-brand-cream': '#FFFDF9',
        '--color-brand-sugar': '#FFFFFF',
        '--color-brand-caramel': '#FF9F1C',
        '--color-brand-honey': '#2BAE66',
        '--color-brand-gold': '#F72585',
        '--color-brand-chocolate': '#1D2A44',
        '--color-brand-marshmallow': '#FFF8EE',
        '--color-brand-glaze': 'rgba(255, 159, 28, 0.2)'
      },
      muffin_oasis: {
        '--color-brand-cream': '#FFFDFB',
        '--color-brand-sugar': '#FFFFFF',
        '--color-brand-caramel': '#FF6B6B',
        '--color-brand-honey': '#4ECDC4',
        '--color-brand-gold': '#FFE66D',
        '--color-brand-chocolate': '#2D3748',
        '--color-brand-marshmallow': '#F0FBF9',
        '--color-brand-glaze': 'rgba(255, 107, 107, 0.18)'
      },
      muffin_galaxy: {
        '--color-brand-cream': '#1A1423',
        '--color-brand-sugar': '#2A1B3D',
        '--color-brand-caramel': '#F4A261',
        '--color-brand-honey': '#E76F51',
        '--color-brand-gold': '#E9C46A',
        '--color-brand-chocolate': '#F8F9FA',
        '--color-brand-marshmallow': '#372254',
        '--color-brand-glaze': 'rgba(244, 162, 97, 0.22)'
      }
    };

    const vars = THEME_VARIABLE_MAP[theme];
    if (vars) {
      Object.entries(vars).forEach(([prop, value]) => {
        root.style.setProperty(prop, value);
      });
    }

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    const themeLabels: Record<string, string> = {
      sprinkle_noir: 'Sprinkle Noir ✨🖤',
      midnight_muffins: 'Midnight Muffins 🌙🍪',
      muffin_party: 'Muffin Party 🎈🍊',
      muffin_oasis: 'Muffin Oasis 🌴🍰',
      muffin_galaxy: 'Muffin Galaxy 🪐',
      classic: 'Royal Lahore Amber',
      velvet: 'Rich Velvet Red',
      pistachio: 'Pistachio Kulfi Green',
      espresso: 'Rich Espresso Dark',
      cozy_brown: 'Cozy Bakery Warm',
      golden_sprinkle: 'Golden Celebration Sprinkle'
    };

    setThemeTransition({
      label: themeLabels[theme] || theme,
      themeKey: theme
    });

    const timer = setTimeout(() => {
      setThemeTransition(null);
    }, 850);

    return () => clearTimeout(timer);
  }, [theme]);

  // Sync menu items & photos with Firestore DB backend
  useEffect(() => {
    initFirestoreMenuSync();
  }, []);
  
  // Tracked order states
  const [newlyPlacedOrder, setNewlyPlacedOrder] = useState<Order | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [selectedTrackerId, setSelectedTrackerId] = useState('');
  
  // Navigation Search Query State
  const [activeSearchQuery, setActiveSearchQuery] = useState('');

  // Trigger 'Celebrate!' confetti explosion effect when an order is newly placed
  // Listen and auto-sync offline orders stored in IndexedDB when internet reconnects
  useEffect(() => {
    const cleanupOfflineSync = initOfflineOrderAutoSync((syncedOrder) => {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 99999,
          colors: ['#10B981', '#34D399', '#059669', '#F59E0B']
        });
      } catch (e) {
        console.warn('Sync celebration animation error:', e);
      }
    });

    return () => {
      cleanupOfflineSync();
    };
  }, []);

  useEffect(() => {
    if (newlyPlacedOrder) {
      try {
        // Main center burst
        confetti({
          particleCount: 130,
          spread: 100,
          origin: { y: 0.55 },
          zIndex: 99999,
          colors: ['#D97706', '#F59E0B', '#EC4899', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444']
        });

        // Left and right side celebration cannons
        const timer1 = setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 65,
            origin: { x: 0.1, y: 0.65 },
            zIndex: 99999,
            colors: ['#F59E0B', '#EC4899', '#10B981', '#3B82F6', '#D97706']
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 65,
            origin: { x: 0.9, y: 0.65 },
            zIndex: 99999,
            colors: ['#F59E0B', '#EC4899', '#10B981', '#3B82F6', '#D97706']
          });
        }, 220);

        // Final shower explosion
        const timer2 = setTimeout(() => {
          confetti({
            particleCount: 60,
            spread: 120,
            origin: { y: 0.4 },
            zIndex: 99999,
            scalar: 1.15,
            colors: ['#F43F5E', '#10B981', '#F59E0B', '#8B5CF6']
          });
        }, 480);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      } catch (err) {
        console.warn('Celebrate confetti animation error:', err);
      }
    }
  }, [newlyPlacedOrder]);

  // Dialog QR Payment States
  const [copiedQrAccount, setCopiedQrAccount] = useState(false);
  const [isSimulatingDialogQr, setIsSimulatingDialogQr] = useState(false);
  const [isDialogQrSuccess, setIsDialogQrSuccess] = useState(false);
  const [dialogQrVerifiedRef, setDialogQrVerifiedRef] = useState<string | null>(null);

  const handleCopyQrAccount = () => {
    navigator.clipboard.writeText('3398787000005900');
    setCopiedQrAccount(true);
    setTimeout(() => setCopiedQrAccount(false), 2000);
  };

  const handleSimulateDialogQrPayment = async (orderId: string) => {
    setIsSimulatingDialogQr(true);
    setIsDialogQrSuccess(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 1600));
      const simulatedRef = `FBL-QR-${Math.floor(100000 + Math.random() * 900000)}`;
      const res = await fetch(`/api/orders/${orderId}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: simulatedRef })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsDialogQrSuccess(true);
        await new Promise(resolve => setTimeout(resolve, 1300));
        setDialogQrVerifiedRef(simulatedRef);
        setNewlyPlacedOrder(data.order);
      }
    } catch (e) {
      console.error('QR simulation error:', e);
    } finally {
      setIsSimulatingDialogQr(false);
      setIsDialogQrSuccess(false);
    }
  };

  // Inquiry Form states
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryRating, setInquiryRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Speech Dictation states for Feedback & Complaints Form
  const [isDictating, setIsDictating] = useState(false);
  const [dictationError, setDictationError] = useState<string | null>(null);
  const [dictationSupported, setDictationSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API browser availability
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setDictationSupported(false);
    }
  }, []);

  const handleToggleDictation = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setDictationError("Web Speech API is not supported in this browser environment. Please type your message manually.");
      setDictationSupported(false);
      return;
    }

    if (isDictating) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Stopping speech recognition:', e);
        }
      }
      setIsDictating(false);
      return;
    }

    setDictationError(null);

    // Optional microphone permission check via getUserMedia if supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the temporary track immediately after permission check
        stream.getTracks().forEach(track => track.stop());
      } catch (micErr: any) {
        console.warn('Microphone permission check warning:', micErr);
        if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
          setDictationError("Microphone permission denied. Please allow microphone access in your browser settings to use voice dictation.");
          setIsDictating(false);
          return;
        }
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // Keep track of text prior to start of current dictation session
      let initialText = inquiryMessage;

      recognition.onstart = () => {
        setIsDictating(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const spacePrefix = initialText && !initialText.endsWith(' ') ? ' ' : '';
        setInquiryMessage(initialText ? `${initialText}${spacePrefix}${transcript}` : transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied' || event.error === 'service-not-allowed') {
          setDictationError("Microphone access blocked or permission denied. Please grant microphone access in browser settings or type your message manually.");
        } else if (event.error === 'no-speech') {
          setDictationError("No speech detected. Please speak clearly into your microphone.");
        } else if (event.error === 'aborted') {
          // Dictation stopped by user or system
        } else {
          setDictationError(`Voice dictation issue (${event.error}). Please type your message manually.`);
        }
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      setDictationError("Microphone access permission required. Please enable microphone access or type manually.");
      setIsDictating(false);
    }
  };

  // Cart Handlers
  const handleAddToCart = (newCartItem: CartItem) => {
    setCart(prevCart => {
      // Check if item with same ID, selected size, and same notes already exists
      const existingIndex = prevCart.findIndex(item => 
        item.item.id === newCartItem.item.id && 
        item.selectedSize?.label === newCartItem.selectedSize?.label &&
        item.notes === newCartItem.notes
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += newCartItem.quantity;
        return updated;
      }
      return [...prevCart, newCartItem];
    });
  };

  const handleUpdateCartQuantity = (index: number, quantity: number) => {
    setCart(prevCart => {
      const updated = [...prevCart];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCart(prevCart => prevCart.filter((_, idx) => idx !== index));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleReorderAll = (itemsToReorder: CartItem[]) => {
    itemsToReorder.forEach(item => {
      handleAddToCart(item);
    });
    setIsCartOpen(true);
  };

  const handleOrderPlaced = (order: Order) => {
    setIsCartOpen(false);
    setNewlyPlacedOrder(order);
    
    // Save to tracked list so background polling can alert status changes
    try {
      const currentTracked = JSON.parse(localStorage.getItem('muffinns_tracked_orders') || '[]');
      if (!currentTracked.includes(order.id)) {
        currentTracked.unshift(order.id);
        localStorage.setItem('muffinns_tracked_orders', JSON.stringify(currentTracked));
      }
      
      // Save order snapshot to history array in localStorage
      const currentHistory: Order[] = JSON.parse(localStorage.getItem('muffinns_order_history') || '[]');
      const existingIdx = currentHistory.findIndex(o => o.id.toUpperCase() === order.id.toUpperCase());
      if (existingIdx > -1) {
        currentHistory[existingIdx] = order;
      } else {
        currentHistory.unshift(order);
      }
      localStorage.setItem('muffinns_order_history', JSON.stringify(currentHistory));

      // Save initial status to prevent false alarm on first load
      const currentStatuses = JSON.parse(localStorage.getItem('muffinns_order_statuses') || '{}');
      currentStatuses[order.id] = order.status;
      localStorage.setItem('muffinns_order_statuses', JSON.stringify(currentStatuses));
    } catch (e) {
      console.error('Error saving new order to localStorage tracking list:', e);
    }
  };

  const handleCopyInvoice = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  const handlePostInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryStatus(null);
    setInquirySubmitting(true);

    const payload = {
      name: inquiryName.trim(),
      email: inquiryEmail.trim(),
      phone: inquiryPhone.trim(),
      subject: inquirySubject.trim(),
      message: inquiryMessage.trim(),
      rating: inquiryRating
    };

    try {
      let recorded = false;
      try {
        const response = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            recorded = true;
          }
        }
      } catch (fetchErr) {
        // Local /api/inquiries unavailable (e.g. Netlify static hosting)
      }

      // If server wasn't reachable or returned non-200, record directly to Firestore
      if (!recorded) {
        await addInquiryToFirestore(payload);
        recorded = true;
      }

      if (recorded) {
        setInquiryStatus({
          type: 'success',
          text: `Thank you, ${inquiryName}! Your ${inquiryRating}-Star feedback has been recorded. Our management team at Muffinnscomplain@gmail.com has been notified.`
        });
        // Clear form
        setInquiryName('');
        setInquiryEmail('');
        setInquiryPhone('');
        setInquirySubject('');
        setInquiryMessage('');
        setInquiryRating(5);
        setHoverRating(0);
      } else {
        setInquiryStatus({ type: 'error', text: 'Failed to submit feedback.' });
      }
    } catch (err) {
      setInquiryStatus({ type: 'error', text: 'Connection issue. Please email Muffinnscomplain@gmail.com directly.' });
    } finally {
      setInquirySubmitting(false);
    }
  };

  // Quick navigate & smooth scroll helper
  const scrollToSection = (sectionId: string) => {
    if (activeView !== 'home') {
      setActiveView('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleNavigate = (view: 'menu' | 'chat' | 'tracker') => {
    if (view === 'menu') {
      scrollToSection('menu-section');
    } else if (view === 'chat') {
      setIsChatOpen(true);
    } else if (view === 'tracker') {
      setActiveView('tracker');
    }
  };

  const handleSearchNavigation = (query: string) => {
    setActiveSearchQuery(query);
    scrollToSection('menu-section');
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-brand-cream flex flex-col justify-between selection:bg-brand-caramel selection:text-brand-cream font-sans theme-${theme} relative`}>
      
      {/* Global Page-Wipe & Fade Overlay Effect on Theme Switch */}
      <AnimatePresence>
        {themeTransition && (
          <motion.div
            key={`theme-wipe-${themeTransition.themeKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden"
          >
            {/* Top curtain wiping down */}
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: ['-100%', '0%', '0%', '-100%'] }}
              transition={{ duration: 0.8, times: [0, 0.35, 0.65, 1], ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-brand-chocolate via-brand-chocolate to-amber-950 text-brand-cream border-b-2 border-brand-caramel/50 shadow-2xl"
            />
            
            {/* Bottom curtain wiping up */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: ['100%', '0%', '0%', '100%'] }}
              transition={{ duration: 0.8, times: [0, 0.35, 0.65, 1], ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-chocolate via-brand-chocolate to-amber-950 text-brand-cream border-t-2 border-brand-caramel/50 shadow-2xl"
            />

            {/* Glowing Center Aesthetic Badge */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: [0.7, 1.05, 1, 0.85], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.8, times: [0, 0.3, 0.7, 1] }}
              className="relative z-10 text-center space-y-2 p-6 px-8 rounded-3xl bg-brand-sugar/95 border-2 border-brand-caramel shadow-2xl text-brand-chocolate backdrop-blur-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-brand-caramel flex items-center justify-center mx-auto shadow-inner">
                <Palette className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-honey block">Switched Theme</span>
                <h3 className="font-serif font-black text-xl text-brand-chocolate tracking-tight">{themeTransition.label}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background golden & multicolor sprinkles shiny particles system for golden_sprinkle theme */}
      {theme === 'golden_sprinkle' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(25)].map((_, i) => {
            const isStar = i % 3 === 0;
            const size = isStar ? Math.random() * 8 + 12 : Math.random() * 4 + 8;
            const left = `${Math.random() * 100}%`;
            const colors = ['#D4AF37', '#FFC300', '#FF3E6C', '#00F0FF', '#39FF14'];
            const color = colors[i % colors.length];
            return (
              <motion.div
                key={`sprinkle-${i}`}
                initial={{ y: -50, opacity: 0, rotate: 0 }}
                animate={{ 
                  y: ['0vh', '100vh'],
                  x: [0, Math.random() * 100 - 50],
                  opacity: [0, 0.9, 0.9, 0],
                  rotate: [0, Math.random() * 360 + 180]
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  delay: Math.random() * 8,
                  ease: "linear"
                }}
                style={{
                  position: 'absolute',
                  left,
                  top: '-5%',
                  width: isStar ? size : 3,
                  height: isStar ? size : size * 2.5,
                  backgroundColor: isStar ? 'transparent' : color,
                  borderRadius: isStar ? 'none' : '4px',
                  filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.7))',
                }}
              >
                {isStar && (
                  <svg viewBox="0 0 24 24" fill={color} className="w-full h-full">
                    <path d="M12 2L15 9L22 10L17 15L19 22L12 18L5 22L7 15L2 10L9 9Z" />
                  </svg>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Muffin Party Floating Party Confetti & Flying Muffins Background */}
      {theme === 'muffin_party' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-10 left-1/4 w-[550px] h-[550px] bg-gradient-to-br from-[#FF9F1C]/20 via-[#F72585]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-5 right-5 w-[600px] h-[600px] bg-gradient-to-tr from-[#00BBF9]/20 via-[#2BAE66]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          {[...Array(28)].map((_, i) => {
            const emojis = ['🍊', '🎈', '🎉', '🧁', '💗', '💚', '💙', '✨', '😃'];
            const emoji = emojis[i % emojis.length];
            const left = `${(i * 3.7) % 100}%`;
            return (
              <motion.div
                key={`party-confetti-${i}`}
                initial={{ y: `${(i * 9) % 100}vh`, opacity: 0.35, rotate: 0 }}
                animate={{ 
                  y: [`${(i * 9) % 100}vh`, `${((i * 9) + 100) % 110}vh`],
                  x: [0, (i % 2 === 0 ? 35 : -35)],
                  rotate: [0, 180, 360],
                  scale: [0.9, 1.25, 0.9],
                  opacity: [0.35, 0.9, 0.35]
                }}
                transition={{
                  duration: 10 + (i % 6),
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  position: 'absolute',
                  left,
                  fontSize: i % 3 === 0 ? '22px' : '15px',
                  filter: 'drop-shadow(0 4px 10px rgba(255, 159, 28, 0.4))'
                }}
              >
                {emoji}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Muffin Oasis Floating Confetti Sprinkles Background */}
      {theme === 'muffin_oasis' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-[#FF6B6B]/15 via-[#4ECDC4]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-gradient-to-tr from-[#FFE66D]/20 via-[#FF6B6B]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          {[...Array(25)].map((_, i) => {
            const emojis = ['🎉', '🧁', '✨', '🍓', '🍬', '💛', '🌸'];
            const emoji = emojis[i % emojis.length];
            const left = `${(i * 4) % 100}%`;
            return (
              <motion.div
                key={`oasis-sprinkle-${i}`}
                initial={{ y: `${(i * 10) % 100}vh`, opacity: 0.3, rotate: 0 }}
                animate={{ 
                  y: [`${(i * 10) % 100}vh`, `${((i * 10) + 100) % 110}vh`],
                  x: [0, (i % 2 === 0 ? 25 : -25)],
                  rotate: [0, 180, 360],
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={{
                  duration: 12 + (i % 7),
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  position: 'absolute',
                  left,
                  fontSize: i % 3 === 0 ? '20px' : '14px',
                  filter: 'drop-shadow(0 2px 8px rgba(255, 107, 107, 0.3))'
                }}
              >
                {emoji}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cosmic Space Nebula & Orbiting Muffin Asteroids System for Muffin Galaxy theme */}
      {theme === 'muffin_galaxy' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {/* Ambient Cosmic Nebula Glow Clouds */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#F4A261]/20 via-[#E76F51]/15 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-gradient-to-tr from-[#2A1B3D]/80 via-[#E9C46A]/15 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none" />
          
          {/* Twinkling Cosmic Stars & Floating Muffin Asteroids */}
          {[...Array(30)].map((_, i) => {
            const isMuffin = i % 5 === 0;
            const isLargeStar = i % 2 === 0;
            const size = isMuffin ? 24 : isLargeStar ? 6 : 3;
            const left = `${(i * 3.3) % 100}%`;
            const colors = ['#F4A261', '#E76F51', '#E9C46A', '#FFF8F0', '#E9C46A'];
            const color = colors[i % colors.length];

            return (
              <motion.div
                key={`galaxy-star-${i}`}
                initial={{ y: `${(i * 12) % 100}vh`, opacity: 0.2 }}
                animate={{ 
                  y: [`${(i * 12) % 100}vh`, `${((i * 12) + 100) % 110}vh`],
                  x: [0, (i % 2 === 0 ? 30 : -30)],
                  opacity: [0.2, 0.9, 0.3],
                  scale: isMuffin ? [0.9, 1.15, 0.9] : [0.8, 1.3, 0.8]
                }}
                transition={{
                  duration: isMuffin ? 18 + i : 8 + (i % 5),
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  position: 'absolute',
                  left,
                  top: '0%',
                  width: size,
                  height: size,
                  filter: `drop-shadow(0 0 8px ${color})`,
                }}
              >
                {isMuffin ? (
                  <span className="text-lg leading-none select-none filter drop-shadow-[0_0_10px_rgba(244,162,97,0.8)]">
                    🧁
                  </span>
                ) : (
                  <div 
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* ================= TOP UTILITY & STATUS BAR (COLOUR THEMES, KITCHEN TIME, QUICK SECTIONS) ================= */}
      <TopQuickAccessBar
        currentTheme={theme}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenKitchenTimeModal={() => setIsKitchenTimeOpen(true)}
        onNavigateSection={(sectionId) => scrollToSection(sectionId)}
        onNavigateView={(view) => setActiveView(view)}
        onOpenQrPay={() => setIsStandaloneQrOpen(true)}
        activeView={activeView}
      />

      {/* ================= STICKY PROFESSIONAL HEADER ================= */}
      <header className="sticky top-0 z-30 w-full bg-brand-sugar/95 backdrop-blur-md border-b border-brand-caramel/10 transition-all shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo */}
          <button 
            onClick={() => setActiveView('home')} 
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group text-left focus:outline-none shrink-0"
          >
            <MuffinnsLogo size={38} className="sm:w-11 sm:h-11 group-hover:rotate-12 transition-transform duration-500 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-baseline gap-1 sm:gap-1.5 leading-none">
                <span className="font-serif font-black text-lg sm:text-2xl text-brand-chocolate tracking-tight">Muffinns</span>
                <span className="font-sans text-xs sm:text-sm font-black text-brand-caramel tracking-wide" dir="rtl" title="Patashay">پتاشے</span>
              </div>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-extrabold text-brand-honey block mt-0.5 truncate">Sweets & Bakers</span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-3.5 lg:gap-5 text-xs font-bold uppercase tracking-widest text-brand-chocolate/80 shrink-0">
            <button 
              onClick={() => scrollToSection('home-section')}
              className={`hover:text-brand-caramel transition-colors cursor-pointer whitespace-nowrap ${activeView === 'home' ? 'text-brand-caramel font-black' : ''}`}
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('menu-section')}
              className="hover:text-brand-caramel transition-colors cursor-pointer whitespace-nowrap"
            >
              Digital Menu
            </button>
            <button 
              onClick={() => scrollToSection('specialties-section')}
              className="hover:text-brand-caramel transition-colors cursor-pointer whitespace-nowrap"
            >
              Specialties
            </button>
            <button 
              onClick={() => scrollToSection('video-section')}
              className="hover:text-brand-caramel transition-colors cursor-pointer whitespace-nowrap hidden xl:inline-block"
            >
              Video Reel
            </button>
            <button 
              onClick={() => scrollToSection('branches-section')}
              className="hover:text-brand-caramel transition-colors cursor-pointer whitespace-nowrap"
            >
              Our Branches
            </button>
            <button 
              onClick={() => scrollToSection('complaints-section')}
              className="hover:text-brand-caramel transition-colors cursor-pointer whitespace-nowrap hidden lg:inline-block"
            >
              Feedback
            </button>
            <button 
              onClick={() => setActiveView('tracker')}
              className={`hover:text-brand-caramel transition-colors cursor-pointer whitespace-nowrap ${activeView === 'tracker' ? 'text-brand-caramel font-black' : ''}`}
            >
              Order Tracker
            </button>
            <button 
              onClick={() => setActiveView('admin')}
              className={`hover:text-brand-caramel transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${activeView === 'admin' ? 'text-brand-caramel font-black' : ''}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-honey shrink-0" />
              <span>Back-Office</span>
            </button>
          </nav>

          {/* Navigation Search Bar with localStorage Recent Searches */}
          <NavSearchBar 
            onSearch={handleSearchNavigation} 
            className="hidden lg:block w-40 xl:w-56" 
            placeholder="Search menu..." 
            isCompact={true}
          />

          {/* Right Action Node */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Social Media Links */}
            <div className="hidden lg:flex items-center gap-1.5">
              <a 
                href="https://www.instagram.com/patashay_muffins?igsh=dm54MmNycjdzaGJ0" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 transition-colors"
                title="Instagram @patashay_muffins"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://www.facebook.com/share/1JjDcPu8ca/" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors"
                title="Facebook Page"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://www.tiktok.com/@muffinns_sweetsbaker" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 hover:bg-black text-white border border-slate-700 transition-colors"
                title="TikTok @muffinns_sweetsbaker"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
            </div>

            {/* Direct QR Pay Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsStandaloneQrOpen(prev => !prev)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-black border border-amber-500/40 shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title="Toggle Faysal Bank QR Code Payment Modal"
            >
              <QrCode className="w-4 h-4 text-amber-950 shrink-0" />
              <span>QR Pay</span>
            </motion.button>

            {/* WhatsApp Contact badges */}
            <div className="hidden xl:flex items-center gap-1.5">
              <a 
                href="https://wa.me/923202587047" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-500/20 text-emerald-800 text-xs font-bold transition-all shadow-xs whitespace-nowrap"
                title="Chat with Muffinns on WhatsApp: 0320 2587047"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>0320 2587047</span>
              </a>
            </div>

            {/* Ambient Bakery Sound Toggle */}
            <div className="hidden sm:block">
              <AmbientBakerySound />
            </div>

            {/* Theme Selector Dropdown Widget */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsThemeOpen(!isThemeOpen)}
                className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl bg-brand-cream border border-brand-caramel/10 flex flex-col items-center justify-center relative cursor-pointer hover:border-brand-caramel/30 transition-all text-brand-chocolate focus:outline-none"
                title="Select Theme Palette"
                aria-label="Select Theme Palette"
              >
                <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full absolute top-1.5 right-1.5 border border-brand-sugar shadow-sm transition-all ${
                  theme === 'classic' ? 'bg-brand-honey' :
                  theme === 'velvet' ? 'bg-rose-500' :
                  theme === 'pistachio' ? 'bg-emerald-500' : 
                  theme === 'espresso' ? 'bg-amber-600' :
                  theme === 'cozy_brown' ? 'bg-amber-800' : 'bg-yellow-400 animate-bounce'
                }`} />
                <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>

              <AnimatePresence>
                {isThemeOpen && (
                  <motion.div
                    key="theme-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setIsThemeOpen(false)}
                  />
                )}
                {isThemeOpen && (
                  <motion.div
                    key="theme-dropdown-panel"
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-72 max-w-[calc(100vw-24px)] max-h-[80vh] overflow-y-auto bg-brand-sugar border border-brand-caramel/20 rounded-2xl shadow-2xl p-3.5 z-50 space-y-2 text-brand-chocolate scrollbar-thin scrollbar-thumb-brand-caramel/30"
                  >
                      <div className="px-2 pb-2.5 border-b border-brand-caramel/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-caramel">Select Bakery Palette</p>
                        <p className="text-[9px] text-brand-chocolate/60 font-medium">Instantly customizes your app</p>
                      </div>

                      {[
                        { id: 'muffin_galaxy', label: 'Muffin Galaxy 🪐', desc: 'Deep space purple & stardust muffin orange', dots: ['bg-[#2A1B3D]', 'bg-[#F4A261]', 'bg-[#E76F51]', 'bg-[#E9C46A]'] },
                        { id: 'sprinkle_noir', label: 'Sprinkle Noir ✨🖤', desc: 'Luxury dark blue, golden sprinkle ✨ & silver highlights', dots: ['bg-[#1A1A2E]', 'bg-[#EAB543]', 'bg-[#C4C4C4]', 'bg-[#E67E22]'] },
                        { id: 'midnight_muffins', label: 'Midnight Muffins 🌙🍪', desc: 'Moody midnight blue, warm orange & golden crumble glow', dots: ['bg-[#2C3E50]', 'bg-[#E67E22]', 'bg-[#F4A261]', 'bg-[#E74C3C]'] },
                        { id: 'muffin_party', label: 'Muffin Party 🎈🍊', desc: 'Bright orange, party green, hot pink & sky blue', dots: ['bg-[#FF9F1C]', 'bg-[#2BAE66]', 'bg-[#F72585]', 'bg-[#00BBF9]'] },
                        { id: 'muffin_oasis', label: 'Muffin Oasis 🌴🍰', desc: 'Glossy fresh pink, minty green & sunshine yellow', dots: ['bg-[#FF6B6B]', 'bg-[#4ECDC4]', 'bg-[#FFE66D]', 'bg-[#F0F0F0]'] },
                        { id: 'classic', label: 'Classic Honey 🍯', desc: 'Warm sweet golden caramel style', dots: ['bg-brand-honey', 'bg-brand-caramel'] },
                        { id: 'velvet', label: 'Royal Velvet 🍇', desc: 'Prestige plum, berry & rose gold', dots: ['bg-rose-500', 'bg-purple-900'] },
                        { id: 'pistachio', label: 'Pistachio Mint 🍃', desc: 'Earthy forest sage & green mint', dots: ['bg-emerald-400', 'bg-emerald-800'] },
                        { id: 'espresso', label: 'Midnight Espresso ☕', desc: 'Cozy dark roast roasted coffee', dots: ['bg-amber-800', 'bg-zinc-800'] },
                        { id: 'cozy_brown', label: 'Chestnut & Mocha 🍂', desc: 'Cozy light & dark brown aesthetic vibe', dots: ['bg-amber-200', 'bg-amber-700', 'bg-amber-950'] },
                        { id: 'golden_sprinkle', label: 'Golden Sprinkle ✨', desc: 'Shiny golden sparkles & multicolor magic', dots: ['bg-yellow-400', 'bg-rose-400', 'bg-cyan-400'] }
                      ].map((th, thIdx) => (
                        <button
                          key={`theme-option-${th.id}-${thIdx}`}
                          onClick={() => {
                            setTheme(th.id as any);
                            setIsThemeOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all hover:bg-brand-cream/60 group cursor-pointer ${
                            theme === th.id ? 'bg-brand-cream/80 border border-brand-caramel/15' : 'border border-transparent'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-black text-brand-chocolate group-hover:text-brand-caramel transition-colors">
                              {th.label}
                            </p>
                            <p className="text-[10px] text-brand-chocolate/60 leading-none">
                              {th.desc}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {th.dots.map((dot, dIdx) => (
                              <span key={`dot-${th.id}-${dIdx}`} className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                            ))}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart Icon */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsCartOpen(true)}
              className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl bg-brand-cream border border-brand-caramel/10 flex items-center justify-center relative cursor-pointer hover:border-brand-caramel/30 transition-all text-brand-chocolate shadow-2xs"
              title="Open Shopping Basket"
              aria-label="Open Shopping Basket"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              <AnimatePresence>
                {totalCartCount > 0 && (
                  <motion.span
                    key={`cart-badge-${totalCartCount}`}
                    initial={{ scale: 0.2, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 14 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 bg-brand-caramel text-brand-cream rounded-full flex items-center justify-center px-1 text-[9px] sm:text-[10px] font-black font-sans border-2 border-brand-sugar shadow-md"
                  >
                    {totalCartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden hover:bg-brand-cream rounded-xl text-brand-chocolate/80 cursor-pointer flex items-center justify-center focus:outline-none border border-brand-caramel/10"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu-panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-brand-sugar/98 backdrop-blur-xl border-b border-brand-caramel/15 py-5 px-4 space-y-3.5 shadow-2xl z-40 fixed top-16 sm:top-20 left-0 right-0 max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-5rem)] overflow-y-auto font-sans uppercase tracking-widest text-xs font-bold text-brand-chocolate w-full"
          >
            {/* Mobile Navigation Search Bar */}
            <div className="pb-3 border-b border-brand-caramel/10">
              <NavSearchBar 
                onSearch={(query) => {
                  handleSearchNavigation(query);
                  setMobileMenuOpen(false);
                }}
                className="w-full"
                placeholder="Search menu items..."
                isCompact={false}
              />
            </div>

            <button 
              onClick={() => { scrollToSection('home-section'); setMobileMenuOpen(false); }}
              className={`block w-full text-left py-2.5 px-3 rounded-xl transition-colors cursor-pointer ${
                activeView === 'home' ? 'bg-brand-caramel/10 text-brand-caramel font-black' : 'hover:bg-brand-cream'
              }`}
            >
              Heritage Home
            </button>
            <button 
              onClick={() => { scrollToSection('menu-section'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-brand-cream transition-colors cursor-pointer"
            >
              Digital Menu & Catalog
            </button>
            <button 
              onClick={() => { scrollToSection('specialties-section'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-brand-cream transition-colors cursor-pointer"
            >
              Bakery Specialties
            </button>
            <button 
              onClick={() => { scrollToSection('video-section'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-brand-cream transition-colors cursor-pointer"
            >
              Kitchen Video Reel
            </button>
            <button 
              onClick={() => { scrollToSection('branches-section'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-brand-cream transition-colors cursor-pointer"
            >
              Our Branches (GPS)
            </button>
            <button 
              onClick={() => { scrollToSection('complaints-section'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-brand-cream transition-colors cursor-pointer"
            >
              Complaints & Feedback Desk
            </button>
            <button 
              onClick={() => { setActiveView('tracker'); setMobileMenuOpen(false); }}
              className={`block w-full text-left py-2.5 px-3 rounded-xl transition-colors cursor-pointer ${
                activeView === 'tracker' ? 'bg-brand-caramel/10 text-brand-caramel font-black' : 'hover:bg-brand-cream'
              }`}
            >
              Order History & Track
            </button>
            <button 
              onClick={() => { setActiveView('admin'); setMobileMenuOpen(false); }}
              className={`block w-full text-left py-2.5 px-3 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeView === 'admin' ? 'bg-brand-caramel/10 text-brand-caramel font-black' : 'text-brand-caramel hover:bg-brand-cream'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-brand-honey shrink-0" />
              <span>Back-Office Dashboard</span>
            </button>
            
            <div className="border-t border-brand-caramel/10 pt-3 space-y-2.5">
              <button
                type="button"
                onClick={() => { setIsStandaloneQrOpen(prev => !prev); setMobileMenuOpen(false); }}
                className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-xl font-black text-center flex items-center justify-center gap-2 shadow-sm cursor-pointer text-xs"
              >
                <QrCode className="w-4 h-4 text-amber-950 shrink-0" />
                <span>Instant QR Payment</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="https://wa.me/923202587047"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-center flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer text-xs"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>WhatsApp: 0320 2587047</span>
                </a>
                <a
                  href="https://wa.me/923166126926"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-center flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer text-xs"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>WhatsApp: 0316 6126926</span>
                </a>
              </div>

              <div className="pt-2 border-t border-brand-caramel/10 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-brand-caramel tracking-wider">Bakery Audio Ambience</span>
                <AmbientBakerySound />
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <a
                  href="https://www.instagram.com/patashay_muffins?igsh=dm54MmNycjdzaGJ0"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-1.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold text-center flex items-center justify-center gap-1 text-[11px] normal-case"
                >
                  <Instagram className="w-3.5 h-3.5 shrink-0" />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://www.facebook.com/share/1JjDcPu8ca/"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-1.5 bg-blue-600 text-white rounded-xl font-bold text-center flex items-center justify-center gap-1 text-[11px] normal-case"
                >
                  <Facebook className="w-3.5 h-3.5 shrink-0" />
                  <span>Facebook</span>
                </a>
                <a
                  href="https://www.tiktok.com/@muffinns_sweetsbaker"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-1.5 bg-black text-white rounded-xl font-bold text-center flex items-center justify-center gap-1 text-[11px] normal-case border border-neutral-800"
                >
                  <TikTokIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>TikTok</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Offline Orders Synchronization Banner */}
      <OfflineSyncBanner 
        onNavigateToOrder={(orderId) => {
          setSelectedTrackerId(orderId);
          setActiveView('tracker');
        }}
        onOrderSynced={(order) => {
          setNewlyPlacedOrder(order);
        }}
      />

      {/* ================= PRIMARY APP VIEWPORT ================= */}
      <main className="flex-grow w-full max-w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          {(activeView === 'home' || activeView === 'menu') && (
            <motion.div
              key="view-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-16"
            >
              {/* Dynamic Hero banner */}
              <div id="home-section" className="scroll-mt-20 sm:scroll-mt-24">
                <Hero onNavigate={handleNavigate} theme={theme} />
              </div>

              {/* ================= DIGITAL MENU SECTION ================= */}
              <div id="menu-section" className="scroll-mt-20 sm:scroll-mt-24 w-full">
                <MenuSection 
                  onAddToCart={handleAddToCart} 
                  onNavigateToCart={() => setIsCartOpen(true)}
                  initialSearchQuery={activeSearchQuery}
                  onSearchChange={setActiveSearchQuery}
                />
              </div>

              {/* ================= BRAND HERITAGE SECTION ================= */}
              <section id="heritage-section" className="scroll-mt-20 sm:scroll-mt-24 py-12 bg-brand-cream/40">
                <div className="container mx-auto max-w-7xl px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  
                  {/* Left block illustrations with premium overlap */}
                  <div className="relative">
                    <div className="rounded-2xl overflow-hidden aspect-video bg-zinc-100 shadow-xl border border-brand-caramel/10">
                      <img 
                        src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80" 
                        alt="Artisanal Breads" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Floating mini-badge */}
                    <div className="absolute -bottom-6 -right-6 bg-brand-chocolate text-brand-cream p-4 rounded-xl shadow-2xl border border-brand-honey/20 max-w-[180px] hidden sm:block animate-float-slow">
                      <p className="text-xl font-serif text-brand-honey font-bold">100% Halal</p>
                      <p className="text-[10px] text-brand-cream/80 leading-relaxed font-medium">Stone Ground Flour & Pure Butter Fat (Desi Ghee)</p>
                    </div>
                  </div>

                  {/* Right text narrative */}
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-brand-honey">Since 1988 Heritage</span>
                      <h3 className="text-3xl font-serif font-bold text-brand-chocolate">Patashe (پتاشے) Sweet Tradition</h3>
                      <div className="w-12 h-1 bg-brand-caramel rounded-full mt-1.5" />
                    </div>

                    <p className="text-sm text-brand-chocolate/80 leading-relaxed">
                      At Muffinns, also recognized affectionately as <strong>Patashe</strong> across the valley, we take tremendous pride in baking standard sandwich breads, multi-grain rolls, and buttery croissants. Our traditional sweets department processes organic local ingredients to craft golden, crumbly Pateesa, royal Badam Burfi, and rich, syrup-infused Gulab Jamuns.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex gap-2.5 items-start">
                        <CheckCircle2 className="w-5 h-5 text-brand-honey shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-xs text-brand-chocolate uppercase">Pure Ingredients</h5>
                          <p className="text-[11px] text-brand-chocolate/60">No preservatives or additives.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <CheckCircle2 className="w-5 h-5 text-brand-honey shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-xs text-brand-chocolate uppercase">Midnight Baking</h5>
                          <p className="text-[11px] text-brand-chocolate/60">Our ovens boil while you sleep.</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => scrollToSection('menu-section')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-caramel hover:text-brand-chocolate transition-colors cursor-pointer"
                    >
                      <span>See Our Specialties Menu</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </section>

              {/* ================= BENTO GRAPHICS DISPLAY ================= */}
              <section id="specialties-section" className="scroll-mt-20 sm:scroll-mt-24 container mx-auto max-w-7xl px-4 space-y-8">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-honey">Flavors of Celebration</span>
                  <h3 className="text-3xl font-serif text-brand-chocolate font-bold">The Muffinns Specialties</h3>
                  <p className="text-xs text-brand-chocolate/50">Explore our signature dishes baked with love and devotion</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Card 1 */}
                  <div className="rounded-2xl p-5 bg-brand-sugar border border-brand-caramel/10 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="aspect-[16/10] bg-brand-cream rounded-xl overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80" 
                        alt="Specialty Cakes" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-lg text-brand-chocolate">Gourmet Birthday Cakes</h4>
                      <p className="text-xs text-brand-chocolate/70 leading-relaxed">
                        Customize weight, size, and messages on Chocolate Fudge, Red Velvet, and Lotus Cream cakes.
                      </p>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="rounded-2xl p-5 bg-brand-sugar border border-brand-caramel/10 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="aspect-[16/10] bg-brand-cream rounded-xl overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80" 
                        alt="Savory Snacks" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-lg text-brand-chocolate">Savory Tea-Time Snacks</h4>
                      <p className="text-xs text-brand-chocolate/70 leading-relaxed">
                        Crispy Chicken Patties, spicy Shawarma Rolls, Pizza Pies, and flaky tarts perfect for afternoon high teas.
                      </p>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="rounded-2xl p-5 bg-brand-sugar border border-brand-caramel/10 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="aspect-[16/10] bg-brand-cream rounded-xl overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80" 
                        alt="Milky Bread" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-lg text-brand-chocolate">Fresh Morning Breads</h4>
                      <p className="text-xs text-brand-chocolate/70 leading-relaxed">
                        Gourmet Milky Breads, healthy Bran Breads, Garlic Sticks, and soft sandwich loaves baked daily.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ================= FEATURED INSTAGRAM REEL ================= */}
              <div id="video-section" className="scroll-mt-20 sm:scroll-mt-24">
                <FeaturedVideoReel theme={theme} />
              </div>

              {/* ================= BRANCH LOCATIONS SECTION ================= */}
              <div className="scroll-mt-20 sm:scroll-mt-24">
                <BranchLocations theme={theme} />
              </div>

              {/* ================= COMPLAINTS & FEEDBACK GATEWAY ================= */}
              <section id="complaints-section" className="scroll-mt-20 sm:scroll-mt-24 py-12 bg-stone-900/10 dark:bg-stone-950/40 border-t border-b border-brand-caramel/10">
                <div className="container mx-auto max-w-4xl px-4">
                  <div className="bg-white dark:bg-stone-900 p-6 sm:p-10 rounded-2xl border border-brand-caramel/20 shadow-xl grid grid-cols-1 md:grid-cols-5 gap-8 items-center text-stone-900 dark:text-stone-100 transition-colors">
                    
                    {/* Info Block */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-brand-caramel dark:text-amber-400">Complaints Desk</span>
                        <h4 className="text-2xl font-serif font-black text-stone-900 dark:text-amber-100">Voice Your Feedback</h4>
                        <div className="w-12 h-1 bg-brand-caramel rounded-full mt-1" />
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans font-medium">
                        We thrive on perfect recipes. If your sandwich loaf was slightly cold, or your burfi box missing some almonds, our director is waiting.
                      </p>
                      <p className="text-xs font-semibold text-brand-caramel dark:text-amber-400">
                        Direct Email: <a href="mailto:Muffinnscomplain@gmail.com" className="underline hover:text-brand-chocolate dark:hover:text-amber-200">Muffinnscomplain@gmail.com</a>
                      </p>

                      <div className="pt-2">
                        <div className="p-3 bg-amber-500/10 dark:bg-stone-800 rounded-xl border border-brand-caramel/15 text-[11px] text-stone-700 dark:text-stone-300 font-medium">
                          ⚡ Feedbacks submitted here load instantly onto our managers' Back-Office dashboard for immediate resolution.
                        </div>
                      </div>
                    </div>

                    {/* Interactive Form Block */}
                    <form onSubmit={handlePostInquiry} className="md:col-span-3 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={inquiryName}
                          onChange={(e) => setInquiryName(e.target.value)}
                          placeholder="Your Name *"
                          className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-brand-caramel text-xs font-medium rounded-xl transition-colors shadow-xs"
                        />
                        <input
                          type="email"
                          required
                          value={inquiryEmail}
                          onChange={(e) => setInquiryEmail(e.target.value)}
                          placeholder="Your Email Address *"
                          className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-brand-caramel text-xs font-medium rounded-xl transition-colors shadow-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="tel"
                          value={inquiryPhone}
                          onChange={(e) => setInquiryPhone(e.target.value)}
                          placeholder="Phone / WhatsApp"
                          className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-brand-caramel text-xs font-medium rounded-xl transition-colors shadow-xs"
                        />
                        <input
                          type="text"
                          required
                          value={inquirySubject}
                          onChange={(e) => setInquirySubject(e.target.value)}
                          placeholder="Subject / Concern *"
                          className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-brand-caramel text-xs font-medium rounded-xl transition-colors shadow-xs"
                        />
                      </div>

                      {/* 5-Star Satisfaction Rating Component */}
                      <div className="bg-amber-500/10 dark:bg-amber-500/10 p-3.5 rounded-2xl border border-amber-300/40 dark:border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-stone-900 dark:text-amber-200 flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>Satisfaction Rating *</span>
                          </label>
                          <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 rounded-md border border-amber-300/60 dark:border-amber-700/50">
                            {(hoverRating || inquiryRating) === 5 && '5/5 - Outstanding Excellence! 🌟'}
                            {(hoverRating || inquiryRating) === 4 && '4/5 - Very Good 🙂'}
                            {(hoverRating || inquiryRating) === 3 && '3/5 - Average Experience 😐'}
                            {(hoverRating || inquiryRating) === 2 && '2/5 - Needs Improvement 🙁'}
                            {(hoverRating || inquiryRating) === 1 && '1/5 - Dissatisfied 😞'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((starVal) => {
                              const isFilled = starVal <= (hoverRating || inquiryRating);
                              return (
                                <motion.button
                                  key={`rating-star-${starVal}`}
                                  type="button"
                                  whileHover={{ scale: 1.2, rotate: 5 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setInquiryRating(starVal)}
                                  onMouseEnter={() => setHoverRating(starVal)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  className="p-1 rounded-lg focus:outline-none transition-all cursor-pointer"
                                  title={`Rate ${starVal} out of 5 stars`}
                                  aria-label={`Rate ${starVal} out of 5 stars`}
                                >
                                  <Star 
                                    className={`w-6 h-6 transition-colors ${
                                      isFilled 
                                        ? 'fill-amber-400 text-amber-500 drop-shadow-[0_1px_2px_rgba(245,158,11,0.4)]' 
                                        : 'fill-stone-200 dark:fill-stone-700 text-stone-300 dark:text-stone-600 hover:text-amber-400'
                                    }`} 
                                  />
                                </motion.button>
                              );
                            })}
                          </div>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium hidden sm:inline">
                            Tap stars to select
                          </span>
                        </div>
                      </div>

                      {/* Message Input with Web Speech API Voice Dictation */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-stone-900 dark:text-stone-200 flex items-center gap-1.5">
                            <span>Your Message / Feedback *</span>
                          </label>

                          <div className="flex items-center gap-2">
                            {isDictating && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-200 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-800"
                              >
                                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                                Live Dictating...
                              </motion.span>
                            )}

                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleToggleDictation}
                              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                                isDictating
                                    ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                                  : 'bg-brand-caramel/15 hover:bg-brand-caramel text-brand-caramel hover:text-white border border-brand-caramel/30 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500 dark:hover:text-stone-900'
                              }`}
                              title={isDictating ? 'Stop Voice Dictation' : 'Dictate feedback message using microphone'}
                            >
                              {isDictating ? (
                                <>
                                  <MicOff className="w-3.5 h-3.5" />
                                  <span>Stop Dictating</span>
                                </>
                              ) : (
                                <>
                                  <Mic className="w-3.5 h-3.5" />
                                  <span>Dictate</span>
                                </>
                              )}
                            </motion.button>
                          </div>
                        </div>

                        {dictationError && (
                          <div className="p-2 text-[11px] font-medium bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between">
                            <span>{dictationError}</span>
                            <button
                              type="button"
                              onClick={() => setDictationError(null)}
                              className="text-amber-800/60 dark:text-amber-300/80 hover:text-amber-900 font-bold ml-2 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        {!dictationSupported && (
                          <div className="p-2 text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-lg">
                            💡 Web Speech API is not supported in this browser. You can type your message manually below.
                          </div>
                        )}

                        <div className="relative">
                          <textarea
                            required
                            value={inquiryMessage}
                            onChange={(e) => setInquiryMessage(e.target.value)}
                            placeholder="Write your complaints, suggestions, or party catering requests here, or tap 'Dictate' to speak... *"
                            rows={3}
                            className={`w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 border focus:outline-none focus:ring-2 focus:ring-brand-caramel text-xs font-medium rounded-xl transition-all ${
                              isDictating ? 'border-red-500 ring-2 ring-red-200 bg-red-50/50 dark:bg-red-950/30' : 'border-stone-300 dark:border-stone-700'
                            }`}
                          />
                          {inquiryMessage && (
                            <button
                              type="button"
                              onClick={() => setInquiryMessage('')}
                              className="absolute right-2.5 bottom-3 text-[10px] font-semibold text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-stone-700 px-1.5 py-0.5 rounded border border-stone-200 dark:border-stone-600 transition-colors cursor-pointer"
                              title="Clear message text"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {inquiryStatus && (
                        <div className={`p-3 text-xs rounded-xl font-medium ${inquiryStatus.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800' : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800'}`}>
                          {inquiryStatus.text}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={inquirySubmitting}
                        className="w-full py-3 bg-brand-caramel hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        {inquirySubmitting ? 'Logging Feedback...' : 'Send Message to Board'}
                      </button>
                    </form>

                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeView === 'tracker' && (
            <motion.div
              key="view-tracker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <OrderTracker 
                initialOrderId={selectedTrackerId}
                onAddToCart={handleAddToCart}
                onReorderAll={handleReorderAll}
                onOpenCart={() => setIsCartOpen(true)}
                onNavigateToMenu={() => setActiveView('menu')}
              />
            </motion.div>
          )}

          {activeView === 'admin' && (
            <motion.div
              key="view-admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ================= STICKY COHESIVE FOOTER ================= */}
      <footer className="bg-brand-chocolate text-brand-cream border-t border-brand-caramel/10 mt-16 font-sans">
        <div className="container mx-auto max-w-7xl px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo & Slogan Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-caramel flex items-center justify-center text-brand-cream font-bold">
                M
              </div>
              <div>
                <div className="flex items-baseline gap-1.5 leading-none">
                  <span className="font-serif font-black text-xl tracking-tight">Muffinns</span>
                  <span className="font-sans text-xs font-bold text-brand-honey" dir="rtl">پتاشے</span>
                </div>
                <span className="text-[8px] uppercase tracking-wider font-bold text-brand-honey block mt-0.5">Sweets & Bakers</span>
              </div>
            </div>
            <p className="text-xs text-brand-cream/60 leading-relaxed">
              Baking standard sandwich breads, multi-grain loaves, rich birthday cakes, and sweet traditional desserts in Lahore since 1988.
            </p>
            <p className="text-[10px] text-brand-honey font-bold uppercase tracking-widest">
              Also known as: Patashe (پتاشے)
            </p>

            {/* Social Media Links */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <a 
                href="https://www.instagram.com/patashay_muffins?igsh=dm54MmNycjdzaGJ0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 text-white text-[11px] font-bold hover:opacity-90 transition-opacity shadow-sm"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram</span>
              </a>
              <a 
                href="https://www.facebook.com/share/1JjDcPu8ca/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Facebook className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </a>
              <a 
                href="https://www.tiktok.com/@muffinns_sweetsbaker"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-[11px] font-bold hover:bg-neutral-800 transition-colors shadow-sm border border-neutral-700"
              >
                <TikTokIcon className="w-3.5 h-3.5" />
                <span>TikTok</span>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-4 text-xs font-semibold">
            <h4 className="text-brand-honey uppercase tracking-wider font-bold text-xs">Navigation links</h4>
            <div className="space-y-2.5 block text-brand-cream/80 uppercase tracking-widest text-[10px]">
              <button onClick={() => scrollToSection('home-section')} className="block hover:text-brand-honey transition-colors cursor-pointer text-left">Heritage Home</button>
              <button onClick={() => scrollToSection('menu-section')} className="block hover:text-brand-honey transition-colors cursor-pointer text-left">Digital Menu & Catalog</button>
              <button onClick={() => scrollToSection('specialties-section')} className="block hover:text-brand-honey transition-colors cursor-pointer text-left">Bakery Specialties</button>
              <button onClick={() => scrollToSection('branches-section')} className="block hover:text-brand-honey transition-colors cursor-pointer text-left">Our 4 Branches</button>
              <button onClick={() => scrollToSection('complaints-section')} className="block hover:text-brand-honey transition-colors cursor-pointer text-left">Complaints Desk</button>
              <button onClick={() => { setActiveView('tracker'); window.scrollTo(0, 0); }} className="block hover:text-brand-honey transition-colors cursor-pointer text-left">Track Active Order</button>
              <button onClick={() => { setActiveView('admin'); window.scrollTo(0, 0); }} className="block hover:text-brand-honey transition-colors cursor-pointer text-left">Back-Office Dashboard</button>
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-4 text-xs">
            <h4 className="text-brand-honey uppercase tracking-wider font-bold text-xs">Get in Touch</h4>
            <div className="space-y-2.5 text-brand-cream/80">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-caramel mt-0.5 shrink-0" />
                <span>Muffinns Sweets & Bakers, Main Boulevard Road, Lahore, Pakistan</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-caramel shrink-0" />
                <a href="mailto:Muffinnscomplain@gmail.com" className="hover:underline">Muffinnscomplain@gmail.com</a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-caramel shrink-0" />
                <span>
                  <a href="https://wa.me/923202587047" className="hover:underline">WhatsApp: +92 320 2587047</a>
                  <span className="mx-1 text-brand-cream/40">|</span>
                  <a href="https://wa.me/923166126926" className="hover:underline">+92 316 6126926</a>
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                <a href="https://www.instagram.com/patashay_muffins?igsh=dm54MmNycjdzaGJ0" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-pink-300">Instagram: @patashay_muffins</a>
              </p>
              <p className="flex items-center gap-2">
                <Facebook className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="https://www.facebook.com/share/1JjDcPu8ca/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-300">Facebook: Patashay Muffins</a>
              </p>
              <p className="flex items-center gap-2">
                <TikTokIcon className="w-4 h-4 text-neutral-200 shrink-0" />
                <a href="https://www.tiktok.com/@muffinns_sweetsbaker" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-amber-300">TikTok: @muffinns_sweetsbaker</a>
              </p>
            </div>
          </div>

          {/* Timings column */}
          <div className="space-y-4 text-xs">
            <h4 className="text-brand-honey uppercase tracking-wider font-bold text-xs">Oven Timings</h4>
            <div className="space-y-2.5 text-brand-cream/80">
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-caramel shrink-0" />
                <span>Mon - Sun: 06:00 AM - 12:00 AM</span>
              </p>
              <p className="text-[10px] text-brand-cream/50 leading-relaxed font-medium">
                Home Deliveries commence from 09:00 AM till 11:00 PM Lahore-wide. Order standard items on catalog.
              </p>
            </div>
          </div>

        </div>

        {/* Legal copyright footer */}
        <div className="bg-brand-chocolate/90 py-5 text-center text-[11px] text-brand-cream/40 font-medium border-t border-brand-cream/5 uppercase tracking-wider">
          <p>© {new Date().getFullYear()} Muffinns Sweets & Bakers (Patashe). Handcrafted with pride. All Rights Reserved.</p>
        </div>
      </footer>

      {/* ================= FLOATING ACTION ASSISTANCE ELEMENTS ================= */}
      
      {/* WhatsApp chat bubble */}
      <div className="fixed left-4 bottom-4 z-40 group">
        <div className="absolute left-0 bottom-16 bg-brand-chocolate text-brand-cream rounded-2xl p-3 shadow-2xl border border-brand-honey/30 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 w-60 space-y-2">
          <div className="text-[11px] font-bold text-brand-honey flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chat on WhatsApp</span>
          </div>
          <a
            href="https://wa.me/923202587047"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-white text-xs font-semibold transition-colors"
          >
            <span>Primary: 0320 2587047</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500 rounded text-emerald-950 font-bold">Chat</span>
          </a>
          <a
            href="https://wa.me/923166126926"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2 rounded-xl bg-emerald-700/30 hover:bg-emerald-700/50 text-white text-xs font-semibold transition-colors"
          >
            <span>Support: 0316 6126926</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-400 rounded text-emerald-950 font-bold">Chat</span>
          </a>
        </div>

        <motion.a
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          href="https://wa.me/923202587047"
          target="_blank"
          rel="noreferrer"
          className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-2xl relative cursor-pointer"
          title="WhatsApp Support (0320 2587047 / 0316 6126926)"
        >
          <Phone className="w-6 h-6 shrink-0" />
        </motion.a>
      </div>

      {/* Butler AI button launcher */}
      <div className="fixed right-4 bottom-4 z-40">
        <motion.button
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-brand-caramel hover:bg-brand-chocolate rounded-full flex items-center justify-center text-brand-cream shadow-2xl relative group cursor-pointer border border-brand-honey/35"
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 animate-pulse" />}
          <span className="absolute right-16 bg-brand-chocolate text-brand-cream text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow border border-brand-honey/25 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
            Ask Sweet Butler AI
          </span>
        </motion.button>
      </div>

      {/* ================= CART OVERLAY DRAWER ================= */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
        onAddToCart={handleAddToCart}
        theme={theme}
      />

      {/* ================= SPECIAL VIRTUAL BUTLER CHATBOT WINDOW ================= */}
      <AIChat
        currentCart={cart}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onNavigateToMenu={() => handleNavigate('menu')}
        theme={theme}
      />

      {/* ================= ORDER SUCCESS COMPLETED DIALOG ================= */}
      <AnimatePresence>
        {newlyPlacedOrder && (
          <motion.div
            key="placed-order-dialog-backdrop"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)', transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-brand-chocolate/65 flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 75, scale: 0.88, rotateX: 6 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: -24, scale: 0.92, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
              transition={{
                type: 'spring',
                stiffness: 340,
                damping: 26,
                mass: 0.85
              }}
              className="bg-brand-sugar max-w-lg w-full max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl border-2 border-brand-caramel/20 p-6 shadow-2xl text-center space-y-5 text-brand-chocolate transform-gpu"
            >
              {/* Header Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.15 }}
                className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-emerald-200 animate-bounce"
              >
                <CheckCircle2 className="w-9 h-9" />
              </motion.div>

              <div className="space-y-1">
                <h4 className="text-2xl font-serif font-black text-brand-chocolate">Bakery Order Placed!</h4>
                <p className="text-xs text-brand-chocolate/70 leading-relaxed font-sans">
                  The Muffinns bakers are pre-heating the stone ovens. Your invoice has been created:
                </p>
              </div>

              {/* Invoice Copier Box */}
              <div className="bg-brand-cream p-3.5 rounded-2xl border border-brand-caramel/10 flex items-center justify-between font-mono text-sm shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-brand-caramel tracking-widest font-sans">Invoice ID</span>
                  <span className="font-black text-brand-chocolate tracking-wider">{newlyPlacedOrder.id}</span>
                </div>
                <button
                  onClick={() => handleCopyInvoice(newlyPlacedOrder.id)}
                  className="p-1.5 hover:bg-brand-caramel/10 rounded-lg text-brand-chocolate hover:text-brand-caramel transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedInvoice ? <span className="text-[10px] text-emerald-600 font-sans font-bold">Copied!</span> : <Copy className="w-4 h-4 text-brand-caramel" />}
                </button>
              </div>

              {/* ================= DEDICATED QR PAYMENT SECTION ================= */}
              {!isInlineQrClosed && (
                <div className="bg-gradient-to-b from-amber-500/10 via-brand-cream/60 to-brand-cream rounded-3xl border-2 border-amber-400/40 p-4 space-y-4 text-left relative overflow-hidden shadow-sm">
                  
                  {/* Header title badge */}
                  <div className="flex items-center justify-between border-b border-amber-300/40 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-800 flex items-center justify-center font-bold">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block leading-none">Quick Pay via App</span>
                        <h5 className="font-serif font-bold text-xs text-brand-chocolate">Faysal Bank Instant QR</h5>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-serif font-black text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-300">
                        Rs. {newlyPlacedOrder.totalAmount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsInlineQrClosed(true)}
                        className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition-all cursor-pointer border border-red-200 shadow-xs"
                        title="Close / Hide QR Payment Section"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* QR Code Yellow Payment Card with Live Scannable QRCodeSVG */}
                  <MuffinnsQRCodeCard accountNumber="3398787000005900" amount={newlyPlacedOrder.totalAmount} compact={true} onClose={() => setIsInlineQrClosed(true)} />

                {/* Status or Simulation Action */}
                {dialogQrVerifiedRef || newlyPlacedOrder.status === 'Paid & Confirmed' ? (
                  <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-3 text-center space-y-1">
                    <p className="text-xs font-black text-emerald-800 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>QR Payment Fully Verified!</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 font-mono">
                      Ref ID: {dialogQrVerifiedRef || newlyPlacedOrder.paymentReference || 'FBL-QR-VERIFIED'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-center">
                    <p className="text-[11px] text-brand-chocolate/70 font-medium">
                      Scan using EasyPaisa, JazzCash, or any Mobile Banking App to pay <strong>Rs. {newlyPlacedOrder.totalAmount.toLocaleString()}</strong>.
                    </p>
                    
                    <motion.button
                      type="button"
                      disabled={isSimulatingDialogQr || isDialogQrSuccess}
                      onClick={() => handleSimulateDialogQrPayment(newlyPlacedOrder.id)}
                      whileTap={{ scale: 0.96 }}
                      animate={
                        isDialogQrSuccess
                          ? { scale: [1, 1.05, 1], backgroundColor: '#059669' }
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.3 }}
                      className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-95 overflow-hidden ${
                        isDialogQrSuccess
                          ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                          : 'bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-amber-500/10'
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {isDialogQrSuccess ? (
                          <motion.div
                            key="qr-success-micro"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="flex items-center justify-center gap-2 font-black tracking-wide text-white"
                          >
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: [0, 1.35, 1], rotate: 0 }}
                              transition={{ duration: 0.45, ease: "backOut" }}
                              className="w-5 h-5 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </motion.div>
                            <span>Scan Verified & Paid!</span>
                          </motion.div>
                        ) : isSimulatingDialogQr ? (
                          <motion.div
                            key="qr-loading-micro"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-center gap-2 font-bold"
                          >
                            <Loader2 className="w-4 h-4 animate-spin text-amber-950" />
                            <span>Verifying Scan with Faysal Bank...</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="qr-idle-micro"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-center gap-2 font-bold"
                          >
                            <Smartphone className="w-4 h-4 text-amber-950" />
                            <span>Simulate App QR Scan & Instant Pay</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                )}

              </div>
              )}

              {/* Status Note */}
              {newlyPlacedOrder.paymentMethod === 'Bank Transfer' && !dialogQrVerifiedRef && newlyPlacedOrder.status !== 'Paid & Confirmed' ? (
                <p className="text-[11px] text-brand-honey font-bold leading-relaxed">
                  ⚠️ Direct Bank Transfer is "Pending Approval". Scan the QR code above or submit proof to authorize instantly.
                </p>
              ) : newlyPlacedOrder.paymentMethod === 'Cash on Delivery' && !dialogQrVerifiedRef ? (
                <p className="text-[11px] text-emerald-600 font-bold leading-relaxed">
                  Cash on Delivery Active. Pay Rs. {newlyPlacedOrder.totalAmount.toLocaleString()} at your doorstep or scan the QR above for online clearance!
                </p>
              ) : null}

              {/* Footer Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => generateReceiptPDF(newlyPlacedOrder)}
                  className="px-4 py-3 bg-brand-cream hover:bg-brand-caramel/10 border border-brand-caramel/25 text-brand-chocolate font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-brand-caramel" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    setNewlyPlacedOrder(null);
                  }}
                  className="px-4 py-3 bg-brand-cream hover:bg-brand-caramel/10 border border-brand-caramel/25 text-brand-chocolate font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  title="Print Kitchen & POS Receipt"
                >
                  <Printer className="w-3.5 h-3.5 text-brand-caramel" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTrackerId(newlyPlacedOrder.id);
                    setActiveView('tracker');
                    setNewlyPlacedOrder(null);
                  }}
                  className="flex-1 py-3 bg-brand-caramel hover:bg-brand-chocolate text-brand-cream font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Track Order Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setNewlyPlacedOrder(null)}
                  className="px-4 py-3 text-brand-chocolate hover:text-brand-caramel font-semibold text-xs rounded-xl transition-all border border-brand-caramel/10 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Kitchen Receipt for Browser Native Printing */}
      <KitchenReceipt order={newlyPlacedOrder} />

      {/* Live Kitchen Time & Baking Schedule Modal */}
      <KitchenTimeModal
        isOpen={isKitchenTimeOpen}
        onClose={() => setIsKitchenTimeOpen(false)}
        onOrderNow={() => scrollToSection('menu-section')}
      />

      {/* Bakery 11-Theme Palette Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={theme}
        onSelectTheme={(newTheme) => setTheme(newTheme)}
      />

      {/* Standalone Faysal Bank QR Payment Modal */}
      <QRPaymentModal
        isOpen={isStandaloneQrOpen}
        onClose={() => setIsStandaloneQrOpen(false)}
        order={newlyPlacedOrder || {
          id: 'MUFFINNS-QR-QUICK',
          items: cart,
          totalAmount: cart.reduce((acc, c) => acc + (c.finalPrice * c.quantity), 0) || 1250,
          status: 'Pending Payment',
          paymentMethod: 'Bank Transfer',
          createdAt: new Date().toISOString(),
          customerName: 'Valued Customer',
          customerPhone: '',
          deliveryAddress: '',
          branchLocation: 'Gulberg Branch, Lahore',
          deliveryFee: 0
        }}
        onPaymentSuccess={(updatedOrder) => {
          setNewlyPlacedOrder(updatedOrder);
          setIsStandaloneQrOpen(false);
        }}
        theme={theme}
      />

      {/* Global Push/Toast Notification Manager */}
      <NotificationManager 
        onNavigateToOrder={(orderId) => {
          setSelectedTrackerId(orderId);
          setActiveView('tracker');
          // Smooth scroll to tracking section if needed
          setTimeout(() => {
            document.getElementById('tracker-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }} 
      />

      {/* Interactive Floating Trail of Delicious Bakery Live Photos */}
      <CursorPhotoTrail theme={theme} />

    </div>
  );
}
