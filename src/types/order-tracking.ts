import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/order";

export type OrderTrackingRequest = {
  orderNumber: string;
  phone: string;
};

export type TrackedOrderItem = {
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type TrackedOrder = {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    deliveryAddress: string;
    district: string;
  };
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    senderNumber?: string;
    transactionId?: string;
  } | null;
  items: TrackedOrderItem[];
  totals: {
    subtotal: number;
    deliveryCharge: number;
    grandTotal: number;
  };
};
