import "server-only";

import { createSupabaseServerClient } from "@/supabase/server";
import type {
  AdminCustomer,
  AdminDashboardSummary,
  AdminOrder,
  AdminOrderStatus,
  AdminPayment,
  AdminProduct,
  AdminProductInput,
} from "@/types/admin";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types/order";

type OrderRow = {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  status: AdminOrderStatus;
  grand_total: number | string;
  created_at: string;
};

type PaymentRow = {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  sender_number: string | null;
  transaction_id: string | null;
  amount: number | string;
  created_at: string;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
};

type CustomerRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  district: string | null;
  created_at: string | null;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  inspired_by: string;
  gender: "Men" | "Women" | "Unisex";
  size_15ml_price: number | string;
  size_30ml_price: number | string;
  stock: number;
  image: string;
  is_active: boolean;
};

const toNumber = (value: number | string | null | undefined) =>
  typeof value === "number" ? value : Number(value ?? 0);

const mapOrder = (order: OrderRow, payments: PaymentRow[]): AdminOrder => {
  const payment = payments.find((entry) => entry.order_id === order.id);

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    status: order.status,
    grandTotal: toNumber(order.grand_total),
    createdAt: order.created_at,
    paymentMethod: payment?.method,
    paymentStatus: payment?.status,
  };
};

const mapPayment = (
  payment: PaymentRow,
  orders: OrderRow[],
): AdminPayment | null => {
  if (payment.method === "cod" || payment.status !== "verification_required") {
    return null;
  }

  const order = orders.find((entry) => entry.id === payment.order_id);

  return {
    id: payment.id,
    orderId: payment.order_id,
    orderNumber: order?.order_number ?? "Unknown order",
    method: payment.method,
    status: payment.status,
    senderNumber: payment.sender_number ?? "",
    transactionId: payment.transaction_id ?? "",
    amount: toNumber(payment.amount),
    createdAt: payment.created_at,
    verifiedAt: payment.verified_at ?? undefined,
    verifiedBy: payment.verified_by ?? undefined,
    rejectionReason: payment.rejection_reason ?? undefined,
  };
};

const mapProduct = (product: ProductRow): AdminProduct => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  inspiredBy: product.inspired_by,
  gender: product.gender,
  size15mlPrice: toNumber(product.size_15ml_price),
  size30mlPrice: toNumber(product.size_30ml_price),
  stock: product.stock,
  image: product.image,
  isActive: product.is_active,
});

const productPayload = (product: AdminProductInput) => ({
  slug: product.slug,
  name: product.name,
  inspired_by: product.inspiredBy,
  gender: product.gender,
  size_15ml_price: product.size15mlPrice,
  size_30ml_price: product.size30mlPrice,
  stock: product.stock,
  image: product.image,
  is_active: product.isActive,
  updated_at: new Date().toISOString(),
});

export const getAdminDashboardData = async () => {
  const supabase = createSupabaseServerClient();
  const [ordersResult, paymentsResult, customersResult, productsResult] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, order_number, customer_id, customer_name, customer_phone, status, grand_total, created_at")
        .order("created_at", { ascending: false })
        .returns<OrderRow[]>(),
      supabase
        .from("payments")
        .select("id, order_id, method, status, sender_number, transaction_id, amount, created_at, verified_at, verified_by, rejection_reason")
        .order("created_at", { ascending: false })
        .returns<PaymentRow[]>(),
      supabase
        .from("customers")
        .select("id, name, phone, email, district, created_at")
        .order("created_at", { ascending: false })
        .returns<CustomerRow[]>(),
      supabase
        .from("products")
        .select("id, slug, name, inspired_by, gender, size_15ml_price, size_30ml_price, stock, image, is_active")
        .order("name", { ascending: true })
        .returns<ProductRow[]>(),
    ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);
  if (customersResult.error) throw new Error(customersResult.error.message);
  if (productsResult.error) throw new Error(productsResult.error.message);

  const orders = ordersResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const customers = customersResult.data ?? [];
  const products = productsResult.data ?? [];
  const mappedOrders = orders.map((order) => mapOrder(order, payments));
  const pendingPayments = payments
    .map((payment) => mapPayment(payment, orders))
    .filter((payment): payment is AdminPayment => Boolean(payment));

  const dashboard: AdminDashboardSummary = {
    totalOrders: mappedOrders.length,
    totalRevenue: mappedOrders
      .filter((order) => order.status !== "cancelled")
      .reduce((total, order) => total + order.grandTotal, 0),
    pendingOrders: mappedOrders.filter((order) => order.status === "pending")
      .length,
    pendingPaymentVerifications: pendingPayments.length,
    recentOrders: mappedOrders.slice(0, 5),
  };

  const mappedCustomers: AdminCustomer[] = customers.map((customer) => ({
    id: customer.id,
    name: customer.name ?? "Guest customer",
    phone: customer.phone ?? "",
    email: customer.email ?? undefined,
    district: customer.district ?? undefined,
    createdAt: customer.created_at ?? undefined,
    orders: orders
      .filter((order) => order.customer_id === customer.id)
      .map((order) => ({
        orderNumber: order.order_number,
        status: order.status as OrderStatus,
        grandTotal: toNumber(order.grand_total),
        createdAt: order.created_at,
      })),
  }));

  return {
    dashboard,
    orders: mappedOrders,
    payments: pendingPayments,
    customers: mappedCustomers,
    products: products.map(mapProduct),
  };
};

export const updateAdminOrderStatus = async (
  orderId: string,
  status: AdminOrderStatus,
) => {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
};

export const verifyAdminPayment = async (paymentId: string) => {
  const supabase = createSupabaseServerClient();
  const verifiedAt = new Date().toISOString();
  const { data: payment, error } = await supabase
    .from("payments")
    .update({
      status: "verified",
      verified_at: verifiedAt,
      verified_by: "LA ESPERANZA Admin",
      rejection_reason: null,
    })
    .eq("id", paymentId)
    .select("order_id")
    .single<{ order_id: string }>();

  if (error || !payment) throw new Error(error?.message ?? "Payment not found.");

  await updateAdminOrderStatus(payment.order_id, "processing");
};

export const rejectAdminPayment = async (
  paymentId: string,
  rejectionReason: string,
) => {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("payments")
    .update({
      status: "rejected",
      rejection_reason: rejectionReason,
      verified_at: null,
      verified_by: null,
    })
    .eq("id", paymentId);

  if (error) throw new Error(error.message);
};

export const createAdminProduct = async (product: AdminProductInput) => {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("products").insert(productPayload(product));

  if (error) throw new Error(error.message);
};

export const updateAdminProduct = async (
  productId: string,
  product: AdminProductInput,
) => {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("products")
    .update(productPayload(product))
    .eq("id", productId);

  if (error) throw new Error(error.message);
};

export const deleteAdminProduct = async (productId: string) => {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) throw new Error(error.message);
};
