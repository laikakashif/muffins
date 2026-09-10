import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingCart, Info, Check, Plus, Minus, X, Sparkles, ArrowRight, ChefHat, Film } from 'lucide-react';
import { MenuItem, MenuCategory, SizeOption, CartItem, Order } from '../types';
import AskHeadBakerModal from './AskHeadBakerModal';
import QuickOrderModal from './QuickOrderModal';

const OFFICIAL_POSTERS = [
  {
    id: 'poster-sundae-cups',
    title: 'Sundae Cups',
    subtitle: 'Chocolate, Red Velvet & Caramel',
    category: 'Sundae & Cups' as MenuCategory,
    searchKeyword: 'Sundae',
    image: 'https://i.ibb.co/zVg0BtNX/Whats-App-Image-2026-08-31-at-4-52-57-PM.jpg',
    badge: 'MuffInns & Patashay',
    color: 'border-amber-500/30 text-amber-200'
  },
  {
    id: 'poster-bakery-bliss',
    title: 'Bakery Bliss',
    subtitle: 'Variety of Cupcakes & Muffins',
    category: 'Muffins & Desserts' as MenuCategory,
    searchKeyword: 'Bakery Bliss',
    image: 'https://i.ibb.co/KjxwTQQt/Whats-App-Image-2026-08-31-at-4-53-00-PM.jpg',
    badge: 'Patashay Confections',
    color: 'border-pink-500/30 text-pink-200'
  },
  {
    id: 'poster-biscuits-cookies',
    title: 'Cookies & Naan Khatai',
    subtitle: 'Golden Crunchy Almond Cookies with Tea',
    category: 'Biscuits & Cookies' as MenuCategory,
    searchKeyword: 'Biscuits & Cookies',
    image: 'https://i.ibb.co/mVPxn44G/Whats-App-Image-2026-08-30-at-7-47-53-PM.jpg',
    badge: 'Patashay Bakers',
    color: 'border-orange-500/30 text-orange-200'
  },
  {
    id: 'poster-moti-chour-laddu',
    title: 'Moti Chour Laddu',
    subtitle: 'Golden Pure Ghee & Gold Leaf',
    category: 'Sweets' as MenuCategory,
    searchKeyword: 'Moti Chour Laddu',
    image: 'https://i.ibb.co/JRb5s3kf/Whats-App-Image-2026-08-31-at-4-52-44-PM.jpg',
    badge: 'Patashay Sweets',
    color: 'border-yellow-500/30 text-yellow-200'
  },
  {
    id: 'poster-muffins-cupcakes-tier',
    title: 'Muffins & Cupcakes',
    subtitle: '3-Tier Celebration Tower',
    category: 'Muffins & Desserts' as MenuCategory,
    searchKeyword: '3-Tier Stand',
    image: 'https://i.ibb.co/Cs4P2zPz/Whats-App-Image-2026-08-31-at-4-52-40-PM.jpg',
    badge: 'MuffInns Signature',
    color: 'border-rose-500/30 text-rose-200'
  },
  {
    id: 'poster-arabic-sweets',
    title: 'Arabic Special Sweets',
    subtitle: 'Crispy Baklava & Cashew Nests',
    category: 'Sweets' as MenuCategory,
    searchKeyword: 'Arabic Special Sweets',
    image: 'https://i.ibb.co/hxgSjCt3/Whats-App-Image-2026-07-21-at-20-24-58.jpg',
    badge: 'Patashay & MuffInns',
    color: 'border-emerald-500/30 text-emerald-200'
  },
  {
    id: 'poster-lotus-biscoff-cake',
    title: 'Sweets for the Soul',
    subtitle: 'Signature Lotus Biscoff Drip Cake',
    category: 'Cakes (Cream & Special)' as MenuCategory,
    searchKeyword: 'Lotus Cake',
    image: 'https://i.ibb.co/Vc4q0Cdw/Whats-App-Image-2026-08-30-at-7-47-57-PM.jpg',
    badge: 'Patashay Signature',
    color: 'border-orange-500/30 text-orange-200'
  },
  {
    id: 'poster-assorted-donuts',
    title: 'Assorted Bakery Donuts',
    subtitle: 'Chocolate, Frosting & Rainbow Sprinkles',
    category: 'Pattiess, Puffs & Donuts' as MenuCategory,
    searchKeyword: 'Special Assorted Donuts',
    image: 'https://i.ibb.co/2fyCdpK/Whats-App-Image-2026-08-31-at-4-53-07-PM.jpg',
    badge: 'Patashay Confections',
    color: 'border-cyan-500/30 text-cyan-200'
  },
  {
    id: 'poster-daal-halwa',
    title: 'Desi Ghee Daal Halwa',
    subtitle: 'Golden Granular Halwa with Saffron & Pistachios',
    category: 'Traditional & Pateesa' as MenuCategory,
    searchKeyword: 'Daal Halwa',
    image: 'https://i.ibb.co/fdnsJxgd/Whats-App-Image-2026-08-31-at-4-52-36-PM.jpg',
    badge: 'Patashay Traditional',
    color: 'border-amber-500/30 text-amber-200'
  },
  {
    id: 'poster-kaju-katli',
    title: 'Royal Kaju Katli',
    subtitle: 'Pure Cashew Fudge with Chandi Vark',
    category: 'Traditional & Pateesa' as MenuCategory,
    searchKeyword: 'Kajoo Kattli',
    image: 'https://i.ibb.co/spTXGPJD/IMG-7593.jpg',
    badge: 'Patashay Royal',
    color: 'border-yellow-500/30 text-yellow-200'
  },
  {
    id: 'poster-akhroti-halwa',
    title: 'Akhroti Sohan Halwa',
    subtitle: 'Multani Specialty Loaded with English Walnuts',
    category: 'Traditional & Pateesa' as MenuCategory,
    searchKeyword: 'Akhroti Sohan Halwa',
    image: 'https://i.ibb.co/XcVkDms/Whats-App-Image-2026-08-30-at-7-47-56-PM.jpg',
    badge: 'Patashay Heritage',
    color: 'border-amber-600/30 text-amber-200'
  },
  {
    id: 'poster-panjeri',
    title: 'Panjeri Special',
    subtitle: 'Nutritional Mix with Organic Ghee & Dry Fruits',
    category: 'Traditional & Pateesa' as MenuCategory,
    searchKeyword: 'Panjeeri',
    image: 'https://i.ibb.co/zWVgJjfM/Whats-App-Image-2026-08-30-at-7-47-56-PM.jpg',
    badge: 'Patashay Wellness',
    color: 'border-orange-600/30 text-orange-200'
  },
  {
    id: 'poster-cake-rusk',
    title: 'Crispy Cake Rusk',
    subtitle: 'Twice-Baked Golden Rusks for Tea Time',
    category: 'Biscuits & Cookies' as MenuCategory,
    searchKeyword: 'Cake Rusk',
    image: 'https://i.ibb.co/9mtmrvkv/Whats-App-Image-2026-08-31-at-4-52-39-PM.jpg',
    badge: 'Patashay Bakery',
    color: 'border-amber-400/30 text-amber-100'
  },
  {
    id: 'poster-barfi-brown',
    title: 'Golden Barfi Brown',
    subtitle: 'Roasted Khoya Sweet Slices with Pistachios',
    category: 'Traditional & Pateesa' as MenuCategory,
    searchKeyword: 'Barfi Brown',
    image: 'https://i.ibb.co/QvqZT4P9/Whats-App-Image-2026-08-30-at-7-47-55-PM.jpg',
    badge: 'Patashay Khoya',
    color: 'border-amber-700/30 text-amber-200'
  },
  {
    id: 'poster-gulab-jamun',
    title: 'Syrup Gulab Jamun',
    subtitle: 'Golden Syrupy Khoya Balls in Scalloped Bowl',
    category: 'Sweets' as MenuCategory,
    searchKeyword: 'Gulab Jamun',
    image: 'https://i.ibb.co/rKGTdj3Z/Whats-App-Image-2026-08-31-at-4-53-08-PM.jpg',
    badge: 'Patashay Sweets',
    color: 'border-cyan-500/30 text-cyan-200'
  },
  {
    id: 'poster-fruit-cake',
    title: 'Classic Fruit Cake',
    subtitle: 'Sliced Golden Pound Cake with Glazed Fruit',
    category: 'Cakes (Classic & Dry)' as MenuCategory,
    searchKeyword: 'Fruit Cake',
    image: 'https://i.ibb.co/RpZ2N3Xc/Whats-App-Image-2026-09-01-at-8-42-45-PM.jpg',
    badge: 'Patashay Bakery',
    color: 'border-sky-500/30 text-sky-200'
  },
  {
    id: 'poster-sohan-halwa',
    title: 'Multani Sohan Halwa',
    subtitle: 'Caramelized Sweet Cubes with Chopped Almonds',
    category: 'Traditional & Pateesa' as MenuCategory,
    searchKeyword: 'Sohan Halwa',
    image: 'https://i.ibb.co/LzX9J46x/Whats-App-Image-2026-08-31-at-4-52-46-PM.jpg',
    badge: 'Patashay Authentic',
    color: 'border-amber-500/30 text-amber-200'
  },
  {
    id: 'poster-baqir-khani',
    title: 'Golden Baqir Khani',
    subtitle: 'Crispy Flaky Puff Biscuits on Serving Platter',
    category: 'Pattiess, Puffs & Donuts' as MenuCategory,
    searchKeyword: 'Baqir Khani',
    image: 'https://i.ibb.co/1GSsGjSf/Whats-App-Image-2026-08-30-at-7-47-51-PM.jpg',
    badge: 'Patashay Bakery',
    color: 'border-blue-500/30 text-blue-200'
  },
  {
    id: 'poster-badami-sohan-halwa',
    title: 'Badami Sohan Halwa',
    subtitle: 'Rich Caramelized Halwa Tray Loaded with Almonds',
    category: 'Traditional & Pateesa' as MenuCategory,
    searchKeyword: 'Badami Sohan Halwa',
    image: 'https://i.ibb.co/3y4dvDph/Whats-App-Image-2026-08-30-at-7-47-56-PM.jpg',
    badge: 'Patashay Royal',
    color: 'border-amber-600/30 text-amber-200'
  },
  {
    id: 'poster-chocolate-brownie',
    title: 'Triple Fudge Brownies',
    subtitle: 'Chocolate Drizzled Fudgy Brownie Squares',
    category: 'Pastries & Brownies' as MenuCategory,
    searchKeyword: 'Brownie',
    image: 'https://i.ibb.co/ym1jScvx/Whats-App-Image-2026-08-31-at-4-53-11-PM.jpg',
    badge: 'Patashay Cocoa',
    color: 'border-rose-500/30 text-rose-200'
  },
  {
    id: 'poster-customized-cake',
    title: 'Customized Cake',
    subtitle: 'Tailored Specialty Cakes for Your Celebrations',
    category: 'Cakes (Cream & Special)' as MenuCategory,
    searchKeyword: 'Customized Cake',
    image: 'https://i.ibb.co/Wvhk67VM/IMG-7609.jpg',
    badge: 'Patashay Custom',
    color: 'border-red-500/30 text-red-200'
  },
  {
    id: 'poster-variety-laddus',
    title: "Variety of Laddu's",
    subtitle: 'Platter of Assorted Motichoor & Besan Laddus',
    category: 'Sweets' as MenuCategory,
    searchKeyword: 'Laddu',
    image: 'https://i.ibb.co/YT2gwHGR/Whats-App-Image-2026-09-01-at-8-44-26-PM.jpg',
    badge: 'Patashay Mithai',
    color: 'border-yellow-500/30 text-yellow-200'
  },
  {
    id: 'poster-malt-cake',
    title: 'Malt Fudge Cake',
    subtitle: 'Rich Chocolate Shavings & Piped Rosettes',
    category: 'Cakes (Cream & Special)' as MenuCategory,
    searchKeyword: 'Malt',
    image: 'https://i.ibb.co/vyPhqKZ/Whats-App-Image-2026-08-30-at-7-47-57-PM.jpg',
    badge: 'MuffInns Signature',
    color: 'border-amber-700/30 text-amber-200'
  },
  {
    id: 'poster-cookie-cream',
    title: 'Cookie & Cream Cake',
    subtitle: 'Dark Chocolate Ganache & Speckled Frosting',
    category: 'Cakes (Cream & Special)' as MenuCategory,
    searchKeyword: 'Cookie & Cream',
    image: 'https://i.ibb.co/F4JSFFXW/Whats-App-Image-2026-07-21-at-20-25-19.jpg',
    badge: 'MuffInns Favorite',
    color: 'border-slate-400/30 text-slate-100'
  },
  {
    id: 'poster-coco-nello',
    title: 'Coco Nello Caramel Cake',
    subtitle: 'Glossy Caramel Lattice Grid & Cream Border',
    category: 'Cakes (Cream & Special)' as MenuCategory,
    searchKeyword: 'Coco Nello',
    image: 'https://i.ibb.co/7JTqyKyP/Whats-App-Image-2026-08-30-at-7-47-56-PM.jpg',
    badge: 'MuffInns Specialty',
    color: 'border-yellow-600/30 text-yellow-100'
  },
  {
    id: 'poster-pistachio-kunafa',
    title: 'Pistachio Kunafa Cake',
    subtitle: 'Authentic Pistachio Paste & Roasted Kunafa Crunch',
    category: 'Cakes (Cream & Special)' as MenuCategory,
    searchKeyword: 'Pistachio Kunafa',
    image: 'https://i.ibb.co/hRfq00Pt/Whats-App-Image-2026-07-21-at-20-25-20.jpg',
    badge: 'Eid Special',
    color: 'border-emerald-500/30 text-emerald-200'
  },
  {
    id: 'poster-oreo-shake',
    title: 'Oreo Shake',
    subtitle: 'Creamy Milkshake with Fudge Drizzle & Whipped Cream',
    category: 'Sundae & Cups' as MenuCategory,
    searchKeyword: 'Oreo Shake',
    image: 'https://i.ibb.co/jc3JPkZ/Whats-App-Image-2026-09-08-at-2-43-00-PM.jpg',
    badge: 'Cafe & Grill',
    color: 'border-cyan-500/30 text-cyan-200'
  },
  {
    id: 'poster-cappuccino',
    title: 'Cappuccino Coffee',
    subtitle: 'Hot Espresso with Spiderweb Chocolate Latte Art',
    category: 'Sundae & Cups' as MenuCategory,
    searchKeyword: 'Cappuccino',
    image: 'https://i.ibb.co/Y7y49jq5/Whats-App-Image-2026-09-08-at-2-42-57-PM.jpg',
    badge: 'Cafe & Grill',
    color: 'border-orange-500/30 text-orange-200'
  },
  {
    id: 'poster-rolled-ice-cream',
    title: 'Rolled Ice Cream',
    subtitle: 'Fresh Vanilla Ice Cream Rolls with Oreo & Sprinkles',
    category: 'Sundae & Cups' as MenuCategory,
    searchKeyword: 'Rolled Ice Cream',
    image: 'https://i.ibb.co/P05RLgj/Whats-App-Image-2026-09-08-at-2-42-59-PM.jpg',
    badge: 'Cafe & Grill',
    color: 'border-pink-500/30 text-pink-200'
  },
  {
    id: 'poster-red-velvet',
    title: 'Red Velvet Cake',
    subtitle: 'Bold Velvet Crumb Sides & Cream Spiral Top',
    category: 'Cakes (Cream & Special)' as MenuCategory,
    searchKeyword: 'Red Velvet',
    image: 'https://cdn.phototourl.com/free/2026-08-29-a18650e9-cebb-4b34-856a-519994f67778.jpg',
    badge: 'Luxury Tier',
    color: 'border-red-600/30 text-red-200'
  },
  {
    id: 'poster-oreo-cake-top',
    title: 'Oreo Special Cake',
    subtitle: 'Top View Round Cream Cake Ringed with Oreo Biscuits',
    category: 'Cakes (Cream & Special)' as MenuCategory,
    searchKeyword: 'Oreo Special',
    image: 'https://i.ibb.co/YTPkB88V/Whats-App-Image-2026-07-22-at-15-01-45.jpg',
    badge: 'Top Pick',
    color: 'border-indigo-500/30 text-indigo-200'
  },
  {
    id: 'poster-gajar-halwa',
    title: 'Special Gajar Halwa',
    subtitle: 'Desi Ghee Carrot Halwa with Cashews & Almonds',
    category: 'Traditional & Pateesa' as MenuCategory,
    searchKeyword: 'Gajar Halwa',
    image: 'https://i.ibb.co/B2ZXCgS5/Whats-App-Image-2026-08-31-at-4-52-45-PM.jpg',
    badge: 'Patashay Special',
    color: 'border-orange-500/30 text-orange-200'
  },
  {
    id: 'poster-almond-walnut-dry-cake',
    title: 'Almond Walnut & Pistachio Dry Cake',
    subtitle: 'Special Dry Cake Topped with Roasted Nuts & Pistachios',
    category: 'Cakes (Classic & Dry)' as MenuCategory,
    searchKeyword: 'Almond Walnut',
    image: 'https://i.ibb.co/tMmbLKPw/IMG-7598.jpg',
    badge: 'Patashay Specialty',
    color: 'border-amber-500/30 text-amber-200'
  },
  {
    id: 'poster-honey-cake',
    title: 'Signature Honey Cake',
    subtitle: 'Soft Layered Sponge Dusted with Honey Crumbs',
    category: 'Cakes (Cream & Special)' as MenuCategory,
    searchKeyword: 'Honey Cake',
    image: 'https://i.ibb.co/DHYzrB7p/Whats-App-Image-2026-08-30-at-7-47-52-PM.jpg',
    badge: 'MuffInns Favorite',
    color: 'border-amber-400/30 text-amber-100'
  },
  {
    id: 'poster-chocolate-tart',
    title: 'Gourmet Chocolate Tart',
    subtitle: 'Crispy Tart Shell filled with Swirled Chocolate Ganache',
    category: 'Buns, Croissants & Tarts' as MenuCategory,
    searchKeyword: 'Chocolate Tart',
    image: 'https://i.ibb.co/rGJkMj85/Whats-App-Image-2026-08-31-at-4-53-04-PM.jpg',
    badge: 'Patashay Confections',
    color: 'border-rose-500/30 text-rose-200'
  },
  {
    id: 'poster-almond-khatai',
    title: 'Royal Almond Khatai',
    subtitle: 'Golden Naan Khatai Cookies Topped with Whole Almonds',
    category: 'Biscuits & Cookies' as MenuCategory,
    searchKeyword: 'Almond Khatai',
    image: 'https://i.ibb.co/HpzsGBhB/Whats-App-Image-2026-08-31-at-4-53-05-PM.jpg',
    badge: 'Patashay Traditional',
    color: 'border-yellow-500/30 text-yellow-200'
  },
  {
    id: 'poster-bento-cakes-collection',
    title: 'Bento Cakes Collection',
    subtitle: 'Heart Themed, Floral & Lotus Bento Cakes',
    category: 'Cakes (Cream & Special)' as MenuCategory,
    searchKeyword: 'Bento Cake',
    image: 'https://i.ibb.co/mKGS7Rp/Whats-App-Image-2026-08-31-at-4-52-55-PM.jpg',
    badge: 'Best Seller',
    color: 'border-pink-500/30 text-pink-200'
  },
  {
    id: 'poster-pure-milk',
    title: 'Pure Flavored Milk',
    subtitle: 'Almond & Pistachio Chilled Dairy Happiness Bottle',
    category: 'Sundae & Cups' as MenuCategory,
    searchKeyword: 'Pure Milk',
    image: 'https://i.ibb.co/x86WYVC8/Whats-App-Image-2026-08-31-at-4-52-57-PM.jpg',
    badge: 'Dairy Happiness',
    color: 'border-sky-500/30 text-sky-200'
  },
  {
    id: 'poster-multi-grain-bread',
    title: 'Multi Grain Health Bread',
    subtitle: 'Hearty Whole-Grain Loaf Baked with Organic Seeds & Nuts',
    category: 'Breads' as MenuCategory,
    searchKeyword: 'Multi Grain',
    image: 'https://i.ibb.co/gbrdCkvj/Whats-App-Image-2026-08-31-at-4-52-56-PM.jpg',
    badge: 'Healthy Choice',
    color: 'border-emerald-500/30 text-emerald-200'
  },
  {
    id: 'poster-mothers-day-bento',
    title: "Mother's Day Special Drip Cakes",
    subtitle: 'Custom Mini Drip Cakes with Macarons & Floral Cake Toppers',
    category: 'Cakes (Cream & Special)' as MenuCategory,
    searchKeyword: 'Bento Cake',
    image: 'https://i.ibb.co/JRbJ4np8/Whats-App-Image-2026-08-31-at-4-53-05-PM.jpg',
    badge: 'Special Edition',
    color: 'border-rose-400/30 text-rose-100'
  },
  {
    id: 'poster-biscuits-tier',
    title: '3-Tier Biscuits & Cookies Tower',
    subtitle: 'Assorted Bakery Cookies, Jam Rings & Almond Biscuits',
    category: 'Biscuits & Cookies' as MenuCategory,
    searchKeyword: 'Biscuits & Cookies',
    image: 'https://i.ibb.co/mVPxn44G/Whats-App-Image-2026-08-30-at-7-47-53-PM.jpg',
    badge: 'Party Tower',
    color: 'border-amber-600/30 text-amber-200'
  }
];
import { 
  getStoredMenuItems, 
  syncMenuItemsFromServer, 
  getCategoryFallbackImage 
} from '../utils/menuStorage';
import {
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  DEFAULT_SUGGESTIONS
} from '../utils/searchHistory';
import { Clock, Trash2 } from 'lucide-react';

