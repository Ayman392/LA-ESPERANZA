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
  AdminProductVariant,
} from "@/types/admin";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types/order";

type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;

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
  description: string | null;
  top_notes: string[] | string | null;
  middle_notes: string[] | string | null;
  base_notes: string[] | string | null;
  longevity: string | null;
  occasion: string | null;
  image: string;
  image_url: string | null;
  image_path: string | null;
  is_active: boolean;
};

type ProductVariantRow = {
  id: string;
  product_id: string;
  size_ml: number;
  price: number | string;
  stock_quantity: number | string;
  low_stock_threshold: number | string | null;
  updated_at: string | null;
};

const toNumber = (value: number | string | null | undefined) =>
  typeof value === "number" ? value : Number(value ?? 0);

const toVariantSize = (sizeMl: number): 15 | 30 => (sizeMl === 30 ? 30 : 15);

const toStringArray = (value: string[] | string | null | undefined) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

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

const mapVariant = (
  variant: ProductVariantRow,
  productById: Map<string, ProductRow>,
): AdminProductVariant | null => {
  const product = productById.get(variant.product_id);

  if (!product) {
    return null;
  }

  const sizeMl = toVariantSize(variant.size_ml);

  return {
    id: variant.id,
    productId: variant.product_id,
    productSlug: product.slug,
    productName: product.name,
    sizeMl,
    sizeLabel: `${sizeMl}ml`,
    price: toNumber(variant.price),
    stockQuantity: toNumber(variant.stock_quantity),
    lowStockThreshold: toNumber(variant.low_stock_threshold ?? 5),
    isActive: product.is_active,
    updatedAt: variant.updated_at ?? undefined,
  };
};

const mapProduct = (
  product: ProductRow,
  variants: AdminProductVariant[],
): AdminProduct => {
  const productVariants = variants
    .filter((variant) => variant.productId === product.id)
    .sort((first, second) => first.sizeMl - second.sizeMl);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    inspiredBy: product.inspired_by,
    gender: product.gender,
    description: product.description ?? "",
    topNotes: toStringArray(product.top_notes),
    middleNotes: toStringArray(product.middle_notes),
    baseNotes: toStringArray(product.base_notes),
    longevity: product.longevity ?? "",
    occasion: product.occasion ?? "",
    image: product.image_url ?? product.image,
    imageUrl: product.image_url ?? product.image,
    imagePath: product.image_path ?? undefined,
    isActive: product.is_active,
    variants: productVariants,
  };
};

const productPayload = (product: AdminProductInput) => {
  const totalStock =
    Math.max(0, Math.trunc(product.size15mlStock)) +
    Math.max(0, Math.trunc(product.size30mlStock));

  return {
    slug: product.slug,
    name: product.name,
    inspired_by: product.inspiredBy,
    gender: product.gender,
    description: product.description,
    top_notes: product.topNotes,
    middle_notes: product.middleNotes,
    base_notes: product.baseNotes,
    longevity: product.longevity,
    occasion: product.occasion,
    // Legacy aggregate columns remain mirrored for older migrations, but variants own inventory.
    size_15ml_price: product.size15mlPrice,
    size_30ml_price: product.size30mlPrice,
    stock_quantity: totalStock,
    stock: totalStock,
    low_stock_threshold: Math.max(0, product.lowStockThreshold ?? 5),
    image: product.imageUrl || product.image,
    image_url: product.imageUrl || product.image || null,
    image_path: product.imagePath || null,
    is_active: product.isActive,
    updated_at: new Date().toISOString(),
  };
};

const getActiveVariants = (variants: AdminProductVariant[]) =>
  variants.filter((variant) => variant.isActive);

const getTotalInventoryUnits = (variants: AdminProductVariant[]) =>
  getActiveVariants(variants).reduce(
    (total, variant) => total + variant.stockQuantity,
    0,
  );

const getLowStockProductsCount = (variants: AdminProductVariant[]) =>
  getActiveVariants(variants).filter(
    (variant) => variant.stockQuantity <= variant.lowStockThreshold,
  ).length;

const getOutOfStockProductsCount = (variants: AdminProductVariant[]) =>
  getActiveVariants(variants).filter((variant) => variant.stockQuantity === 0)
    .length;

