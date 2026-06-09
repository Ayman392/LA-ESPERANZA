import "server-only";

import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "@/supabase/server";
import { getAdminReviewStatistics } from "@/services/reviews";
import type {
  AdminAnalytics,
  AdminBestSeller,
  AdminBestSellingSize,
  AdminOrder,
  AdminOrderStatus,
  AdminPaymentActivity,
} from "@/types/admin";
import type { PaymentMethod, PaymentStatus } from "@/types/order";

type AnalyticsOrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  status: AdminOrderStatus;
  subtotal: number | string | null;
  grand_total: number | string;
  created_at: string;
};

type AnalyticsPaymentRow = {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number | string | null;
  created_at: string;
  verified_at: string | null;
};

type AnalyticsOrderItemRow = {
  order_id: string;
  product_slug: string;
  product_name: string;
  size: "15ml" | "30ml";
  quantity: number;
  line_total: number | string | null;
  total_price: number | string | null;
};

type AnalyticsVariantRow = {
  stock_quantity: number | string | null;
  low_stock_threshold: number | string | null;
  product_id: string;
};

type AnalyticsProductRow = {
  id: string;
  is_active: boolean | null;
};

const toNumber = (value: number | string | null | undefined) =>
  typeof value === "number" ? value : Number(value ?? 0);

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const startOfDay = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const isOnOrAfter = (value: string, floor: Date) =>
  new Date(value).getTime() >= floor.getTime();

const createTrendWindow = (now = new Date()) =>
  Array.from({ length: 30 }, (_, index) => {
    const date = startOfDay(now);
    date.setDate(date.getDate() - (29 - index));

    return {
      date: toDateKey(date),
      revenue: 0,
      orders: 0,
    };
  });