interface MenuSectionProps {
  onAddToCart: (cartItem: CartItem) => void;
  onNavigateToCart: () => void;
  initialSearchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOrderPlaced?: (order: Order) => void;
}

const CATEGORIES: MenuCategory[] = [
  'Breads',
  'Buns, Croissants & Tarts',
  'Sweets',
  'Biscuits & Cookies',
  'Muffins & Desserts',
  'Pastries & Brownies',
  'Traditional & Pateesa',
  'Savory Snacks',
  'Sundae & Cups',
  'Pattiess, Puffs & Donuts',
  'Cakes (Classic & Dry)',
  'Cakes (Cream & Special)'
];

export default function MenuSection({ 
  onAddToCart, 
  onNavigateToCart,
  initialSearchQuery = '',
  onSearchChange,
  onOrderPlaced
}: MenuSectionProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => getStoredMenuItems());
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());
  const [selectedPosterModal, setSelectedPosterModal] = useState<typeof OFFICIAL_POSTERS[0] | null>(null);
  const [isHeadBakerOpen, setIsHeadBakerOpen] = useState(false);
  const [quickOrderItem, setQuickOrderItem] = useState<MenuItem | null>(null);

  // Sync with initialSearchQuery if updated externally
  useEffect(() => {
    if (initialSearchQuery !== undefined && initialSearchQuery !== searchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Sync recent searches from localStorage
  useEffect(() => {
    const handleUpdate = () => {
      setRecentSearches(getRecentSearches());
    };

    window.addEventListener('muffinns_recent_searches_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('muffinns_recent_searches_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Sync menu items on mount & listen to updates
  useEffect(() => {
    // Initial sync from server
    syncMenuItemsFromServer().then(items => setMenuItems(items));

    const handleMenuUpdate = () => {
      setMenuItems(getStoredMenuItems());
    };

    window.addEventListener('muffinns_menu_updated', handleMenuUpdate);
    return () => {
      window.removeEventListener('muffinns_menu_updated', handleMenuUpdate);
    };
  }, []);
  
  // Custom customization modal states
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeOption | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  
  // Confirmed add indicator
  const [addedIndicatorId, setAddedIndicatorId] = useState<string | null>(null);

  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleExecuteSearch = (val: string) => {
    const trimmed = val.trim();
    if (trimmed) {
      saveRecentSearch(trimmed);
      setRecentSearches(getRecentSearches());
    }
    handleQueryChange(val);
  };

  // Filter items based on search and selected category
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Handle immediate add or quick order information form modal
  const handleItemAction = (item: MenuItem) => {
    // When user clicks plus icon, open the information form modal
    setQuickOrderItem(item);
  };

  const handleConfirmCustomization = () => {
    if (!customizingItem) return;
    onAddToCart({
      item: customizingItem,
      selectedSize: selectedSize,
      quantity,
      notes: notes.trim() ? notes.trim() : undefined
    });
    triggerAddedIndicator(customizingItem.id);
    setCustomizingItem(null);
  };

  const triggerAddedIndicator = (id: string) => {
    setAddedIndicatorId(id);
    setTimeout(() => {
      setAddedIndicatorId(null);
    }, 1500);
  };

  return (
    <section className="py-12 px-4 bg-brand-sugar" id="menu-section">
      <div className="container mx-auto max-w-7xl">
        
        {/* Title Block */}
        <div className="text-center max-w-2xl mx-auto mb-6 space-y-3">
          <h2 className="text-4xl font-serif text-brand-chocolate font-bold">Our Gourmet Catalog</h2>
          <p className="text-sm text-brand-caramel font-semibold uppercase tracking-widest">Handcrafted Delicacies & Bakers</p>
          <div className="w-16 h-1 bg-brand-honey mx-auto rounded-full mt-2" />
        </div>

        {/* TOP SEARCH INPUT BAR */}
        <div className="max-w-3xl mx-auto mb-8 relative">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteSearch(searchQuery);
            }}
            className={`relative shadow-xl rounded-2xl p-2.5 sm:p-3 transition-all duration-300 ease-out ${
              isInputFocused || searchQuery 
                ? 'bg-amber-50/95 border-2 border-amber-600 ring-4 ring-amber-500/25 shadow-amber-500/15' 
                : 'bg-white/95 border border-brand-caramel/30 hover:border-brand-caramel/60 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3 px-3">
              <Search className={`w-6 h-6 shrink-0 transition-all duration-300 ease-out ${
                isInputFocused || searchQuery ? 'text-amber-600 scale-110 drop-shadow-xs' : 'text-brand-caramel/70 scale-100'
              }`} />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  setIsInputFocused(true);
                  setRecentSearches(getRecentSearches());
                }}
                onBlur={() => {
                  // Delay blur slightly so clicks inside dropdown register
                  setTimeout(() => setIsInputFocused(false), 200);
                }}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteSearch(searchQuery);
                  }
                }}
                placeholder="Search menu items by name or category (e.g. Sweets, Cake, Sundae, Breads, Cookies)..."
                className={`w-full py-2 bg-transparent text-base sm:text-lg tracking-wide focus:outline-none transition-all duration-300 ease-out ${
                  isInputFocused || searchQuery
                    ? 'text-amber-950 font-black placeholder:text-stone-400'
                    : 'text-brand-chocolate/80 font-bold placeholder:text-brand-chocolate/40'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleQueryChange('')}
                  className="p-1.5 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-950 hover:text-black transition-all duration-200 cursor-pointer shrink-0 font-bold shadow-xs active:scale-95"
                  title="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Category/Keyword Filter Chips */}
            <div className="mt-2.5 pt-2.5 border-t border-brand-caramel/15 flex items-center justify-between text-xs px-2 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-brand-caramel uppercase tracking-wider shrink-0">Quick Filter:</span>
                {['Sweets', 'Cakes', 'Muffins', 'Cookies', 'Croissants', 'Halwa', 'Breads', 'Savory'].map((tag) => (
                  <button
                    key={`quick-tag-${tag}`}
                    type="button"
                    onClick={() => {
                      const next = searchQuery.toLowerCase() === tag.toLowerCase() ? '' : tag;
                      if (next) {
                        handleExecuteSearch(next);
                      } else {
                        handleQueryChange('');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      searchQuery.toLowerCase() === tag.toLowerCase()
                        ? 'bg-amber-600 text-white font-extrabold shadow-sm scale-105'
                        : 'bg-brand-cream/90 hover:bg-brand-caramel/20 text-brand-chocolate'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {searchQuery && (
                <span className="text-[11px] font-extrabold text-amber-950 bg-amber-200/80 px-3 py-1 rounded-full border border-amber-400/80 shrink-0 shadow-xs">
                  {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
                </span>
              )}
            </div>
          </form>

          {/* RECENT SEARCHES DROPDOWN ON FOCUS */}
          <AnimatePresence>
            {isInputFocused && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-2 bg-brand-sugar border border-brand-caramel/30 rounded-2xl shadow-2xl z-40 overflow-hidden text-brand-chocolate backdrop-blur-xl"
              >
                {recentSearches.length > 0 ? (
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between px-1.5 pb-1.5 border-b border-brand-caramel/15">
                      <span className="text-[11px] font-black uppercase tracking-wider text-brand-caramel flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-caramel" />
                        <span>Recent Searches</span>
                      </span>

                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          clearRecentSearches();
                          setRecentSearches([]);
                        }}
                        className="text-[11px] text-stone-500 hover:text-red-600 transition-colors flex items-center gap-1 font-bold cursor-pointer hover:underline"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear all</span>
                      </button>
                    </div>

                    <div className="max-h-52 overflow-y-auto py-1 space-y-0.5 scrollbar-thin scrollbar-thumb-brand-caramel/20">
                      {recentSearches.map((term, index) => (
                        <div
                          key={`menu-recent-${index}-${term}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleExecuteSearch(term);
                            setIsInputFocused(false);
                          }}
                          className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-brand-cream/80 group transition-all cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                            <Clock className="w-3.5 h-3.5 text-brand-honey/80 group-hover:text-brand-caramel shrink-0" />
                            <span className="truncate font-medium text-brand-chocolate group-hover:text-brand-caramel">
                              {term}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const updated = removeRecentSearch(term);
                                setRecentSearches(updated);
                              }}
                              className="p-1 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              title={`Remove "${term}" from history`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <ArrowRight className="w-3.5 h-3.5 text-brand-caramel opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 text-center border-b border-brand-caramel/10">
                    <p className="text-xs text-stone-500 font-medium">
                      No recent searches in storage. Search any delicacy or pick a suggestion below!
                    </p>
                  </div>
                )}

                {/* Popular / Suggested items */}
                <div className="p-3.5 bg-brand-cream/40 border-t border-brand-caramel/15 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-honey flex items-center gap-1 px-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Popular Delicacies</span>
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_SUGGESTIONS.map((sug, idx) => (
                      <button
                        key={`menu-sug-${idx}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleExecuteSearch(sug);
                          setIsInputFocused(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-brand-sugar hover:bg-brand-caramel/15 border border-brand-caramel/15 text-[11px] font-bold text-brand-chocolate hover:text-brand-caramel transition-all cursor-pointer shadow-2xs"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive 'Ask the Head Baker' Quick Inspiration Card */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setIsHeadBakerOpen(true)}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-stone-950 text-white border-2 border-amber-500/60 hover:border-amber-400 shadow-xl group transition-all cursor-pointer text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-1/3 w-32 h-32 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 p-0.5 shadow-md shrink-0 flex items-center justify-center group-hover:rotate-6 transition-transform">
                  <div className="w-full h-full bg-stone-900 rounded-2xl flex items-center justify-center text-amber-300">
                    <ChefHat className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-amber-300 font-serif tracking-wide">
                      Ask the Head Baker
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-black border border-pink-400 flex items-center gap-1 shadow-xs">
                      <Film className="w-3 h-3 text-white" />
                      <span>Live Video Reel & Tips</span>
                    </span>
                  </div>
                  <p className="text-xs text-stone-200 font-medium line-clamp-1">
                    Tap to explore summer pairing advice, serving temperatures, & viral confectionery footage!
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 text-stone-950 font-black text-xs border border-amber-300 group-hover:bg-amber-300 transition-all shrink-0 shadow-sm">
                <span>Open Baker's Table</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Official Brand Posters Showcase */}
        <div className="mb-10 bg-gradient-to-br from-brand-chocolate via-stone-900 to-brand-caramel/90 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-brand-honey/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-honey/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-brand-honey/20 text-brand-cream border border-brand-honey/30 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-honey animate-pulse" />
                Featured Banners & Official Creations
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
                Patashay & MuffInns Signature Banners
              </h3>
              <p className="text-xs text-brand-cream/80 mt-1 max-w-xl">
                Tap any official advertisement poster below to view, filter, or order these handcrafted delicacies instantly.
              </p>
            </div>

            {(selectedCategory !== 'All' || searchQuery) && (
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="self-start sm:self-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-xl backdrop-blur border border-white/20 transition-all text-brand-cream"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 relative z-10">
            {OFFICIAL_POSTERS.map((poster, pIdx) => (
              <motion.div
                key={`poster-${poster.id}-${pIdx}`}
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedPosterModal(poster)}
                className="group relative h-64 sm:h-72 rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-white/15 bg-stone-900/60"
              >
                <img
                  src={poster.image}
                  alt={poster.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:from-black/95" />

                <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-start">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-brand-cream backdrop-blur border border-white/20 uppercase tracking-wider">
                    {poster.badge}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 space-y-1">
                  <h4 className="text-sm font-serif font-bold text-white leading-tight group-hover:text-brand-cream transition-colors">
                    {poster.title}
                  </h4>
                  <p className="text-[10px] text-white/80 line-clamp-2 leading-snug">
                    {poster.subtitle}
                  </p>
                  <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-brand-cream group-hover:underline">
                    <span>View Poster Banner</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Search and Quick Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-center">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-caramel/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sweets, tarts, savory, buns, custom cakes..."
              className="w-full pl-12 pr-4 py-3.5 bg-brand-cream/60 rounded-xl font-sans text-brand-chocolate placeholder-brand-caramel/40 focus:outline-none focus:ring-2 focus:ring-brand-caramel/20 focus:bg-white border border-brand-caramel/10 transition-all text-sm shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold hover:text-brand-caramel text-brand-chocolate/40"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToCart}
              className="w-full md:w-auto px-6 py-3.5 bg-brand-marshmallow hover:bg-brand-caramel hover:text-brand-cream border border-brand-caramel/15 text-brand-caramel rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Review Cart Checkout</span>
            </motion.button>
          </div>
        </div>

        {/* Category Carousel (Horizontal Scroll with Gradient edge) */}
        <div className="relative mb-8">
          <div className="flex gap-2.5 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-5 py-2.5 rounded-full font-medium text-xs whitespace-nowrap transition-all shadow-sm cursor-pointer border ${
                selectedCategory === 'All'
                  ? 'bg-brand-caramel border-brand-caramel text-brand-cream'
                  : 'bg-brand-cream hover:bg-brand-cream/80 border-brand-caramel/10 text-brand-chocolate'
              }`}
            >
              All Categories ({menuItems.length})
            </button>
            
            {CATEGORIES.map((category, cIdx) => {
              const count = menuItems.filter(item => item.category === category).length;
              return (
                <button
                  key={`category-${category}-${cIdx}`}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2.5 rounded-full font-medium text-xs whitespace-nowrap transition-all shadow-sm cursor-pointer border ${
                    selectedCategory === category
                      ? 'bg-brand-caramel border-brand-caramel text-brand-cream'
                      : 'bg-brand-cream hover:bg-brand-cream/80 border-brand-caramel/10 text-brand-chocolate'
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
          {/* Subtle Right Shadow Fade indicator */}
          <div className="absolute right-0 top-0 h-10 w-8 bg-gradient-to-l from-brand-sugar to-transparent pointer-events-none" />
        </div>

        {/* Filter results label */}
        <p className="text-xs text-brand-chocolate/60 mb-6 font-medium uppercase tracking-wider">
          Displaying {filteredItems.length} of {menuItems.length} products
        </p>

        {/* Products Grid with animation stagger */}
        <motion.div 
          id="catalog-items-grid"
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => {
              const isAdded = addedIndicatorId === item.id;
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ 
                    y: -6, 
                    scale: 1.022,
                    boxShadow: "0 20px 25px -5px rgba(61, 34, 19, 0.1), 0 10px 10px -5px rgba(61, 34, 19, 0.04)"
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 110, 
                    damping: 15,
                    delay: Math.min(index * 0.03, 0.3)
                  }}
                  key={`menu-item-${item.id}`}
                  className="party-3d-card glossy-card rounded-2xl bg-brand-sugar border border-brand-caramel/10 overflow-hidden shadow-xs hover:border-brand-caramel/25 group flex flex-col justify-between transition-colors duration-300"
                >
                  <div className="relative aspect-[4/3] w-full bg-brand-cream overflow-hidden">
                    {/* Item Image with referrerPolicy & fallback */}
                    <motion.img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.06 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.failed) {
                          target.dataset.failed = 'true';
                          target.src = getCategoryFallbackImage(item.category);
                        }
                      }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-chocolate/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Badge */}
                    {item.badge && (
                      <motion.span 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="absolute top-3 left-3 bg-brand-caramel/90 backdrop-blur-md border border-brand-cream/10 text-brand-cream text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm"
                      >
                        {item.badge}
                      </motion.span>
                    )}

                    {/* Portion sizes indicator */}
                    {item.sizes && (
                      <motion.span 
                        whileHover={{ scale: 1.05 }}
                        className="absolute bottom-3 right-3 bg-brand-sugar/90 backdrop-blur-md text-[10px] text-brand-caramel font-bold px-2 py-0.5 rounded border border-brand-caramel/10 cursor-pointer"
                      >
                        {item.sizes.length} Options
                      </motion.span>
                    )}
                  </div>

                  {/* Core Content */}
                  <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-brand-honey uppercase tracking-wider">
                        {item.category}
                      </p>
                      <h3 className="text-lg font-serif font-bold text-brand-chocolate group-hover:text-brand-caramel transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-brand-chocolate/70 line-clamp-2 h-8 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-brand-caramel/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-brand-chocolate/40 font-medium">Price starting at</span>
                        <span className="text-base font-bold text-brand-caramel font-sans">
                          Rs. {item.sizes ? Math.min(...item.sizes.map(s => s.price)) : item.basePrice}
                        </span>
                      </div>

                      {/* Add Button with toggle success style */}
                      <motion.button
                        key={`menu-item-btn-${item.id}-${isAdded ? "added" : "not-added"}`}
                        initial={{ scale: 0.85 }}
                        animate={{ scale: isAdded ? 1.05 : 1 }}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: "spring", stiffness: 400, damping: 14 }}
                        onClick={() => handleItemAction(item)}
                        className={`party-pop-btn glossy-btn w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-sm transition-colors duration-300 ${
                          isAdded 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-brand-caramel text-brand-cream hover:bg-brand-chocolate'
                        }`}
                      >
                        {isAdded ? (
                          <motion.span
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 12 }}
                          >
                            <Check className="w-4 h-4" />
                          </motion.span>
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty Search State */}
        {filteredItems.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 px-4 glass-panel rounded-2xl max-w-lg mx-auto border border-dashed border-brand-caramel/20 mt-10"
          >
            <Info className="w-12 h-12 text-brand-honey mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-serif text-brand-chocolate font-bold mb-2">No baked delicacies found</h3>
            <p className="text-sm text-brand-chocolate/60 leading-relaxed mb-6">
              We couldn't match "{searchQuery}" in our recipe collection. Please check for spelling mistakes, or ask our Sweet Butler AI assistant for suggestions!
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-6 py-2.5 bg-brand-caramel hover:bg-brand-chocolate text-brand-cream font-medium rounded-full text-xs shadow-md transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </motion.div>
        )}

      </div>

      {/* ================= PORTION CUSTOMIZATION OVERLAY MODAL ================= */}
      <AnimatePresence>
        {customizingItem && (
          <motion.div 
            key={`customize-modal-overlay-${customizingItem.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-chocolate/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              key={`customize-modal-panel-${customizingItem.id}`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-brand-sugar rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-brand-caramel/10 flex flex-col"
            >
              {/* Header Image */}
              <div className="relative aspect-[16/9] bg-brand-cream">
                <img
                  src={customizingItem.image}
                  alt={customizingItem.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.failed) {
                      target.dataset.failed = 'true';
                      target.src = getCategoryFallbackImage(customizingItem.category);
                    }
                  }}
                />
                <button
                  onClick={() => setCustomizingItem(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-brand-chocolate/60 hover:bg-brand-chocolate text-brand-cream flex items-center justify-center transition-colors shadow-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-brand-chocolate/80 via-brand-chocolate/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 text-brand-cream">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-brand-honey block mb-0.5">
                    {customizingItem.category}
                  </span>
                  <h4 className="text-xl font-serif font-bold">{customizingItem.name}</h4>
                </div>
              </div>

              {/* Scrollable Customizer Panel */}
              <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh] text-brand-chocolate">
                
                {/* Description */}
                <p className="text-xs text-brand-chocolate/80 leading-relaxed font-sans">
                  {customizingItem.description}
                </p>

                {/* Size Selection */}
                {customizingItem.sizes && (
                  <div className="space-y-2.5">
                    <label className="text-xs uppercase tracking-wider font-bold text-brand-caramel">Select Portion / Weight Option</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {customizingItem.sizes.map((size, sIdx) => (
                        <button
                          key={`size-${size.label}-${sIdx}`}
                          onClick={() => setSelectedSize(size)}
                          className={`p-3 rounded-xl border font-sans text-xs flex flex-col space-y-1 transition-all cursor-pointer ${
                            selectedSize?.label === size.label
                              ? 'bg-brand-caramel/10 border-brand-caramel text-brand-caramel font-bold shadow-sm'
                              : 'bg-brand-cream border-brand-caramel/10 text-brand-chocolate hover:bg-brand-cream/60'
                          }`}
                        >
                          <span className="font-semibold">{size.label}</span>
                          <span className="text-brand-caramel font-bold">Rs. {size.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Instruction Notes */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs uppercase tracking-wider font-bold text-brand-caramel">Baker Instructions (Optional)</label>
                    <span className="text-[10px] text-brand-chocolate/40 font-medium">Max 80 chars</span>
                  </div>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, 80))}
                    placeholder="e.g. Write 'Happy Birthday Laiqa' or 'No Egg'..."
                    className="w-full px-3 py-2.5 bg-brand-cream border border-brand-caramel/10 focus:outline-none focus:ring-1 focus:ring-brand-caramel text-xs rounded-xl"
                  />
                </div>

                {/* Quantity and Checkout pricing */}
                <div className="flex items-center justify-between pt-4 border-t border-brand-caramel/10">
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-wider font-bold text-brand-caramel">Portions</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-7 h-7 rounded-full bg-brand-cream hover:bg-brand-caramel/15 border border-brand-caramel/10 flex items-center justify-center cursor-pointer text-brand-caramel"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(q => q + 1)}
                        className="w-7 h-7 rounded-full bg-brand-cream hover:bg-brand-caramel/15 border border-brand-caramel/10 flex items-center justify-center cursor-pointer text-brand-caramel"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-brand-chocolate/40 block font-medium">Estimated Item Cost</span>
                    <span className="text-xl font-bold text-brand-caramel font-sans">
                      Rs. {((selectedSize ? selectedSize.price : customizingItem.basePrice) * quantity).toLocaleString()}
                    </span>
                  </div>
                </div>

              </div>

              {/* Confirm Bottom Bar */}
              <div className="bg-brand-cream p-4 border-t border-brand-caramel/5 flex gap-3">
                <button
                  onClick={() => setCustomizingItem(null)}
                  className="flex-1 py-3 text-brand-chocolate hover:text-brand-caramel font-medium text-xs rounded-xl transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCustomization}
                  className="flex-1 py-3 bg-brand-caramel hover:bg-brand-chocolate text-brand-cream font-medium text-xs rounded-xl shadow-md transition-colors cursor-pointer text-center"
                >
                  Confirm & Add to Cart
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-Resolution Poster Lightbox Modal */}
      <AnimatePresence>
        {selectedPosterModal && (
          <motion.div
            key="poster-lightbox-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedPosterModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-3xl w-full bg-stone-900 border border-brand-honey/30 rounded-3xl overflow-hidden shadow-2xl text-white my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPosterModal(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur border border-white/20 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* High-Res Image Display */}
              <div className="relative h-80 sm:h-96 md:h-[420px] w-full bg-black overflow-hidden flex items-center justify-center">
                <img
                  src={selectedPosterModal.image}
                  alt={selectedPosterModal.title}
                  className="w-full h-full object-cover sm:object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent pointer-events-none" />
                
                <span className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-bold bg-brand-chocolate/80 text-brand-cream border border-brand-honey/40 shadow-lg backdrop-blur">
                  {selectedPosterModal.badge}
                </span>
              </div>

              {/* Poster Details & Action */}
              <div className="p-6 sm:p-8 space-y-4 relative -mt-6 z-10 bg-stone-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-brand-honey uppercase tracking-wider block mb-1">
                      Category: {selectedPosterModal.category}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                      {selectedPosterModal.title}
                    </h3>
                    <p className="text-sm text-brand-cream/80 mt-1">
                      {selectedPosterModal.subtitle}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={() => {
                        setSelectedCategory(selectedPosterModal.category);
                        setSearchQuery(selectedPosterModal.searchKeyword);
                        setSelectedPosterModal(null);
                      }}
                      className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Filter In Catalog</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCategory(selectedPosterModal.category);
                        setSearchQuery(selectedPosterModal.searchKeyword);
                        setSelectedPosterModal(null);
                        // Scroll down to matching item
                        document.getElementById('catalog-items-grid')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-caramel to-amber-600 hover:from-amber-600 hover:to-brand-caramel text-brand-cream font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Locate & Order Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating 'Ask the Head Baker' Action Button in Menu View */}
      <div className="fixed bottom-6 left-5 sm:left-7 z-40">
        <motion.button
          type="button"
          onClick={() => setIsHeadBakerOpen(true)}
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-stone-950 via-amber-950 to-stone-950 text-white border-2 border-amber-500/70 shadow-2xl hover:shadow-amber-500/30 hover:border-amber-400 transition-all cursor-pointer group"
          aria-label="Ask the Head Baker for seasonal recommendations and video reels"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 p-0.5 flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform">
              <div className="w-full h-full bg-stone-900 rounded-full flex items-center justify-center text-amber-300">
                <ChefHat className="w-4 h-4" />
              </div>
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-stone-900 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-stone-900" />
          </div>

          <div className="text-left pr-1">
            <span className="text-xs font-black tracking-wide text-white block leading-tight">
              Ask Head Baker
            </span>
            <span className="text-[9px] text-amber-400 font-extrabold uppercase tracking-wider block leading-none flex items-center gap-1">
              <span>Seasonal Tips & Reel</span>
              <Film className="w-2.5 h-2.5 text-pink-400" />
            </span>
          </div>
        </motion.button>
      </div>

      {/* Ask the Head Baker Interactive Modal */}
      <AskHeadBakerModal
        isOpen={isHeadBakerOpen}
        onClose={() => setIsHeadBakerOpen(false)}
        onAddToCart={onAddToCart}
        onFilterMenu={(category, search) => {
          setSelectedCategory(category as any);
          setSearchQuery(search);
          document.getElementById('catalog-items-grid')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Quick Order Customer Information Form Modal */}
      <QuickOrderModal
        isOpen={!!quickOrderItem}
        onClose={() => setQuickOrderItem(null)}
        item={quickOrderItem}
        onAddToCart={onAddToCart}
        onOrderPlaced={(order) => {
          if (onOrderPlaced) {
            onOrderPlaced(order);
          }
        }}
      />

    </section>
  );
}
