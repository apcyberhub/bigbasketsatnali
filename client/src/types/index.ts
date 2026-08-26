export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  isActive: boolean;
  createdAt?: string;
  addresses?: Address[];
}

export interface Address {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode: string;
  addressType: 'HOME' | 'WORK' | 'OTHER';
  isDefault: boolean;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Review {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
  user?: {
    name: string;
  };
}

export interface Product {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  brand: string;
  sku: string;
  price: number;
  mrp: number;
  discount: number;
  unit: string;
  weight?: string | null;
  stock: number;
  lowStockThreshold: number;
  mainImage?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  tags?: string | null;
  rating: number;
  reviewCount: number;
  createdAt: string;
  category?: Category;
  images?: ProductImage[];
  reviews?: Review[];
}

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  slug: string;
  brand: string;
  unit: string;
  price: number;
  mrp: number;
  discount: number;
  mainImage?: string | null;
  stock: number;
  isActive: boolean;
  quantity: number;
  subtotal: number;
}

export interface CartSummary {
  id: number;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  totalMrp: number;
  savings: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

export interface WishlistItem {
  id: number;
  productId: number;
  product: Product;
  createdAt: string;
}

export interface Coupon {
  id: number;
  code: string;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usageCount?: number;
  expiryDate?: string | null;
  isActive: boolean;
}

export interface DeliverySlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  formattedSlot?: string;
  capacity: number;
  bookedCount?: number;
  isAvailable?: boolean;
  remainingCapacity?: number;
  isActive: boolean;
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string | null;
  image: string;
  ctaText?: string | null;
  linkUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productBrand: string;
  productUnit: string;
  productImage?: string | null;
  price: number;
  mrp: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  couponCode?: string | null;
  paymentMethod: 'COD' | 'ONLINE' | 'RAZORPAY';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'COD_PENDING' | 'REFUNDED';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  deliveryAddressSnapshot: string;
  deliveryAddress?: Partial<Address>;
  deliverySlot?: string | null;
  notes?: string | null;
  cancellationReason?: string | null;
  itemCount?: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface DashboardMetrics {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
}

export interface DashboardStats {
  metrics: DashboardMetrics;
  salesChart: { date: string; revenue: number; orders: number }[];
  recentOrders: Order[];
  lowStockProducts: Product[];
}
