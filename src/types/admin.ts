import type { ProductGender } from "@/types/product";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types/order";
import type { ReviewModerationStatus } from "@/types/review";

export type AdminSection =
  | "dashboard"
  | "orders"
  | "payments"
  | "customers"
  | "products"
  | "inventory"
  | "analytics"
  | "reviews";

export type AdminOrderStatus =
  | "pending"
  | "payment_verification"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: AdminOrderStatus;
  grandTotal: number;
  createdAt: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
};

export type AdminPayment = {
  id: string;
  orderId: string;
  orderNumber: string;
  method: Exclude<PaymentMethod, "cod">;
  status: PaymentStatus;
  senderNumber: string;
  transactionId: string;
  amount: number;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
};

export type AdminCustomer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  district?: string;
  createdAt?: string;
  orders: Array<{
    orderNumber: string;
    status: OrderStatus | AdminOrderStatus;
    grandTotal: number;
    createdAt: string;
  }>;
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  inspiredBy: string;
  gender: ProductGender;
  description: string;
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  longevity: string;
  occasion: string;
  image: string;
  imageUrl?: string;
  imagePath?: string;
  isActive: boolean;
  variants: AdminProductVariant[];
};

export type AdminProductVariant = {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  sizeMl: 15 | 30;
  sizeLabel: "15ml" | "30ml";
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  updatedAt?: string;
};

export type AdminProductInput = Omit<AdminProduct, "id" | "variants"> & {
  id?: string;
  size15mlPrice: number;
  size15mlStock: number;
  size30mlPrice: number;
  size30mlStock: number;
  lowStockThreshold: number;
};

export type AdminReview = {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  reviewText: string;
  verifiedPurchase: boolean;
  isApproved: boolean;
  moderationStatus: ReviewModerationStatus;
  createdAt: string;
};

export type AdminReviewStatistics = {
  totalReviews: number;
  averageRating: number;
  pendingReviews: number;
  approvedReviews: number;
};

export type AdminDashboardSummary = {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  pendingPaymentVerifications: number;
  totalInventoryUnits: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  recentOrders: AdminOrder[];
};

export type AdminAnalyticsMetricCards = {
  totalRevenue: number;
  revenueToday: number;
  revenueThisMonth: number;
  totalOrders: number;
  ordersToday: number;
  ordersThisMonth: number;
  pendingPayments: number;
  lowStockProducts: number;
  outOfStockProducts: number;
};

export type AdminTrendPoint = {
  date: string;
  revenue: number;
  orders: number;
};

export type AdminBestSeller = {
  productName: string;
  productSlug: string;
  quantity: number;
  revenue: number;
};

export type AdminBestSellingSize = {
  sizeLabel: "15ml" | "30ml";
  quantity: number;
  revenue: number;
};

export type AdminPaymentActivity = {
  id: string;
  orderNumber: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  updatedAt: string;
};

export type AdminAnalytics = {
  overview: AdminAnalyticsMetricCards;
  bestSellers: {
    bestSellingProduct?: AdminBestSeller;
    bestSellingSize?: AdminBestSellingSize;
    topProducts: AdminBestSeller[];
  };
  trends: AdminTrendPoint[];
  inventory: {
    totalInventoryUnits: number;
    lowStockVariants: number;
    outOfStockVariants: number;
  };
  recentActivity: {
    orders: AdminOrder[];
    payments: AdminPaymentActivity[];
  };
  reviewStatistics: AdminReviewStatistics;
};
