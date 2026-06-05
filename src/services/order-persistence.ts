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
  product_variant_id: string | null;
  product_slug: string;
  product_name: string;
  inspired_by: string;
  size: "15ml" | "30ml";
  size_ml: 15 | 30 | null;
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

type ProductVariantStockRecord = {
  id: string;
  size_ml: 15 | 30;
  stock_quantity: number | null;
};

type ProductWithVariantStockRecord = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean | null;
  product_variants: ProductVariantStockRecord[] | null;
};

type ValidatedOrderItem = OrderItem & {
  productVariantId: string;
};

const toNumber = (value: number | string) =>
  typeof value === "number" ? value : Number(value);

export class StockValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockValidationError";
  }
}

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
    productVariantId: item.product_variant_id ?? undefined,
    slug: item.product_slug,
    name: item.product_name,
    inspiredBy: item.inspired_by,
    size: item.size,
    sizeMl: item.size_ml ?? (item.size === "15ml" ? 15 : 30),
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
    sizeMl: item.sizeMl ?? (item.size === "15ml" ? 15 : 30),
    lineTotal: itemTotal,
    totalPrice: itemTotal,
  };
};

const getVariantRequestKey = (item: Pick<OrderItem, "slug" | "sizeMl">) =>
  `${item.slug}:${item.sizeMl}`;

const getRequestedVariantQuantities = (items: OrderItem[]) =>
  items.reduce((quantities, item) => {
    const key = getVariantRequestKey(item);

    quantities.set(key, (quantities.get(key) ?? 0) + item.quantity);

    return quantities;
  }, new Map<string, number>());

const validateProductVariantStock = async (
  supabase: SupabaseServerClient,
  items: OrderItem[],
): Promise<ValidatedOrderItem[]> => {
  if (items.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) {
    throw new StockValidationError("Cart item quantities must be greater than zero.");
  }

  if (
    items.some(
      (item) =>
        (item.sizeMl !== 15 && item.sizeMl !== 30) ||
        item.size !== `${item.sizeMl}ml`,
    )
  ) {
    throw new StockValidationError("Every cart item must include a valid size.");
  }

  const requestedQuantities = getRequestedVariantQuantities(items);
  const slugs = Array.from(new Set(items.map((item) => item.slug)));

  if (slugs.length === 0) {
    throw new StockValidationError("Cart items are required.");
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, is_active, product_variants(id, size_ml, stock_quantity)")
    .in("slug", slugs)
    .returns<ProductWithVariantStockRecord[]>();

  if (error) {
    throw new Error(error.message);
  }

  const stockByVariantKey = new Map<string, ProductVariantStockRecord>();
  const productBySlug = new Map((data ?? []).map((product) => [product.slug, product]));
  const stockProblems = items.flatMap((item) => {
    const product = productBySlug.get(item.slug);

    if (!product || product.is_active === false) {
      return [`${item.name} is no longer available.`];
    }

    const variant = (product.product_variants ?? []).find(
      (entry) => entry.size_ml === item.sizeMl,
    );

    if (!variant) {
      return [`${item.name} ${item.size} is no longer available.`];
    }

    stockByVariantKey.set(getVariantRequestKey(item), variant);
    const requestedQuantity =
      requestedQuantities.get(getVariantRequestKey(item)) ?? 0;
    const availableStock = variant.stock_quantity ?? 0;

    if (requestedQuantity > availableStock) {
      return [
        `${product.name} ${item.size} has only ${availableStock} unit${
          availableStock === 1 ? "" : "s"
        } left. You requested ${requestedQuantity}.`,
      ];
    }

    return [];
  });

  if (stockProblems.length > 0) {
    throw new StockValidationError(stockProblems.join(" "));
  }

  return items.map((item) => {
    const variant = stockByVariantKey.get(getVariantRequestKey(item));

    if (!variant) {
      throw new StockValidationError(`${item.name} ${item.size} is no longer available.`);
    }

    return {
      ...item,
      productVariantId: variant.id,
    };
  });
};

const deductProductVariantStock = async (
  supabase: SupabaseServerClient,
  items: ValidatedOrderItem[],
) => {
  const requestedQuantities = getRequestedVariantQuantities(items);

  for (const [key, quantity] of requestedQuantities) {
    const [slug, sizeMl] = key.split(":");
    const { error } = await supabase.rpc(
      "decrement_product_variant_stock",
      {
        p_product_slug: slug,
        p_size_ml: Number(sizeMl),
        p_quantity: quantity,
      },
    );

    if (error) {
      throw new StockValidationError(error.message);
    }
  }
};

// This function must only run on the server because it uses the Supabase service role key.
export const createSupabaseOrder = async (payload: CreateOrderPayload) => {
  const supabase = createSupabaseServerClient();
  const orderNumber = generateOrderNumber();
  const normalizedItems = payload.items.map(normalizeOrderItemTotals);
  const orderStatus = getOrderStatusForPaymentMethod(payload.payment.method);
  const paymentStatus = getPaymentStatusForMethod(payload.payment.method);
  const validatedItems = await validateProductVariantStock(supabase, normalizedItems);
  const customer = await createCustomer(supabase, payload.customer);

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
    validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_variant_id: item.productVariantId,
      product_slug: item.slug,
      product_name: item.name,
      inspired_by: item.inspiredBy,
      size: item.size,
      size_ml: item.sizeMl,
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

  await deductProductVariantStock(supabase, validatedItems);

  return mapSavedOrder(order, validatedItems, {
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
    .maybeSingle<OrderRecord>();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    return null;
  }

  const [{ data: items, error: itemsError }, { data: payment, error: paymentError }] =
    await Promise.all([
      supabase
        .from("order_items")
        .select(
          "product_id, product_variant_id, product_slug, product_name, inspired_by, size, size_ml, quantity, unit_price, line_total, total_price, image",
        )
        .eq("order_id", order.id)
        .returns<OrderItemRecord[]>(),
      supabase
        .from("payments")
        .select(
          "method, status, amount, sender_number, transaction_id, verified_at, verified_by, rejection_reason",
        )
        .eq("order_id", order.id)
        .maybeSingle<PaymentRecord>(),
    ]);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  if (!payment) {
    throw new Error("Payment not found for this order.");
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
