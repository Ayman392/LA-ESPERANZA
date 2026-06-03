import "server-only";

import {
  generateOrderNumber,
  getOrderStatusForPaymentMethod,
  getPaymentStatusForMethod,
} from "@/lib/orders";
import { createSupabaseServerClient } from "@/supabase/server";
import type {
  CreateOrderPayload,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  SavedOrder,
} from "@/types/order";

type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;

type CustomerRecord = {
  id: string;
};

type OrderRecord = {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  district: string;
  notes: string | null;
  status: OrderStatus;
  subtotal: number | string;
  delivery_charge: number | string;
  grand_total: number | string;
  created_at: string;
};

type OrderItemRecord = {
  product_id: string;
  product_slug: string;
  product_name: string;
  inspired_by: string;
  size: "15ml" | "30ml";
  quantity: number;
  unit_price: number | string;
  line_total: number | string;
  total_price: number | string;
  image: string;
};

type PaymentRecord = {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number | string;
  sender_number: string | null;
  transaction_id: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
};

const toNumber = (value: number | string) =>
  typeof value === "number" ? value : Number(value);

const createCustomer = async (
  supabase: SupabaseServerClient,
  customer: CreateOrderPayload["customer"],
) => {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: customer.customerName,
      phone: customer.phone,
      email: customer.email || null,
      delivery_address: customer.deliveryAddress,
      district: customer.district,
      notes: customer.notes || null,
    })
    .select("id")
    .single<CustomerRecord>();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create customer.");
  }

  return data;
};

const mapSavedOrder = (
  order: OrderRecord,
  items: OrderItem[],
  payment: SavedOrder["payment"],
): SavedOrder => ({
  id: order.id,
  orderNumber: order.order_number,
  customerId: order.customer_id,
  status: order.status,
  customer: {
    customerName: order.customer_name,
    phone: order.customer_phone,
    email: order.customer_email ?? "",
    deliveryAddress: order.delivery_address,
    district: order.district,
    notes: order.notes ?? "",
  },
  payment,
  items,
  totals: {
    subtotal: toNumber(order.subtotal),
    deliveryCharge: toNumber(order.delivery_charge),
    grandTotal: toNumber(order.grand_total),
  },
  createdAt: order.created_at,
});

const mapOrderItems = (items: OrderItemRecord[]): OrderItem[] =>
  items.map((item) => ({
    // lineTotal and totalPrice intentionally point to the same stored total.
    productId: item.product_id,
    slug: item.product_slug,
    name: item.product_name,
    inspiredBy: item.inspired_by,
    size: item.size,
    quantity: item.quantity,
    unitPrice: toNumber(item.unit_price),
    lineTotal: toNumber(item.line_total),
    totalPrice: toNumber(item.total_price),
    image: item.image,
  }));

const normalizeOrderItemTotals = (item: OrderItem): OrderItem => {
  const itemTotal = item.unitPrice * item.quantity;

  return {
    ...item,
    lineTotal: itemTotal,
    totalPrice: itemTotal,
  };
};

// This function must only run on the server because it uses the Supabase service role key.
export const createSupabaseOrder = async (payload: CreateOrderPayload) => {
  const supabase = createSupabaseServerClient();
  const customer = await createCustomer(supabase, payload.customer);
  const orderNumber = generateOrderNumber();
  const normalizedItems = payload.items.map(normalizeOrderItemTotals);
  const orderStatus = getOrderStatusForPaymentMethod(payload.payment.method);
  const paymentStatus = getPaymentStatusForMethod(payload.payment.method);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customer.id,
      customer_name: payload.customer.customerName,
      customer_phone: payload.customer.phone,
      customer_email: payload.customer.email || null,
      delivery_address: payload.customer.deliveryAddress,
      district: payload.customer.district,
      notes: payload.customer.notes || null,
      status: orderStatus,
      subtotal: payload.totals.subtotal,
      delivery_charge: payload.totals.deliveryCharge,
      grand_total: payload.totals.grandTotal,
    })
    .select(
      "id, order_number, customer_id, customer_name, customer_phone, customer_email, delivery_address, district, notes, status, subtotal, delivery_charge, grand_total, created_at",
    )
    .single<OrderRecord>();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Unable to create order.");
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    normalizedItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_slug: item.slug,
      product_name: item.name,
      inspired_by: item.inspiredBy,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
      total_price: item.totalPrice,
      image: item.image,
    })),
  );

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: order.id,
    method: payload.payment.method,
    status: paymentStatus,
    amount: payload.totals.grandTotal,
    sender_number: payload.payment.senderNumber ?? null,
    transaction_id: payload.payment.transactionId ?? null,
  });

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  return mapSavedOrder(order, normalizedItems, {
    ...payload.payment,
    status: paymentStatus,
    amount: payload.totals.grandTotal,
  });
};

export const getSupabaseOrderByNumber = async (orderNumber: string) => {
  const supabase = createSupabaseServerClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_id, customer_name, customer_phone, customer_email, delivery_address, district, notes, status, subtotal, delivery_charge, grand_total, created_at",
    )
    .eq("order_number", orderNumber)
    .single<OrderRecord>();

  if (orderError || !order) {
    return null;
  }

  const [{ data: items, error: itemsError }, { data: payment, error: paymentError }] =
    await Promise.all([
      supabase
        .from("order_items")
        .select(
          "product_id, product_slug, product_name, inspired_by, size, quantity, unit_price, line_total, total_price, image",
        )
        .eq("order_id", order.id)
        .returns<OrderItemRecord[]>(),
      supabase
        .from("payments")
        .select(
          "method, status, amount, sender_number, transaction_id, verified_at, verified_by, rejection_reason",
        )
        .eq("order_id", order.id)
        .single<PaymentRecord>(),
    ]);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (paymentError || !payment) {
    throw new Error(paymentError?.message ?? "Payment not found.");
  }

  return mapSavedOrder(order, mapOrderItems(items ?? []), {
    method: payment.method,
    status: payment.status,
    amount: toNumber(payment.amount),
    senderNumber: payment.sender_number ?? undefined,
    transactionId: payment.transaction_id ?? undefined,
    verifiedAt: payment.verified_at ?? undefined,
    verifiedBy: payment.verified_by ?? undefined,
    rejectionReason: payment.rejection_reason ?? undefined,
  });
};
