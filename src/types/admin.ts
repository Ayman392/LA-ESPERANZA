import type { ProductGender } from "@/types/product";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types/order";

export type AdminSection =
  | "dashboard"
  | "orders"
  | "payments"
  | "customers"
  | "products"
  | "inventory";

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
  size15mlPrice: number;
  size30mlPrice: number;
  stock: number;
  lowStockThreshold: number;
  image: string;
  isActive: boolean;
};

export type AdminProductInput = Omit<AdminProduct, "id"> & {
  id?: string;
};

export type AdminDashboardSummary = {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  pendingPaymentVerifications: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  recentOrders: AdminOrder[];
};
