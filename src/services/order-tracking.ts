import "server-only";

import { createSupabaseServerClient } from "@/supabase/server";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types/order";
import type { TrackedOrder } from "@/types/order-tracking";

type OrderRecord = {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  subtotal: number | string;
  delivery_charge: number | string;
  grand_total: number | string;
  created_at: string;
};

type CustomerRecord = {
  name: string | null;
  phone: string | null;
  delivery_address: string | null;
  district: string | null;
};

type PaymentRecord = {
  method: PaymentMethod;
  status: PaymentStatus;
  sender_number: string | null;
  transaction_id: string | null;
};

type OrderItemRecord = {
  product_name: string | null;
  size: string | null;
  size_ml: number | null;
  quantity: number;
  unit_price: number | string;
  line_total: number | string | null;
  total_price: number | string | null;
};

const toNumber = (value: number | string | null) => Number(value ?? 0);

// Phone comparison accepts either local or +880 notation without weakening the lookup.
export const normalizeTrackingPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");

  return digits.startsWith("880") ? `0${digits.slice(3)}` : digits;
};

export const getTrackedOrder = async (
  orderNumber: string,
  submittedPhone: string,
): Promise<TrackedOrder | null> => {
  const supabase = createSupabaseServerClient();
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();
  const normalizedPhone = normalizeTrackingPhone(submittedPhone);

  // Order numbers are unique, so this resolves at most one candidate before
  // the linked customer's phone is verified.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_id, status, subtotal, delivery_charge, grand_total, created_at",
    )
    .eq("order_number", normalizedOrderNumber)
    .maybeSingle<OrderRecord>();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    return null;
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("name, phone, delivery_address, district")
    .eq("id", order.customer_id)
    .maybeSingle<CustomerRecord>();

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (
    !customer?.phone ||
    normalizeTrackingPhone(customer.phone) !== normalizedPhone
  ) {
    return null;
  }

  // Sensitive order details are fetched only after both lookup fields match.
  const [
    { data: items, error: itemsError },
    { data: payment, error: paymentError },
  ] = await Promise.all([
    supabase
      .from("order_items")
      .select(
        "product_name, size, size_ml, quantity, unit_price, line_total, total_price",
      )
      .eq("order_id", order.id)
      .order("created_at", { ascending: true })
      .returns<OrderItemRecord[]>(),
    supabase
      .from("payments")
      .select("method, status, sender_number, transaction_id")
      .eq("order_id", order.id)
      .maybeSingle<PaymentRecord>(),
  ]);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  return {
    orderNumber: order.order_number,
    status: order.status,
    createdAt: order.created_at,
    customer: {
      name: customer.name ?? "Customer",
      phone: customer.phone,
      deliveryAddress: customer.delivery_address ?? "",
      district: customer.district ?? "",
    },
    payment: payment
      ? {
          method: payment.method,
          status: payment.status,
          senderNumber: payment.sender_number ?? undefined,
          transactionId: payment.transaction_id ?? undefined,
        }
      : null,
    items: (items ?? []).map((item) => {
      const unitPrice = toNumber(item.unit_price);
      const quantity = item.quantity;

      return {
        productName: item.product_name ?? "Perfume",
        size: item.size ?? (item.size_ml ? `${item.size_ml}ml` : "Selected size"),
        quantity,
        unitPrice,
        totalPrice: toNumber(
          item.total_price ?? item.line_total ?? unitPrice * quantity,
        ),
      };
    }),
    totals: {
      subtotal: toNumber(order.subtotal),
      deliveryCharge: toNumber(order.delivery_charge),
      grandTotal: toNumber(order.grand_total),
    },
  };
};
