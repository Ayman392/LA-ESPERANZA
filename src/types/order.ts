import type { CartProductSize } from "@/types/cart";

export type PaymentMethod = "cod" | "bkash" | "nagad";

export type CheckoutFormValues = {
  customerName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  district: string;
  notes: string;
  paymentMethod: PaymentMethod;
  senderNumber: string;
  transactionId: string;
};

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormValues, string>>;

export type OrderItem = {
  productId: string;
  slug: string;
  name: string;
  inspiredBy: string;
  size: CartProductSize;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: string;
};

export type OrderTotals = {
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
};

export type SavedOrder = {
  id?: string;
  orderNumber: string;
  customerId?: string;
  customer: Pick<
    CheckoutFormValues,
    "customerName" | "phone" | "email" | "deliveryAddress" | "district" | "notes"
  >;
  payment: {
    method: PaymentMethod;
    senderNumber?: string;
    transactionId?: string;
  };
  items: OrderItem[];
  totals: OrderTotals;
  createdAt: string;
};

export type CreateOrderPayload = {
  customer: SavedOrder["customer"];
  payment: SavedOrder["payment"];
  items: OrderItem[];
  totals: OrderTotals;
};
