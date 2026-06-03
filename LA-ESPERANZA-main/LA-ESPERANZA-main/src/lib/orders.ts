import type { CartLineItem } from "@/types/cart";
import type {
  CheckoutFormErrors,
  CheckoutFormValues,
  OrderItem,
  OrderTotals,
  PaymentMethod,
  SavedOrder,
} from "@/types/order";

export const ORDERS_STORAGE_KEY = "la-esperanza-orders";
export const LATEST_ORDER_STORAGE_KEY = "la-esperanza-latest-order";
export const DELIVERY_CHARGE = 80;

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  bkash: "bKash Manual Payment",
  nagad: "Nagad Manual Payment",
};

export const emptyCheckoutForm: CheckoutFormValues = {
  customerName: "",
  phone: "",
  email: "",
  deliveryAddress: "",
  district: "",
  notes: "",
  paymentMethod: "cod",
  senderNumber: "",
  transactionId: "",
};

const phonePattern = /^(?:\+?88)?01[3-9]\d{8}$/;

export const formatPhoneNumber = (phone: string) =>
  phone.replace(/[\s-]/g, "");

export const isManualPayment = (paymentMethod: PaymentMethod) =>
  paymentMethod === "bkash" || paymentMethod === "nagad";

export const validateCheckoutForm = (
  values: CheckoutFormValues,
): CheckoutFormErrors => {
  const errors: CheckoutFormErrors = {};
  const normalizedPhone = formatPhoneNumber(values.phone);

  if (!values.customerName.trim()) {
    errors.customerName = "Customer name is required.";
  }

  if (!values.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!phonePattern.test(normalizedPhone)) {
    errors.phone = "Enter a valid Bangladeshi phone number.";
  }

  if (!values.deliveryAddress.trim()) {
    errors.deliveryAddress = "Delivery address is required.";
  }

  if (!values.district.trim()) {
    errors.district = "District is required.";
  }

  if (isManualPayment(values.paymentMethod)) {
    if (!values.senderNumber.trim()) {
      errors.senderNumber = "Sender number is required.";
    } else if (!phonePattern.test(formatPhoneNumber(values.senderNumber))) {
      errors.senderNumber = "Enter a valid sender phone number.";
    }

    if (!values.transactionId.trim()) {
      errors.transactionId = "Transaction ID is required.";
    }
  }

  return errors;
};

export const createOrderItems = (lineItems: CartLineItem[]): OrderItem[] =>
  lineItems.map((item) => ({
    productId: item.productId,
    slug: item.product.slug,
    name: item.product.name,
    inspiredBy: item.product.inspiredBy,
    size: item.size,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    image: item.product.image,
  }));

export const calculateOrderTotals = (
  subtotal: number,
  deliveryCharge = DELIVERY_CHARGE,
): OrderTotals => ({
  subtotal,
  deliveryCharge,
  grandTotal: subtotal + deliveryCharge,
});

export const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `LE-${timestamp}-${suffix}`;
};

const readOrders = (): SavedOrder[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedOrders = JSON.parse(
      window.localStorage.getItem(ORDERS_STORAGE_KEY) ?? "[]",
    );

    return Array.isArray(storedOrders) ? (storedOrders as SavedOrder[]) : [];
  } catch {
    return [];
  }
};

export const getStoredOrders = () => readOrders();

export const getOrderByNumber = (orderNumber: string) =>
  readOrders().find((order) => order.orderNumber === orderNumber);

export const getLatestOrder = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const latestOrderNumber = window.localStorage.getItem(LATEST_ORDER_STORAGE_KEY);

  return latestOrderNumber ? getOrderByNumber(latestOrderNumber) ?? null : null;
};

export const saveOrder = (order: SavedOrder) => {
  if (typeof window === "undefined") {
    return;
  }

  const orders = readOrders();
  window.localStorage.setItem(
    ORDERS_STORAGE_KEY,
    JSON.stringify([order, ...orders]),
  );
  window.localStorage.setItem(LATEST_ORDER_STORAGE_KEY, order.orderNumber);
};