const upsertProductVariants = async (
  supabase: SupabaseServerClient,
  productId: string,
  product: AdminProductInput,
) => {
  const defaultThreshold = Math.max(0, Math.trunc(product.lowStockThreshold ?? 5));
  const { error } = await supabase.from("product_variants").upsert(
    [
      {
        product_id: productId,
        size_ml: 15,
        price: Math.max(0, product.size15mlPrice),
        stock_quantity: Math.max(0, Math.trunc(product.size15mlStock)),
        low_stock_threshold: defaultThreshold,
      },
      {
        product_id: productId,
        size_ml: 30,
        price: Math.max(0, product.size30mlPrice),
        stock_quantity: Math.max(0, Math.trunc(product.size30mlStock)),
        low_stock_threshold: defaultThreshold,
      },
    ],
    { onConflict: "product_id,size_ml" },
  );

  if (error) throw new Error(error.message);
};

export const getAdminDashboardData = async () => {
  const supabase = createSupabaseServerClient();
  const [
    ordersResult,
    paymentsResult,
    customersResult,
    productsResult,
    variantsResult,
  ] = await Promise.all([
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
      .select("id, slug, name, inspired_by, gender, description, top_notes, middle_notes, base_notes, longevity, occasion, image, image_url, image_path, is_active")
      .order("name", { ascending: true })
      .returns<ProductRow[]>(),
    supabase
      .from("product_variants")
      .select("id, product_id, size_ml, price, stock_quantity, low_stock_threshold, updated_at")
      .order("size_ml", { ascending: true })
      .returns<ProductVariantRow[]>(),
  ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);
  if (customersResult.error) throw new Error(customersResult.error.message);
  if (productsResult.error) throw new Error(productsResult.error.message);
  if (variantsResult.error) throw new Error(variantsResult.error.message);

  const orders = ordersResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const customers = customersResult.data ?? [];
  const products = productsResult.data ?? [];
  const variants = variantsResult.data ?? [];
  const productById = new Map(products.map((product) => [product.id, product]));
  const mappedVariants = variants
    .map((variant) => mapVariant(variant, productById))
    .filter((variant): variant is AdminProductVariant => Boolean(variant))
    .sort((first, second) =>
      first.productName === second.productName
        ? first.sizeMl - second.sizeMl
        : first.productName.localeCompare(second.productName),
    );
  const mappedProducts = products.map((product) =>
    mapProduct(product, mappedVariants),
  );
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
    totalInventoryUnits: getTotalInventoryUnits(mappedVariants),
    lowStockProducts: getLowStockProductsCount(mappedVariants),
    outOfStockProducts: getOutOfStockProductsCount(mappedVariants),
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
    products: mappedProducts,
    variants: mappedVariants,
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
    .maybeSingle<{ order_id: string }>();

  if (error) throw new Error(error.message);
  if (!payment) throw new Error("Payment not found.");

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
  const { data, error } = await supabase
    .from("products")
    .insert(productPayload(product))
    .select("id")
    .single<{ id: string }>();

  if (error || !data) throw new Error(error?.message ?? "Unable to create product.");

  await upsertProductVariants(supabase, data.id, product);
};

export const updateAdminProduct = async (
  productId: string,
  product: AdminProductInput,
) => {
  const supabase = createSupabaseServerClient();
  const { data: existingProduct, error: existingProductError } = await supabase
    .from("products")
    .select("image_path")
    .eq("id", productId)
    .maybeSingle<{ image_path: string | null }>();

  if (existingProductError) throw new Error(existingProductError.message);
  if (!existingProduct) throw new Error("Product not found.");

  const { error } = await supabase
    .from("products")
    .update(productPayload(product))
    .eq("id", productId);

  if (error) throw new Error(error.message);

  await upsertProductVariants(supabase, productId, product);

  if (
    existingProduct?.image_path &&
    existingProduct.image_path !== product.imagePath
  ) {
    await supabase.storage
      .from("product-images")
      .remove([existingProduct.image_path]);
  }
};

export const updateAdminProductVariant = async (
  variantId: string,
  stockQuantity: number,
  lowStockThreshold: number,
) => {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("product_variants")
    .update({
      stock_quantity: Math.max(0, Math.trunc(stockQuantity)),
      low_stock_threshold: Math.max(0, Math.trunc(lowStockThreshold)),
      updated_at: new Date().toISOString(),
    })
    .eq("id", variantId);

  if (error) throw new Error(error.message);
};

export const deleteAdminProduct = async (productId: string) => {
  const supabase = createSupabaseServerClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("image_path")
    .eq("id", productId)
    .maybeSingle<{ image_path: string | null }>();

  if (productError) throw new Error(productError.message);
  if (!product) throw new Error("Product not found.");

  if (product?.image_path) {
    await supabase.storage.from("product-images").remove([product.image_path]);
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) throw new Error(error.message);
};