const mapRecentOrder = (
  order: AnalyticsOrderRow,
  paymentByOrderId: Map<string, AnalyticsPaymentRow>,
): AdminOrder => {
  const payment = paymentByOrderId.get(order.id);

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

const getEligibleRevenueOrders = (
  orders: AnalyticsOrderRow[],
  payments: AnalyticsPaymentRow[],
) => {
  const rejectedPaymentOrderIds = new Set(
    payments
      .filter((payment) => payment.status === "rejected")
      .map((payment) => payment.order_id),
  );

  return orders.filter(
    (order) =>
      order.status === "delivered" && !rejectedPaymentOrderIds.has(order.id),
  );
};

const getOrderRevenue = (
  order: AnalyticsOrderRow,
  payment?: AnalyticsPaymentRow,
) => {
  const grandTotal = toNumber(order.grand_total);
  const paymentAmount = toNumber(payment?.amount);
  const subtotal = toNumber(order.subtotal);

  // Delivered order total is the revenue source of truth; payment amount is only a fallback.
  if (grandTotal > 0) {
    return grandTotal;
  }

  if (payment?.status === "verified" && paymentAmount > 0) {
    return paymentAmount;
  }

  return subtotal;
};

const aggregateBestSellers = (
  items: AnalyticsOrderItemRow[],
  orders: AnalyticsOrderRow[],
) => {
  const validOrderIds = new Set(
    orders
      .filter((order) => order.status !== "cancelled")
      .map((order) => order.id),
  );
  const productTotals = new Map<string, AdminBestSeller>();
  const sizeTotals = new Map<"15ml" | "30ml", AdminBestSellingSize>();

  items
    .filter((item) => validOrderIds.has(item.order_id))
    .forEach((item) => {
      const revenue = toNumber(item.total_price ?? item.line_total);
      const existingProduct = productTotals.get(item.product_slug) ?? {
        productName: item.product_name,
        productSlug: item.product_slug,
        quantity: 0,
        revenue: 0,
      };
      const existingSize = sizeTotals.get(item.size) ?? {
        sizeLabel: item.size,
        quantity: 0,
        revenue: 0,
      };

      productTotals.set(item.product_slug, {
        ...existingProduct,
        quantity: existingProduct.quantity + item.quantity,
        revenue: existingProduct.revenue + revenue,
      });
      sizeTotals.set(item.size, {
        ...existingSize,
        quantity: existingSize.quantity + item.quantity,
        revenue: existingSize.revenue + revenue,
      });
    });

  const topProducts = Array.from(productTotals.values())
    .sort((first, second) => second.quantity - first.quantity)
    .slice(0, 5);
  const bestSellingSize = Array.from(sizeTotals.values()).sort(
    (first, second) => second.quantity - first.quantity,
  )[0];

  return {
    bestSellingProduct: topProducts[0],
    bestSellingSize,
    topProducts,
  };
};

const getInventoryAnalytics = (
  variants: AnalyticsVariantRow[],
  products: AnalyticsProductRow[],
) => {
  const activeProductIds = new Set(
    products
      .filter((product) => product.is_active !== false)
      .map((product) => product.id),
  );
  const activeVariants = variants.filter((variant) =>
    activeProductIds.has(variant.product_id),
  );

  return {
    totalInventoryUnits: activeVariants.reduce(
      (total, variant) => total + toNumber(variant.stock_quantity),
      0,
    ),
    lowStockVariants: activeVariants.filter(
      (variant) =>
        toNumber(variant.stock_quantity) <=
        toNumber(variant.low_stock_threshold ?? 5),
    ).length,
    outOfStockVariants: activeVariants.filter(
      (variant) => toNumber(variant.stock_quantity) === 0,
    ).length,
  };
};

const buildAnalytics = async (): Promise<AdminAnalytics> => {
  const supabase = createSupabaseServerClient();
  const [
    ordersResult,
    paymentsResult,
    orderItemsResult,
    variantsResult,
    productsResult,
    reviewStatistics,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, status, subtotal, grand_total, created_at")
      .order("created_at", { ascending: false })
      .returns<AnalyticsOrderRow[]>(),
    supabase
      .from("payments")
      .select("id, order_id, method, status, amount, created_at, verified_at")
      .order("created_at", { ascending: false })
      .returns<AnalyticsPaymentRow[]>(),
    supabase
      .from("order_items")
      .select("order_id, product_slug, product_name, size, quantity, line_total, total_price")
      .returns<AnalyticsOrderItemRow[]>(),
    supabase
      .from("product_variants")
      .select("product_id, stock_quantity, low_stock_threshold")
      .returns<AnalyticsVariantRow[]>(),
    supabase.from("products").select("id, is_active").returns<AnalyticsProductRow[]>(),
    getAdminReviewStatistics(),
  ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);
  if (orderItemsResult.error) throw new Error(orderItemsResult.error.message);
  if (variantsResult.error) throw new Error(variantsResult.error.message);
  if (productsResult.error) throw new Error(productsResult.error.message);

  const orders = ordersResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const orderItems = orderItemsResult.data ?? [];
  const variants = variantsResult.data ?? [];
  const products = productsResult.data ?? [];
  const now = new Date();
  const today = startOfDay(now);
  const month = startOfMonth(now);
  const paymentByOrderId = new Map(payments.map((payment) => [payment.order_id, payment]));
  const eligibleRevenueOrders = getEligibleRevenueOrders(orders, payments);
  const validOrders = orders.filter((order) => order.status !== "cancelled");
  const trendByDate = new Map(
    createTrendWindow(now).map((entry) => [entry.date, entry]),
  );

  eligibleRevenueOrders.forEach((order) => {
    const dateKey = toDateKey(new Date(order.created_at));
    const trend = trendByDate.get(dateKey);

    if (trend) {
      trend.revenue += getOrderRevenue(order, paymentByOrderId.get(order.id));
    }
  });

  validOrders.forEach((order) => {
    const dateKey = toDateKey(new Date(order.created_at));
    const trend = trendByDate.get(dateKey);

    if (trend) {
      trend.orders += 1;
    }
  });

  const inventory = getInventoryAnalytics(variants, products);
  const revenueDiagnostics = {
    deliveredOrders: orders.filter((order) => order.status === "delivered").length,
    rejectedPayments: payments.filter((payment) => payment.status === "rejected")
      .length,
    eligibleRevenueOrders: eligibleRevenueOrders.length,
    verifiedPayments: payments.filter((payment) => payment.status === "verified")
      .length,
    zeroOrMissingPaymentAmounts: eligibleRevenueOrders.filter((order) => {
      const payment = paymentByOrderId.get(order.id);

      return !payment || toNumber(payment.amount) <= 0;
    }).length,
    totalGrandTotal: eligibleRevenueOrders.reduce(
      (total, order) => total + toNumber(order.grand_total),
      0,
    ),
  };

  console.info("[analytics] revenue calculation", revenueDiagnostics);

  const recentPaymentActivity: AdminPaymentActivity[] = payments
    .slice()
    .sort(
      (first, second) =>
        new Date(second.verified_at ?? second.created_at).getTime() -
        new Date(first.verified_at ?? first.created_at).getTime(),
    )
    .slice(0, 10)
    .map((payment) => ({
      id: payment.id,
      orderNumber:
        orders.find((order) => order.id === payment.order_id)?.order_number ??
        "Unknown order",
      method: payment.method,
      status: payment.status,
      amount: toNumber(payment.amount),
      updatedAt: payment.verified_at ?? payment.created_at,
    }));

  return {
    overview: {
      totalRevenue: eligibleRevenueOrders.reduce(
        (total, order) => total + getOrderRevenue(order, paymentByOrderId.get(order.id)),
        0,
      ),
      revenueToday: eligibleRevenueOrders
        .filter((order) => isOnOrAfter(order.created_at, today))
        .reduce(
          (total, order) =>
            total + getOrderRevenue(order, paymentByOrderId.get(order.id)),
          0,
        ),
      revenueThisMonth: eligibleRevenueOrders
        .filter((order) => isOnOrAfter(order.created_at, month))
        .reduce(
          (total, order) =>
            total + getOrderRevenue(order, paymentByOrderId.get(order.id)),
          0,
        ),
      totalOrders: validOrders.length,
      ordersToday: validOrders.filter((order) =>
        isOnOrAfter(order.created_at, today),
      ).length,
      ordersThisMonth: validOrders.filter((order) =>
        isOnOrAfter(order.created_at, month),
      ).length,
      pendingPayments: payments.filter(
        (payment) => payment.status === "verification_required",
      ).length,
      lowStockProducts: inventory.lowStockVariants,
      outOfStockProducts: inventory.outOfStockVariants,
    },
    bestSellers: aggregateBestSellers(orderItems, orders),
    trends: Array.from(trendByDate.values()),
    inventory,
    recentActivity: {
      orders: orders.slice(0, 10).map((order) => mapRecentOrder(order, paymentByOrderId)),
      payments: recentPaymentActivity,
    },
    reviewStatistics,
  };
};

export const getAdminAnalytics = unstable_cache(
  buildAnalytics,
  ["la-esperanza-admin-analytics"],
  {
    revalidate: 60,
  },
);
