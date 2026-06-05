import type { CartLineItem } from "@/types/cart";
import type {
  CheckoutFormErrors,
  CheckoutFormValues,
  CreateOrderPayload,
  OrderItem,
  OrderStatus,
  OrderTotals,
  PaymentMethod,
  PaymentStatus,
  SavedOrder,
} from "@/types/order";

export const DELIVERY_CHARGE = 80;

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  bkash: "bKash Manual Payment",
  nagad: "Nagad Manual Payment",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending_cod: "Pending COD",
  verification_required: "Verification Required",
  verified: "Verified",
  rejected: "Rejected",
};

export const manualPaymentNumbers: Record<Exclude<PaymentMethod, "cod">, string> = {
  bkash: "01XXXXXXXXX",
  nagad: "01XXXXXXXXX",
};

export const getOrderStatusForPaymentMethod = (
  paymentMethod: PaymentMethod,
): OrderStatus =>
  isManualPayment(paymentMethod) ? "payment_verification" : "pending";

export const getPaymentStatusForMethod = (
  paymentMethod: PaymentMethod,
): PaymentStatus =>
  isManualPayment(paymentMethod)
    ? "verification_required"
    : "pending_cod";

export const getPaymentConfirmationMessage = (paymentMethod: PaymentMethod) =>
  isManualPayment(paymentMethod)
    ? "Your payment information has been submitted and is pending verification."
    : "Your order has been received. We will contact you before delivery.";

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

export const isManualPayment = (
  paymentMethod: PaymentMethod,
): paymentMethod is Exclude<PaymentMethod, "cod"> =>
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
  lineItems.map((item) => {
    const itemTotal = item.unitPrice * item.quantity;

    return {
      productId: item.productId,
      productVariantId: item.variantId,
      slug: item.product.slug,
      name: item.product.name,
      inspiredBy: item.product.inspiredBy,
      size: item.size,
      sizeMl: item.variant.sizeMl,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: itemTotal,
      totalPrice: itemTotal,
      image: item.product.image,
    };
  });

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

export const createOrderPayload = (
  values: CheckoutFormValues,
  lineItems: CartLineItem[],
  subtotal: number,
): CreateOrderPayload => {
  const manualPayment = isManualPayment(values.paymentMethod);

  return {
    customer: {
      customerName: values.customerName.trim(),
      phone: formatPhoneNumber(values.phone),
      email: values.email.trim(),
      deliveryAddress: values.deliveryAddress.trim(),
      district: values.district.trim(),
      notes: values.notes.trim(),
    },
    payment: {
      method: values.paymentMethod,
      senderNumber: manualPayment
        ? formatPhoneNumber(values.senderNumber)
        : undefined,
      transactionId: manualPayment ? values.transactionId.trim() : undefined,
    },
    items: createOrderItems(lineItems),
    totals: calculateOrderTotals(subtotal),
  };
};

export const persistOrder = async (payload: CreateOrderPayload) => {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as {
    order?: SavedOrder;
    error?: string;
  };

  if (!response.ok || !data.order) {
    throw new Error(data.error ?? "Unable to place order.");
  }

  return data.order;
};
