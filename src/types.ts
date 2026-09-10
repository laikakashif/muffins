export type MenuCategory =
  | 'Breads'
  | 'Buns, Croissants & Tarts'
  | 'Sweets'
  | 'Biscuits & Cookies'
  | 'Muffins & Desserts'
  | 'Pastries & Brownies'
  | 'Traditional & Pateesa'
  | 'Savory Snacks'
  | 'Sundae & Cups'
  | 'Pattiess, Puffs & Donuts'
  | 'Cakes (Classic & Dry)'
  | 'Cakes (Cream & Special)';

export interface SizeOption {
  label: string; // e.g., 'S', 'L', '1P', '2P', '1.5 lb', '1 lb'
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  description: string;
  basePrice: number; // For single size, or minimum price
  sizes?: SizeOption[];
  image: string; // Polished stock image URL
  badge?: string; // e.g., 'Best Seller', 'Seasonal', 'Chef Special'
}

export interface CartItem {
  item: MenuItem;
  selectedSize?: SizeOption;
  quantity: number;
  notes?: string;
}

export type OrderStatus =
  | 'New'
  | 'Processing'
  | 'Delivered'
  | 'Cancelled'
  | 'Pending'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Completed';

export interface Order {
  id: string;
  order_id?: string;
  customerName?: string;
  customer_name?: string;
  customerPhone?: string;
  phone?: string;
  customerAddress?: string;
  address?: string;
  city?: string;
  items: any[];
  totalAmount?: number;
  total_price?: number;
  status: OrderStatus;
  paymentMethod?: 'Credit / Debit Card' | 'Mobile Wallet' | 'Bank Transfer' | 'Cash on Delivery' | string;
  paymentReference?: string;
  paymentProofUrl?: string;
  createdAt?: string;
  created_at?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  rating?: number;
  status: 'Unread' | 'In Progress' | 'Resolved';
  createdAt: string;
}

export interface FavoriteOrderItem {
  id: string;
  itemId: string;
  name: string;
  price: number;
  size?: string;
  notes?: string;
  image?: string;
  category?: string;
  savedAt?: string;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalInquiries: number;
  salesData: { date: string; amount: number }[];
  categorySales: { category: string; count: number }[];
}
