"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  ImageIcon,
  MessageSquareText,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/orders";
import type {
  AdminAnalytics,
  AdminCustomer,
  AdminDashboardSummary,
  AdminOrder,
  AdminOrderStatus,
  AdminPayment,
  AdminProduct,
  AdminProductInput,
  AdminProductVariant,
  AdminReview,
  AdminSection,
} from "@/types/admin";

type AdminPayload = {
  dashboard: AdminDashboardSummary;
  orders: AdminOrder[];
  payments: AdminPayment[];
  customers: AdminCustomer[];
  products: AdminProduct[];
  variants: AdminProductVariant[];
  analytics: AdminAnalytics;
  reviews: AdminReview[];
};

type AdminContextValue = {
  data: AdminPayload;
  message: string;
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
  isRefreshing: boolean;
  filteredOrders: AdminOrder[];
  lowStockVariants: AdminProductVariant[];
  metrics: Array<[string, string | number]>;
  search: string;
  setSearch: (search: string) => void;
  statusFilter: "all" | AdminOrderStatus;
  setStatusFilter: (status: "all" | AdminOrderStatus) => void;
  productForm: AdminProductInput;
  setProductForm: (product: AdminProductInput) => void;
  editingProductId: string | null;
  setEditingProductId: (productId: string | null) => void;
  updatingOrderIds: Set<string>;
  updatingPaymentIds: Set<string>;
  updatingVariantIds: Set<string>;
  updatingReviewIds: Set<string>;
  updateOrderStatus: (orderId: string, status: AdminOrderStatus) => Promise<void>;
  updatePayment: (
    payment: AdminPayment,
    action: "verify" | "reject",
    rejectionReason?: string,
  ) => Promise<void>;
  updateInventoryStock: (
    variantId: string,
    stockQuantity: number,
    lowStockThreshold: number,
  ) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  saveProduct: () => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  moderateReview: (
    review: AdminReview,
    action: "approve" | "reject" | "delete",
  ) => Promise<void>;
};

const AdminDashboardContext = createContext<AdminContextValue | null>(null);

const orderStatuses: AdminOrderStatus[] = [
  "pending",
  "payment_verification",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const emptyProduct: AdminProductInput = {
  slug: "",
  name: "",
  inspiredBy: "",
  gender: "Unisex",
  description: "",
  topNotes: [],
  middleNotes: [],
  baseNotes: [],
  longevity: "",
  occasion: "",
  size15mlPrice: 0,
  size15mlStock: 30,
  size30mlPrice: 0,
  size30mlStock: 30,
  lowStockThreshold: 5,
  image: "/products/flame.png",
  imageUrl: "/products/flame.png",
  imagePath: undefined,
  isActive: true,
};

const metricIcons = [
  ShoppingBag,
  CreditCard,
  Package,
  Users,
  AlertTriangle,
  Package,
  Package,
];

const inputClass =
  "h-11 rounded-card border border-border bg-background px-3 text-sm text-charcoal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";
const allowedProductImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxProductImageSize = 5 * 1024 * 1024;

const formatCurrency = (value: number) => `BDT ${value.toLocaleString()}`;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const callAdminApi = async (path: string, init?: RequestInit) => {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new AdminApiError(data.error ?? "Admin request failed.", response.status);
  }

  return data;
};

const calculateDashboardMetrics = (
  orders: AdminOrder[],
  payments: AdminPayment[],
  variants: AdminProductVariant[] = [],
): AdminDashboardSummary => ({
  totalOrders: orders.length,
  totalRevenue: orders
    .filter((order) => order.status !== "cancelled")
    .reduce((total, order) => total + order.grandTotal, 0),
  pendingOrders: orders.filter((order) => order.status === "pending").length,
  pendingPaymentVerifications: payments.filter((payment) => {
    const relatedOrder = orders.find((order) => order.id === payment.orderId);

    return (
      payment.status === "verification_required" &&
      (!relatedOrder || relatedOrder.status === "payment_verification")
    );
  }).length,
  totalInventoryUnits: variants
    .filter((variant) => variant.isActive)
    .reduce((total, variant) => total + variant.stockQuantity, 0),
  lowStockProducts: variants.filter(
    (variant) =>
      variant.isActive &&
      variant.stockQuantity <= variant.lowStockThreshold,
  ).length,
  outOfStockProducts: variants.filter(
    (variant) => variant.isActive && variant.stockQuantity === 0,
  ).length,
  recentOrders: orders.slice(0, 5),
});

const withDashboardMetrics = (currentData: AdminPayload): AdminPayload => ({
  ...currentData,
  dashboard: calculateDashboardMetrics(
    currentData.orders,
    currentData.payments,
    currentData.variants,
  ),
});

const updateOrderStatusLocally = (
  currentData: AdminPayload,
  orderId: string,
  status: AdminOrderStatus,
): AdminPayload => {
  const orders = currentData.orders.map((order) =>
    order.id === orderId ? { ...order, status } : order,
  );
  const customers = currentData.customers.map((customer) => ({
    ...customer,
    orders: customer.orders.map((order) => {
      const matchingOrder = currentData.orders.find(
        (entry) =>
          entry.id === orderId && entry.orderNumber === order.orderNumber,
      );

      return matchingOrder ? { ...order, status } : order;
    }),
  }));

  return withDashboardMetrics({ ...currentData, orders, customers });
};

const removePaymentLocally = (
  currentData: AdminPayload,
  paymentId: string,
  nextOrderStatus?: AdminOrderStatus,
): AdminPayload => {
  const payment = currentData.payments.find((entry) => entry.id === paymentId);
  const payments = currentData.payments.filter((entry) => entry.id !== paymentId);
  let nextData = withDashboardMetrics({
    ...currentData,
    payments,
  });

  if (payment && nextOrderStatus) {
    nextData = updateOrderStatusLocally(
      {
        ...nextData,
        payments,
      },
      payment.orderId,
      nextOrderStatus,
    );
  }

  return withDashboardMetrics(nextData);
};

const updateVariantInventoryLocally = (
  currentData: AdminPayload,
  variantId: string,
  stockQuantity: number,
  lowStockThreshold: number,
): AdminPayload => {
  const variants = currentData.variants.map((variant) =>
    variant.id === variantId
      ? {
          ...variant,
          stockQuantity,
          lowStockThreshold,
        }
      : variant,
  );
  const products = currentData.products.map((product) => {
    const productVariants = variants.filter(
      (variant) => variant.productId === product.id,
    );

    return {
      ...product,
      variants: productVariants,
    };
  });

  return withDashboardMetrics({ ...currentData, products, variants });
};

const updateReviewModerationLocally = (
  currentData: AdminPayload,
  review: AdminReview,
  action: "approve" | "reject" | "delete",
): AdminPayload => {
  const currentStatistics = currentData.analytics.reviewStatistics;
  const wasApproved = review.moderationStatus === "approved";
  const wasPending = review.moderationStatus === "pending";
  let totalReviews = currentStatistics.totalReviews;
  let approvedReviews = currentStatistics.approvedReviews;
  let pendingReviews = currentStatistics.pendingReviews;
  let approvedRatingTotal =
    currentStatistics.averageRating * currentStatistics.approvedReviews;

  if (action === "delete") {
    totalReviews = Math.max(0, totalReviews - 1);
    pendingReviews = Math.max(0, pendingReviews - (wasPending ? 1 : 0));
    approvedReviews = Math.max(0, approvedReviews - (wasApproved ? 1 : 0));
    approvedRatingTotal = Math.max(
      0,
      approvedRatingTotal - (wasApproved ? review.rating : 0),
    );
  } else if (action === "approve" && !wasApproved) {
    pendingReviews = Math.max(0, pendingReviews - (wasPending ? 1 : 0));
    approvedReviews += 1;
    approvedRatingTotal += review.rating;
  } else if (action === "reject") {
    pendingReviews = Math.max(0, pendingReviews - (wasPending ? 1 : 0));

    if (wasApproved) {
      approvedReviews = Math.max(0, approvedReviews - 1);
      approvedRatingTotal = Math.max(0, approvedRatingTotal - review.rating);
    }
  }

  const reviews =
    action === "delete"
      ? currentData.reviews.filter((entry) => entry.id !== review.id)
      : currentData.reviews.map((entry) =>
          entry.id === review.id
            ? {
                ...entry,
                moderationStatus:
                  action === "approve"
                    ? ("approved" as const)
                    : ("rejected" as const),
                isApproved: action === "approve",
              }
            : entry,
        );

  return {
    ...currentData,
    reviews,
    analytics: {
      ...currentData.analytics,
      reviewStatistics: {
        totalReviews,
        approvedReviews,
        pendingReviews,
        averageRating:
          approvedReviews > 0 ? approvedRatingTotal / approvedReviews : 0,
      },
    },
  };
};

const getAdminVariantBySize = (product: AdminProduct, sizeMl: 15 | 30) =>
  product.variants.find((variant) => variant.sizeMl === sizeMl);

function useAdminDashboard() {
  const context = useContext(AdminDashboardContext);

  if (!context) {
    throw new Error("Admin dashboard context is unavailable.");
  }

  return context;
}

export function AdminDashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [data, setData] = useState<AdminPayload | null>(null);
  const [activeSection, setActiveSection] =
    useState<AdminSection>("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminOrderStatus>(
    "all",
  );
  const [productForm, setProductForm] =
    useState<AdminProductInput>(emptyProduct);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [updatingPaymentIds, setUpdatingPaymentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [updatingVariantIds, setUpdatingVariantIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [updatingReviewIds, setUpdatingReviewIds] = useState<Set<string>>(
    () => new Set(),
  );
  const hasLoadedDashboard = useRef(false);

  const loadDashboard = useCallback(
    async ({
      silent = false,
      showError = true,
    }: {
      silent?: boolean;
      showError?: boolean;
    } = {}) => {
      if (!silent) {
        setIsLoading(true);
        setMessage("");
      }

      try {
        const response = await fetch("/api/admin/dashboard", {
          credentials: "same-origin",
        });
        const payload = (await response.json()) as AdminPayload & {
          error?: string;
        };

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            router.replace("/admin/login");
            router.refresh();
          }
          throw new Error(payload.error ?? "Unable to load admin dashboard.");
        }

        setData(withDashboardMetrics(payload));
      } catch (error) {
        if (showError) {
          setMessage(
            error instanceof Error ? error.message : "Unable to load admin.",
          );
        }
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [router],
  );

  useEffect(() => {
    if (hasLoadedDashboard.current) {
      return;
    }

    hasLoadedDashboard.current = true;
    const loadTimer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadDashboard]);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void loadDashboard({ silent: true, showError: false });
    }, 60000);

    return () => window.clearInterval(refreshTimer);
  }, [loadDashboard]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (data?.orders ?? []).filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesSearch =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [data?.orders, search, statusFilter]);

  const lowStockVariants = useMemo(
    () =>
      (data?.variants ?? []).filter(
        (variant) =>
          variant.isActive &&
          variant.stockQuantity <= variant.lowStockThreshold,
      ),
    [data?.variants],
  );

  const dashboardMetrics = data
    ? calculateDashboardMetrics(data.orders, data.payments, data.variants)
    : null;

  const metrics: Array<[string, string | number]> = dashboardMetrics
    ? [
        ["Total Orders", dashboardMetrics.totalOrders],
        ["Total Revenue", `BDT ${dashboardMetrics.totalRevenue}`],
        ["Pending Orders", dashboardMetrics.pendingOrders],
        ["Payment Checks", dashboardMetrics.pendingPaymentVerifications],
        ["Total Inventory Units", dashboardMetrics.totalInventoryUnits],
        ["Low Stock Products", dashboardMetrics.lowStockProducts],
        ["Out of Stock Products", dashboardMetrics.outOfStockProducts],
      ]
    : [];

  const updateOrderStatus = async (
    orderId: string,
    status: AdminOrderStatus,
  ) => {
    const previousStatus = data?.orders.find((order) => order.id === orderId)
      ?.status;

    if (!data || !previousStatus || updatingOrderIds.has(orderId)) {
      return;
    }

    setMessage("");
    setUpdatingOrderIds((current) => {
      const next = new Set(current);
      next.add(orderId);
      return next;
    });
    setData((current) =>
      current ? updateOrderStatusLocally(current, orderId, status) : current,
    );

    try {
      await callAdminApi(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      if (
        error instanceof AdminApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        router.replace("/admin/login");
        router.refresh();
      }
      setData((current) =>
        current
          ? updateOrderStatusLocally(current, orderId, previousStatus)
          : current,
      );
      setMessage(
        error instanceof Error ? error.message : "Unable to update order.",
      );
    } finally {
      setUpdatingOrderIds((current) => {
        const next = new Set(current);
        next.delete(orderId);
        return next;
      });
    }
  };

  const updatePayment = async (
    payment: AdminPayment,
    action: "verify" | "reject",
    rejectionReason?: string,
  ) => {
    const previousOrderStatus = data?.orders.find(
      (order) => order.id === payment.orderId,
    )?.status;

    if (!data || updatingPaymentIds.has(payment.id)) {
      return;
    }

    const nextOrderStatus = action === "verify" ? "processing" : undefined;
    setMessage("");
    setUpdatingPaymentIds((current) => {
      const next = new Set(current);
      next.add(payment.id);
      return next;
    });
    setData((current) =>
      current ? removePaymentLocally(current, payment.id, nextOrderStatus) : current,
    );

    try {
      await callAdminApi(`/api/admin/payments/${payment.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, rejectionReason }),
      });
    } catch (error) {
      if (
        error instanceof AdminApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        router.replace("/admin/login");
        router.refresh();
      }
      setData((current) => {
        if (!current) {
          return current;
        }

        const payments = current.payments.some((entry) => entry.id === payment.id)
          ? current.payments
          : [payment, ...current.payments];
        let nextData = withDashboardMetrics({
          ...current,
          payments,
        });

        if (previousOrderStatus && nextOrderStatus) {
          nextData = updateOrderStatusLocally(
            nextData,
            payment.orderId,
            previousOrderStatus,
          );
        }

        return withDashboardMetrics(nextData);
      });
      setMessage(
        error instanceof Error ? error.message : "Unable to update payment.",
      );
    } finally {
      setUpdatingPaymentIds((current) => {
        const next = new Set(current);
        next.delete(payment.id);
        return next;
      });
    }
  };

  const refreshAfter = async (action: () => Promise<void>) => {
    setMessage("");

    try {
      await action();
      await loadDashboard({ silent: true });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Admin action failed.",
      );
      if (
        error instanceof AdminApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        router.replace("/admin/login");
        router.refresh();
      }
    }
  };

  const updateInventoryStock = async (
    variantId: string,
    stockQuantity: number,
    lowStockThreshold: number,
  ) => {
    const variant = data?.variants.find((entry) => entry.id === variantId);
    const safeStock = Math.max(0, Math.trunc(stockQuantity));
    const safeThreshold = Math.max(0, Math.trunc(lowStockThreshold));

    if (!data || !variant || updatingVariantIds.has(variantId)) {
      return;
    }

    setMessage("");
    setUpdatingVariantIds((current) => {
      const next = new Set(current);
      next.add(variantId);
      return next;
    });
    setData((current) =>
      current
        ? updateVariantInventoryLocally(
            current,
            variantId,
            safeStock,
            safeThreshold,
          )
        : current,
    );

    try {
      await callAdminApi(`/api/admin/inventory/${variantId}`, {
        method: "PATCH",
        body: JSON.stringify({
          stockQuantity: safeStock,
          lowStockThreshold: safeThreshold,
        }),
      });
    } catch (error) {
      if (
        error instanceof AdminApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        router.replace("/admin/login");
        router.refresh();
      }
      setData((current) =>
        current
          ? updateVariantInventoryLocally(
              current,
              variantId,
              variant.stockQuantity,
              variant.lowStockThreshold,
            )
          : current,
      );
      setMessage(
        error instanceof Error ? error.message : "Unable to update stock.",
      );
    } finally {
      setUpdatingVariantIds((current) => {
        const next = new Set(current);
        next.delete(variantId);
        return next;
      });
    }
  };

  const refreshDashboard = async () => {
    setIsRefreshing(true);

    try {
      await loadDashboard({ silent: true });
    } finally {
      setIsRefreshing(false);
    }
  };

  const saveProduct = async () => {
    await refreshAfter(async () => {
      const path = editingProductId
        ? `/api/admin/products/${editingProductId}`
        : "/api/admin/products";
      await callAdminApi(path, {
        method: editingProductId ? "PATCH" : "POST",
        body: JSON.stringify(productForm),
      });
      setProductForm(emptyProduct);
      setEditingProductId(null);
    });
  };

  const deleteProduct = async (productId: string) => {
    await refreshAfter(() =>
      callAdminApi(`/api/admin/products/${productId}`, {
        method: "DELETE",
      }).then(() => undefined),
    );
  };

  const moderateReview = async (
    review: AdminReview,
    action: "approve" | "reject" | "delete",
  ) => {
    if (!data || updatingReviewIds.has(review.id)) {
      return;
    }

    const previousStatistics = data.analytics.reviewStatistics;
    setMessage("");
    setUpdatingReviewIds((current) => {
      const next = new Set(current);
      next.add(review.id);
      return next;
    });
    setData((current) =>
      current
        ? updateReviewModerationLocally(current, review, action)
        : current,
    );

    try {
      await callAdminApi(`/api/admin/reviews/${review.id}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        body:
          action === "delete"
            ? undefined
            : JSON.stringify({ action }),
      });
      void loadDashboard({ silent: true, showError: false });
    } catch (error) {
      setData((current) => {
        if (!current) {
          return current;
        }

        const withoutReview = current.reviews.filter(
          (entry) => entry.id !== review.id,
        );

        return {
          ...current,
          reviews: [review, ...withoutReview].sort(
            (first, second) =>
              new Date(second.createdAt).getTime() -
              new Date(first.createdAt).getTime(),
          ),
          analytics: {
            ...current.analytics,
            reviewStatistics: previousStatistics,
          },
        };
      });
      setMessage(
        error instanceof Error ? error.message : "Unable to moderate review.",
      );
    } finally {
      setUpdatingReviewIds((current) => {
        const next = new Set(current);
        next.delete(review.id);
        return next;
      });
    }
  };

  if (isLoading) {
    return <AdminWorkspaceSkeleton />;
  }

  if (!data) {
    return (
      <div className="rounded-card border border-border bg-surface-strong px-6 py-16 text-center shadow-soft">
        <p className="text-sm font-semibold uppercase text-accent">
          Admin access
        </p>
        <p className="mt-3 text-sm text-muted">{message}</p>
      </div>
    );
  }

  return (
    <AdminDashboardContext.Provider
      value={{
        data,
        message,
        activeSection,
        setActiveSection,
        isRefreshing,
        filteredOrders,
        lowStockVariants,
        metrics,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        productForm,
        setProductForm,
        editingProductId,
        setEditingProductId,
        updatingOrderIds,
        updatingPaymentIds,
        updatingVariantIds,
        updatingReviewIds,
        updateOrderStatus,
        updatePayment,
        updateInventoryStock,
        refreshDashboard,
        saveProduct,
        deleteProduct,
        moderateReview,
      }}
    >
      {children}
    </AdminDashboardContext.Provider>
  );
}

export function AdminWorkspace() {
  return (
    <AdminDashboardProvider>
      <AdminWorkspaceShell />
    </AdminDashboardProvider>
  );
}

function AdminWorkspaceShell() {
  const {
    activeSection,
    setActiveSection,
    isRefreshing,
    refreshDashboard,
  } = useAdminDashboard();

  return (
    <section className="min-h-screen bg-background text-charcoal">
      <div className="flex min-h-screen">
        {/* The admin shell stays mounted while sections swap in React state. */}
        <aside className="hidden w-[220px] shrink-0 border-r border-border bg-surface-strong/80 px-4 py-5 lg:flex lg:flex-col">
          <button
            type="button"
            onClick={() => setActiveSection("dashboard")}
            className="block rounded-card px-3 py-2 text-left"
          >
            <p className="whitespace-nowrap font-serif text-[21px] font-semibold leading-tight text-charcoal">
              LA ESPERANZA
            </p>
            <p className="mt-1 text-xs font-semibold uppercase text-accent">
              ADMIN
            </p>
          </button>

          <AdminSidebarNav
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          <div className="mt-auto border-t border-border pt-4">
            <AdminLogoutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-7">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase text-accent">
                  LA ESPERANZA Admin
                </p>
                <p className="mt-1 text-xs text-muted">
                  Single-page dashboard workspace
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void refreshDashboard()}
                  disabled={isRefreshing}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface-strong px-4 text-sm font-semibold text-charcoal transition hover:border-accent/45 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    aria-hidden
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </button>
                <div className="lg:hidden">
                  <AdminLogoutButton />
                </div>
              </div>
            </div>
            <div className="border-t border-border px-4 sm:px-6 lg:hidden">
              <AdminSidebarNav
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                variant="mobile"
              />
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-7">
            <AdminActiveSection />
          </main>
        </div>
      </div>
    </section>
  );
}

function AdminActiveSection() {
  const { activeSection } = useAdminDashboard();

  switch (activeSection) {
    case "orders":
      return <AdminOrdersManagement />;
    case "payments":
      return <AdminPaymentVerification />;
    case "customers":
      return <AdminCustomerList />;
    case "products":
      return <AdminProductManagement />;
    case "inventory":
      return <AdminInventoryPage />;
    case "analytics":
      return <AdminAnalyticsPage />;
    case "reviews":
      return <AdminReviewsManagement />;
    case "dashboard":
    default:
      return <AdminDashboardOverview />;
  }
}

function AdminWorkspaceSkeleton() {
  return (
    <section className="min-h-screen bg-background px-4 py-8 text-charcoal sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-16 rounded-card border border-border bg-surface-strong shadow-soft" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {["one", "two", "three", "four"].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-card border border-border bg-surface-strong shadow-soft"
            />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-card border border-border bg-surface-strong shadow-soft" />
      </div>
    </section>
  );
}

export function AdminDashboardOverview() {
  const { data, message, metrics } = useAdminDashboard();
  const recentOrders = calculateDashboardMetrics(
    data.orders,
    data.payments,
    data.variants,
  ).recentOrders;

  return (
    <AdminPageShell
      eyebrow="Dashboard"
      title="LA ESPERANZA operations"
      message={message}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value], index) => {
          const Icon = metricIcons[index];

          return (
            <article
              key={label}
              className="rounded-card border border-border bg-surface-strong p-5 shadow-soft"
            >
              <Icon aria-hidden className="h-5 w-5 text-accent" />
              <p className="mt-4 text-sm text-muted">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-charcoal">
                {value}
              </p>
            </article>
          );
        })}
      </div>
      <AdminOrderList orders={recentOrders} compact />
    </AdminPageShell>
  );
}

export function AdminOrdersManagement() {
  const {
    filteredOrders,
    message,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    updatingOrderIds,
    updateOrderStatus,
  } = useAdminDashboard();

  return (
    <AdminPageShell eyebrow="Orders" title="Orders management" message={message}>
      <div className="grid gap-3 md:grid-cols-[1fr_14rem]">
        <label className="relative">
          <Search
            aria-hidden
            className="absolute left-3 top-3 h-4 w-4 text-muted"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`${inputClass} w-full pl-9`}
            placeholder="Search order, customer, or phone"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "all" | AdminOrderStatus)
          }
          className={inputClass}
        >
          <option value="all">All statuses</option>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      <AdminOrderList
        orders={filteredOrders}
        updatingOrderIds={updatingOrderIds}
        onStatusChange={(orderId, status) => void updateOrderStatus(orderId, status)}
      />
    </AdminPageShell>
  );
}

export function AdminPaymentVerification() {
  const { data, message, updatingPaymentIds, updatePayment } =
    useAdminDashboard();

  return (
    <AdminPageShell
      eyebrow="Payments"
      title="Payment verification"
      message={message}
    >
      <section className="grid gap-4">
        {data.payments.length === 0 ? (
          <EmptyState title="No pending manual payments" />
        ) : (
          data.payments.map((payment) => {
            const isUpdatingPayment = updatingPaymentIds.has(payment.id);

            return (
              <article
                key={payment.id}
                className="rounded-card border border-border bg-surface-strong p-5 shadow-soft"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase text-accent">
                      {paymentMethodLabels[payment.method]} | {payment.orderNumber}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-charcoal">
                      BDT {payment.amount}
                    </p>
                    <p className="mt-3 text-sm text-muted">
                      Sender: {payment.senderNumber} | Transaction:{" "}
                      {payment.transactionId}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      Status: {paymentStatusLabels[payment.status]}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isUpdatingPayment}
                        onClick={() => void updatePayment(payment, "verify")}
                        className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Verify
                      </button>
                      <button
                        type="button"
                        disabled={isUpdatingPayment}
                        onClick={() => {
                          const rejectionReason = window.prompt(
                            "Enter rejection reason",
                          );
                          if (rejectionReason) {
                            void updatePayment(payment, "reject", rejectionReason);
                          }
                        }}
                        className="h-10 rounded-full border border-border bg-background px-4 text-sm font-semibold text-charcoal disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                    {isUpdatingPayment ? (
                      <p className="text-xs font-semibold uppercase text-accent">
                        Saving...
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </AdminPageShell>
  );
}

export function AdminCustomerList() {
  const { data, message } = useAdminDashboard();

  return (
    <AdminPageShell eyebrow="Customers" title="Customer list" message={message}>
      <section className="grid gap-4 lg:grid-cols-2">
        {data.customers.map((customer) => (
          <article
            key={customer.id}
            className="rounded-card border border-border bg-surface-strong p-5 shadow-soft"
          >
            <p className="font-serif text-2xl font-semibold text-charcoal">
              {customer.name}
            </p>
            <p className="mt-2 text-sm text-muted">
              {customer.phone} {customer.email ? `| ${customer.email}` : ""}
            </p>
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {customer.orders.length === 0 ? (
                <p className="text-sm text-muted">No orders yet.</p>
              ) : (
                customer.orders.map((order) => (
                  <p key={order.orderNumber} className="text-sm text-muted">
                    {order.orderNumber} | {order.status} | BDT{" "}
                    {order.grandTotal}
                  </p>
                ))
              )}
            </div>
          </article>
        ))}
      </section>
    </AdminPageShell>
  );
}

export function AdminProductManagement() {
  const {
    data,
    message,
    productForm,
    setProductForm,
    setEditingProductId,
    editingProductId,
    saveProduct,
    deleteProduct,
  } = useAdminDashboard();

  return (
    <AdminPageShell eyebrow="Products" title="Product management" message={message}>
      <section className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <ProductEditor
          product={productForm}
          isEditing={Boolean(editingProductId)}
          onChange={setProductForm}
          onCancel={() => {
            setProductForm(emptyProduct);
            setEditingProductId(null);
          }}
          onSave={() => void saveProduct()}
        />
        <ProductTable
          products={data.products}
          onEdit={(product) => {
            const size15Variant = getAdminVariantBySize(product, 15);
            const size30Variant = getAdminVariantBySize(product, 30);
            const fallbackThreshold =
              size15Variant?.lowStockThreshold ??
              size30Variant?.lowStockThreshold ??
              5;

            setEditingProductId(product.id);
            setProductForm({
              id: product.id,
              slug: product.slug,
              name: product.name,
              inspiredBy: product.inspiredBy,
              gender: product.gender,
              description: product.description,
              topNotes: product.topNotes,
              middleNotes: product.middleNotes,
              baseNotes: product.baseNotes,
              longevity: product.longevity,
              occasion: product.occasion,
              size15mlPrice: size15Variant?.price ?? 0,
              size15mlStock: size15Variant?.stockQuantity ?? 0,
              size30mlPrice: size30Variant?.price ?? 0,
              size30mlStock: size30Variant?.stockQuantity ?? 0,
              lowStockThreshold: fallbackThreshold,
              image: product.image,
              imageUrl: product.imageUrl,
              imagePath: product.imagePath,
              isActive: product.isActive,
            });
          }}
          onDelete={(productId) => void deleteProduct(productId)}
        />
      </section>
    </AdminPageShell>
  );
}

export function AdminInventoryPage() {
  const {
    data,
    message,
    lowStockVariants,
    updatingVariantIds,
    updateInventoryStock,
  } = useAdminDashboard();
  const outOfStockVariants = data.variants.filter(
    (variant) => variant.isActive && variant.stockQuantity === 0,
  );

  return (
    <AdminPageShell eyebrow="Inventory" title="Stock inventory" message={message}>
      <section className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-card border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle aria-hidden className="h-5 w-5 text-amber-700" />
              <div>
                <p className="font-semibold text-amber-900">
                  {lowStockVariants.length} low stock warning
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Size variants at or below their threshold.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-card border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-3">
              <Package aria-hidden className="h-5 w-5 text-red-700" />
              <div>
                <p className="font-semibold text-red-900">
                  {outOfStockVariants.length} out of stock
                </p>
                <p className="mt-1 text-sm text-red-800">
                  Size variants with no sellable units left.
                </p>
              </div>
            </div>
          </div>
        </div>
        <InventoryTable
          variants={data.variants}
          updatingVariantIds={updatingVariantIds}
          onUpdateStock={updateInventoryStock}
        />
      </section>
    </AdminPageShell>
  );
}

export function AdminReviewsManagement() {
  const {
    data,
    message,
    updatingReviewIds,
    moderateReview,
  } = useAdminDashboard();

  return (
    <AdminPageShell
      eyebrow="Reviews"
      title="Review moderation"
      message={message}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Reviews", data.analytics.reviewStatistics.totalReviews],
          [
            "Average Rating",
            data.analytics.reviewStatistics.averageRating.toFixed(1),
          ],
          ["Pending Reviews", data.analytics.reviewStatistics.pendingReviews],
          ["Approved Reviews", data.analytics.reviewStatistics.approvedReviews],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-card border border-border bg-surface-strong p-5 shadow-soft"
          >
            <MessageSquareText aria-hidden className="h-5 w-5 text-accent" />
            <p className="mt-4 text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-charcoal">
              {value}
            </p>
          </article>
        ))}
      </div>

      <section className="space-y-4">
        {data.reviews.length > 0 ? (
          data.reviews.map((review) => {
            const isUpdating = updatingReviewIds.has(review.id);

            return (
              <article
                key={review.id}
                className="rounded-card border border-border bg-surface-strong p-5 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-charcoal">
                        {review.customerName}
                      </p>
                      {review.verifiedPurchase ? (
                        <span className="rounded-full border border-[#C9A96A]/35 bg-[#C9A96A]/10 px-2.5 py-1 text-xs font-semibold text-[#725724]">
                          Verified Purchase
                        </span>
                      ) : null}
                      <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold capitalize text-muted">
                        {review.moderationStatus}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {review.productName}
                      {review.customerEmail
                        ? ` | ${review.customerEmail}`
                        : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDateTime(review.createdAt)}
                    </p>
                  </div>
                  <ReviewStars value={review.rating} size="sm" />
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">
                  {review.reviewText}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isUpdating || review.moderationStatus === "approved"}
                    onClick={() => void moderateReview(review, "approve")}
                    className="rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3d3933] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating || review.moderationStatus === "rejected"}
                    onClick={() => void moderateReview(review, "reject")}
                    className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-charcoal transition hover:border-accent/45 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => void moderateReview(review, "delete")}
                    className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isUpdating ? "Saving..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState title="No reviews submitted yet" />
        )}
      </section>
    </AdminPageShell>
  );
}

export function AdminAnalyticsPage() {
  const { data, message } = useAdminDashboard();
  const { analytics } = data;
  const overviewCards: Array<[string, string | number, typeof BarChart3]> = [
    ["Total Revenue", formatCurrency(analytics.overview.totalRevenue), BarChart3],
    ["Revenue Today", formatCurrency(analytics.overview.revenueToday), BarChart3],
    [
      "Revenue This Month",
      formatCurrency(analytics.overview.revenueThisMonth),
      BarChart3,
    ],
    ["Total Orders", analytics.overview.totalOrders, ShoppingBag],
    ["Orders Today", analytics.overview.ordersToday, ShoppingBag],
    ["Orders This Month", analytics.overview.ordersThisMonth, ShoppingBag],
    ["Pending Payments", analytics.overview.pendingPayments, CreditCard],
    ["Low Stock Products", analytics.overview.lowStockProducts, AlertTriangle],
    ["Out Of Stock Products", analytics.overview.outOfStockProducts, Package],
  ];

  return (
    <AdminPageShell
      eyebrow="Analytics"
      title="Business analytics"
      message={message}
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {overviewCards.map(([label, value, Icon]) => (
          <article
            key={label}
            className="rounded-card border border-border bg-surface-strong p-5 shadow-soft"
          >
            <Icon aria-hidden className="h-5 w-5 text-accent" />
            <p className="mt-4 text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-charcoal">
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-card border border-border bg-surface-strong p-5 shadow-soft">
        <p className="text-sm font-semibold uppercase text-accent">
          Review Statistics
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AnalyticsHighlight
            label="Total Reviews"
            value={analytics.reviewStatistics.totalReviews}
            detail="All submitted reviews"
          />
          <AnalyticsHighlight
            label="Average Rating"
            value={analytics.reviewStatistics.averageRating.toFixed(1)}
            detail="Approved reviews"
          />
          <AnalyticsHighlight
            label="Pending Reviews"
            value={analytics.reviewStatistics.pendingReviews}
            detail="Awaiting moderation"
          />
          <AnalyticsHighlight
            label="Approved Reviews"
            value={analytics.reviewStatistics.approvedReviews}
            detail="Visible on product pages"
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AnalyticsChartCard title="Revenue Trend" description="Last 30 days">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={analytics.trends}>
              <CartesianGrid stroke="#e4ddda" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  borderRadius: 8,
                  borderColor: "#ded7d2",
                  color: "#2c2924",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8f7356"
                fill="#d8c5b2"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </AnalyticsChartCard>

        <AnalyticsChartCard title="Orders Trend" description="Last 30 days">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.trends}>
              <CartesianGrid stroke="#e4ddda" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  borderColor: "#ded7d2",
                  color: "#2c2924",
                }}
              />
              <Bar dataKey="orders" fill="#2f2c27" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AnalyticsChartCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-card border border-border bg-surface-strong p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase text-accent">
            Best sellers
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <AnalyticsHighlight
              label="Best Selling Product"
              value={
                analytics.bestSellers.bestSellingProduct?.productName ??
                "No sales yet"
              }
              detail={`${analytics.bestSellers.bestSellingProduct?.quantity ?? 0} units`}
            />
            <AnalyticsHighlight
              label="Best Selling Size"
              value={
                analytics.bestSellers.bestSellingSize?.sizeLabel ??
                "No size sales yet"
              }
              detail={`${analytics.bestSellers.bestSellingSize?.quantity ?? 0} units`}
            />
          </div>
          <div className="mt-5 space-y-3">
            {analytics.bestSellers.topProducts.length > 0 ? (
              analytics.bestSellers.topProducts.map((product, index) => (
                <div
                  key={product.productSlug}
                  className="flex items-center justify-between gap-4 rounded-card border border-border bg-background p-4"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase text-accent">
                      #{index + 1}
                    </p>
                    <p className="mt-1 font-semibold text-charcoal">
                      {product.productName}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted">
                    <p>{product.quantity} units</p>
                    <p>{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No best seller data yet" />
            )}
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface-strong p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase text-accent">
            Inventory analytics
          </p>
          <div className="mt-5 space-y-3">
            <AnalyticsHighlight
              label="Total Inventory Units"
              value={analytics.inventory.totalInventoryUnits}
              detail="Across active variants"
            />
            <AnalyticsHighlight
              label="Low Stock Variants"
              value={analytics.inventory.lowStockVariants}
              detail="At or below threshold"
            />
            <AnalyticsHighlight
              label="Out Of Stock Variants"
              value={analytics.inventory.outOfStockVariants}
              detail="No sellable units"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AnalyticsActivityList title="Last 10 Orders">
          {analytics.recentActivity.orders.map((order) => (
            <div
              key={order.id}
              className="rounded-card border border-border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-charcoal">
                    {order.orderNumber}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {order.customerName} | {order.status}
                  </p>
                </div>
                <p className="text-sm font-semibold text-charcoal">
                  {formatCurrency(order.grandTotal)}
                </p>
              </div>
            </div>
          ))}
        </AnalyticsActivityList>

        <AnalyticsActivityList title="Last 10 Payment Updates">
          {analytics.recentActivity.payments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-card border border-border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-charcoal">
                    {payment.orderNumber}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {paymentMethodLabels[payment.method]} |{" "}
                    {paymentStatusLabels[payment.status]}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(payment.updatedAt)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-charcoal">
                  {formatCurrency(payment.amount)}
                </p>
              </div>
            </div>
          ))}
        </AnalyticsActivityList>
      </section>
    </AdminPageShell>
  );
}

function AnalyticsChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-surface-strong p-5 shadow-soft">
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase text-accent">{title}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

function AnalyticsHighlight({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-card border border-border bg-background p-4">
      <p className="text-xs font-semibold uppercase text-accent">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-charcoal">{value}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </div>
  );
}

function AnalyticsActivityList({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-surface-strong p-5 shadow-soft">
      <p className="text-sm font-semibold uppercase text-accent">{title}</p>
      <div className="mt-5 space-y-3">{children}</div>
    </div>
  );
}

function AdminPageShell({
  eyebrow,
  title,
  message,
  children,
}: {
  eyebrow: string;
  title: string;
  message?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <p className="text-sm font-semibold uppercase text-accent">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-charcoal md:text-5xl">
          {title}
        </h1>
      </header>

      {message ? (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {message}
        </div>
      ) : null}

      {children}
    </motion.div>
  );
}

function AdminOrderList({
  orders,
  compact = false,
  updatingOrderIds,
  onStatusChange,
}: {
  orders: AdminOrder[];
  compact?: boolean;
  updatingOrderIds?: Set<string>;
  onStatusChange?: (orderId: string, status: AdminOrderStatus) => void;
}) {
  if (orders.length === 0) {
    return <EmptyState title="No orders found" />;
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface-strong shadow-soft">
      {orders.map((order) => {
        const isUpdatingOrder = updatingOrderIds?.has(order.id) ?? false;

        return (
          <div
            key={order.id}
            className="grid gap-4 border-b border-border p-4 last:border-b-0 md:grid-cols-[1fr_9rem_12rem]"
          >
            <div>
              <p className="font-semibold text-charcoal">{order.orderNumber}</p>
              <p className="mt-1 text-sm text-muted">
                {order.customerName} | {order.customerPhone}
              </p>
              {!compact && order.paymentMethod ? (
                <p className="mt-1 text-xs text-muted">
                  {paymentMethodLabels[order.paymentMethod]} |{" "}
                  {order.paymentStatus
                    ? paymentStatusLabels[order.paymentStatus]
                    : "Pending"}
                </p>
              ) : null}
            </div>
            <p className="text-sm font-semibold text-charcoal">
              BDT {order.grandTotal}
            </p>
            {onStatusChange ? (
              <div className="space-y-2">
                <select
                  value={order.status}
                  disabled={isUpdatingOrder}
                  onChange={(event) =>
                    onStatusChange(order.id, event.target.value as AdminOrderStatus)
                  }
                  className={`${inputClass} w-full disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {isUpdatingOrder ? (
                  <p className="text-xs font-semibold uppercase text-accent">
                    Saving...
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm font-semibold text-accent">{order.status}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProductEditor({
  product,
  isEditing,
  onChange,
  onCancel,
  onSave,
}: {
  product: AdminProductInput;
  isEditing: boolean;
  onChange: (product: AdminProductInput) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [uploadedImagePath, setUploadedImagePath] = useState("");
  const update = <Key extends keyof AdminProductInput>(
    key: Key,
    value: AdminProductInput[Key],
  ) => onChange({ ...product, [key]: value });
  const formatNotes = (notes: string[]) => notes.join(", ");
  const parseNotes = (value: string) =>
    value
      .split(",")
      .map((note) => note.trim())
      .filter(Boolean);
  const imagePreview = product.imageUrl || product.image;

  const validateImageFile = (file: File) => {
    if (!allowedProductImageTypes.includes(file.type)) {
      throw new Error("Upload a JPG, JPEG, PNG, or WEBP image.");
    }

    if (file.size > maxProductImageSize) {
      throw new Error("Product images must be 5 MB or smaller.");
    }
  };

  const uploadProductImage = async (file: File) => {
    try {
      validateImageFile(file);
      setIsUploadingImage(true);
      setImageUploadError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/product-images", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const payload = (await response.json()) as {
        imageUrl?: string;
        imagePath?: string;
        error?: string;
      };

      if (!response.ok || !payload.imageUrl || !payload.imagePath) {
        throw new Error(payload.error ?? "Unable to upload image.");
      }

      onChange({
        ...product,
        image: payload.imageUrl,
        imageUrl: payload.imageUrl,
        imagePath: payload.imagePath,
      });
      setUploadedImagePath(payload.imagePath);
    } catch (error) {
      setImageUploadError(
        error instanceof Error ? error.message : "Unable to upload image.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const deleteProductImage = async () => {
    try {
      setIsUploadingImage(true);
      setImageUploadError("");

      if (product.imagePath && product.imagePath === uploadedImagePath) {
        const response = await fetch("/api/admin/product-images", {
          method: "DELETE",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imagePath: product.imagePath }),
        });
        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to delete image.");
        }
      }

      onChange({
        ...product,
        image: "/products/flame.png",
        imageUrl: undefined,
        imagePath: undefined,
      });
      setUploadedImagePath("");
    } catch (error) {
      setImageUploadError(
        error instanceof Error ? error.message : "Unable to delete image.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };
  const handleCancel = async () => {
    if (uploadedImagePath) {
      await fetch("/api/admin/product-images", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imagePath: uploadedImagePath }),
      });
      setUploadedImagePath("");
    }

    onCancel();
  };

  return (
    <div className="rounded-card border border-border bg-surface-strong p-5 shadow-soft">
      <p className="text-sm font-semibold uppercase text-accent">
        {isEditing ? "Edit product" : "Create product"}
      </p>
      <div className="mt-4 grid gap-3">
        <input
          className={inputClass}
          value={product.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Name"
        />
        <input
          className={inputClass}
          value={product.slug}
          onChange={(event) => update("slug", event.target.value)}
          placeholder="Slug"
        />
        <input
          className={inputClass}
          value={product.inspiredBy}
          onChange={(event) => update("inspiredBy", event.target.value)}
          placeholder="Inspired by"
        />
        <textarea
          className={`${inputClass} min-h-24 py-3`}
          value={product.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Description"
        />
        <input
          className={inputClass}
          value={product.occasion}
          onChange={(event) => update("occasion", event.target.value)}
          placeholder="Occasion"
        />
        <input
          className={inputClass}
          value={product.longevity}
          onChange={(event) => update("longevity", event.target.value)}
          placeholder="Longevity"
        />
        <input
          className={inputClass}
          value={formatNotes(product.topNotes)}
          onChange={(event) => update("topNotes", parseNotes(event.target.value))}
          placeholder="Top notes, comma separated"
        />
        <input
          className={inputClass}
          value={formatNotes(product.middleNotes)}
          onChange={(event) =>
            update("middleNotes", parseNotes(event.target.value))
          }
          placeholder="Middle notes, comma separated"
        />
        <input
          className={inputClass}
          value={formatNotes(product.baseNotes)}
          onChange={(event) => update("baseNotes", parseNotes(event.target.value))}
          placeholder="Base notes, comma separated"
        />
        <select
          className={inputClass}
          value={product.gender}
          onChange={(event) =>
            update("gender", event.target.value as AdminProduct["gender"])
          }
        >
          <option>Men</option>
          <option>Women</option>
          <option>Unisex</option>
        </select>
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingImage(true);
          }}
          onDragLeave={() => setIsDraggingImage(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDraggingImage(false);
            const file = event.dataTransfer.files[0];

            if (file) {
              void uploadProductImage(file);
            }
          }}
          className={`rounded-card border border-dashed p-4 transition ${
            isDraggingImage
              ? "border-accent bg-background"
              : "border-border bg-background/70"
          }`}
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-border bg-[#eee7e4]">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt={`${product.name || "Product"} image preview`}
                fill
                sizes="22rem"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">
                <ImageIcon aria-hidden className="h-8 w-8" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void uploadProductImage(file);
              }

              event.target.value = "";
            }}
            className="hidden"
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={isUploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-charcoal px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UploadCloud aria-hidden className="h-4 w-4" />
              {isUploadingImage ? "Uploading..." : "Upload image"}
            </button>
            <button
              type="button"
              disabled={isUploadingImage || (!product.imagePath && !product.imageUrl)}
              onClick={() => void deleteProductImage()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-semibold text-charcoal disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 aria-hidden className="h-4 w-4" />
              Delete image
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">
            Drag and drop or upload JPG, JPEG, PNG, or WEBP up to 5 MB.
          </p>
          {imageUploadError ? (
            <p className="mt-2 text-xs font-semibold text-red-700">
              {imageUploadError}
            </p>
          ) : null}
        </div>
        <input
          className={inputClass}
          value={product.imageUrl || product.image}
          onChange={(event) =>
            onChange({
              ...product,
              image: event.target.value,
              imageUrl: event.target.value,
              imagePath: undefined,
            })
          }
          placeholder="Image URL"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={inputClass}
            type="number"
            value={product.size15mlPrice}
            onChange={(event) =>
              update("size15mlPrice", Number(event.target.value))
            }
            placeholder="15ml price"
          />
          <input
            className={inputClass}
            type="number"
            value={product.size15mlStock}
            onChange={(event) =>
              update("size15mlStock", Number(event.target.value))
            }
            placeholder="15ml stock"
          />
          <input
            className={inputClass}
            type="number"
            value={product.size30mlPrice}
            onChange={(event) =>
              update("size30mlPrice", Number(event.target.value))
            }
            placeholder="30ml price"
          />
          <input
            className={inputClass}
            type="number"
            value={product.size30mlStock}
            onChange={(event) =>
              update("size30mlStock", Number(event.target.value))
            }
            placeholder="30ml stock"
          />
        </div>
        <input
          className={inputClass}
          type="number"
          value={product.lowStockThreshold}
          onChange={(event) =>
            update("lowStockThreshold", Number(event.target.value))
          }
          placeholder="Low stock threshold"
        />
        <label className="flex items-center gap-2 text-sm font-semibold text-charcoal">
          <input
            type="checkbox"
            checked={product.isActive}
            onChange={(event) => update("isActive", event.target.checked)}
          />
          Active
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              onSave();
              setUploadedImagePath("");
            }}
            className="h-11 rounded-full bg-charcoal px-4 text-sm font-semibold text-white"
          >
            {isEditing ? "Save" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => void handleCancel()}
            className="h-11 rounded-full border border-border bg-background px-4 text-sm font-semibold text-charcoal"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

const getInventoryStatus = (variant: AdminProductVariant) => {
  if (!variant.isActive) {
    return "Hidden";
  }

  if (variant.stockQuantity === 0) {
    return "Out of Stock";
  }

  if (variant.stockQuantity <= variant.lowStockThreshold) {
    return "Low Stock";
  }

  return "In Stock";
};

const getInventoryStatusClass = (variant: AdminProductVariant) => {
  const status = getInventoryStatus(variant);

  if (status === "Out of Stock") {
    return "text-red-700";
  }

  if (status === "Low Stock") {
    return "text-amber-700";
  }

  return status === "Hidden" ? "text-muted" : "text-charcoal";
};

function ProductTable({
  products,
  onEdit,
  onDelete,
}: {
  products: AdminProduct[];
  onEdit?: (product: AdminProduct) => void;
  onDelete?: (productId: string) => void;
}) {
  if (products.length === 0) {
    return <EmptyState title="No products found" />;
  }

  const variantRows = products.flatMap((product) =>
    product.variants.map((variant) => ({ product, variant })),
  );

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface-strong shadow-soft">
      {variantRows.map(({ product, variant }) => (
        <div
          key={variant.id}
          className="grid gap-4 border-b border-border p-4 last:border-b-0 md:grid-cols-[1.4fr_5rem_8rem_8rem_9rem_9rem_auto]"
        >
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-card border border-border bg-[#eee7e4]">
              <Image
                src={product.imageUrl || product.image}
                alt={`${product.name} preview`}
                fill
                sizes="3.5rem"
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-charcoal">{product.name}</p>
              <p className="mt-1 text-sm text-muted">
                {product.gender} | {product.inspiredBy}
              </p>
            </div>
          </div>
          <p className="text-sm font-semibold text-charcoal">
            {variant.sizeLabel}
          </p>
          <p className="text-sm text-muted">
            BDT {variant.price}
          </p>
          <p className="text-sm text-muted">
            Stock {variant.stockQuantity}
          </p>
          <p className="text-sm text-muted">
            Threshold {variant.lowStockThreshold}
          </p>
          <p className={`text-sm font-semibold ${getInventoryStatusClass(variant)}`}>
            {getInventoryStatus(variant)}
          </p>
          {onEdit || onDelete ? (
            <div className="flex gap-2">
              {onEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="h-9 rounded-full border border-border px-3 text-sm font-semibold"
                >
                  Edit
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(product.id)}
                  className="h-9 rounded-full bg-charcoal px-3 text-sm font-semibold text-white"
                >
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function InventoryTable({
  variants,
  updatingVariantIds,
  onUpdateStock,
}: {
  variants: AdminProductVariant[];
  updatingVariantIds: Set<string>;
  onUpdateStock: (
    variantId: string,
    stockQuantity: number,
    lowStockThreshold: number,
  ) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<
    Record<string, { stock: string; lowStockThreshold: string }>
  >({});

  if (variants.length === 0) {
    return <EmptyState title="No inventory variants found" />;
  }

  const updateDraft = (
    variantId: string,
    key: "stock" | "lowStockThreshold",
    value: string,
  ) => {
    setDrafts((current) => ({
      ...current,
      [variantId]: {
        stock: current[variantId]?.stock ?? "0",
        lowStockThreshold: current[variantId]?.lowStockThreshold ?? "5",
        [key]: value,
      },
    }));
  };

  const setDraftStock = (variant: AdminProductVariant, stockQuantity: number) => {
    setDrafts((current) => ({
      ...current,
      [variant.id]: {
        stock: String(Math.max(0, stockQuantity)),
        lowStockThreshold:
          current[variant.id]?.lowStockThreshold ??
          String(variant.lowStockThreshold),
      },
    }));
  };

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface-strong shadow-soft">
      {variants.map((variant) => {
        const draft = drafts[variant.id] ?? {
          stock: String(variant.stockQuantity),
          lowStockThreshold: String(variant.lowStockThreshold),
        };
        const draftStock = Number(draft.stock);
        const draftThreshold = Number(draft.lowStockThreshold);
        const isUpdating = updatingVariantIds.has(variant.id);

        return (
          <div
            key={variant.id}
            className="grid gap-4 border-b border-border p-4 last:border-b-0 xl:grid-cols-[1.2fr_8rem_10rem_10rem_9rem_auto]"
          >
            <div>
              <p className="font-semibold text-charcoal">{variant.productName}</p>
              <p className="mt-1 text-sm text-muted">
                Size {variant.sizeLabel} | {variant.productSlug}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-accent">
                Adjust
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={isUpdating || variant.stockQuantity <= 0}
                  onClick={() => {
                    const nextStock = Math.max(0, variant.stockQuantity - 1);
                    setDraftStock(variant, nextStock);
                    void onUpdateStock(
                      variant.id,
                      nextStock,
                      variant.lowStockThreshold,
                    );
                  }}
                  className="h-10 w-10 rounded-full border border-border bg-background text-sm font-semibold text-charcoal disabled:cursor-not-allowed disabled:opacity-60"
                >
                  -
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => {
                    const nextStock = variant.stockQuantity + 1;
                    setDraftStock(variant, nextStock);
                    void onUpdateStock(
                      variant.id,
                      nextStock,
                      variant.lowStockThreshold,
                    );
                  }}
                  className="h-10 w-10 rounded-full border border-border bg-background text-sm font-semibold text-charcoal disabled:cursor-not-allowed disabled:opacity-60"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-accent">
                Current stock
              </p>
              <input
                type="number"
                min={0}
                value={draft.stock}
                disabled={isUpdating}
                onChange={(event) =>
                  updateDraft(variant.id, "stock", event.target.value)
                }
                className={`${inputClass} mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60`}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-accent">
                Low threshold
              </p>
              <input
                type="number"
                min={0}
                value={draft.lowStockThreshold}
                disabled={isUpdating}
                onChange={(event) =>
                  updateDraft(variant.id, "lowStockThreshold", event.target.value)
                }
                className={`${inputClass} mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60`}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-accent">
                Status
              </p>
              <p
                className={`mt-3 text-sm font-semibold ${getInventoryStatusClass(variant)}`}
              >
                {getInventoryStatus(variant)}
              </p>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                disabled={
                  isUpdating ||
                  !Number.isFinite(draftStock) ||
                  !Number.isFinite(draftThreshold)
                }
                onClick={() =>
                  void onUpdateStock(variant.id, draftStock, draftThreshold)
                }
                className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? "Saving..." : "Update stock"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-card border border-dashed border-border bg-surface-strong px-6 py-12 text-center">
      <CheckCircle2 aria-hidden className="mx-auto h-8 w-8 text-accent" />
      <p className="mt-3 font-serif text-2xl font-semibold text-charcoal">
        {title}
      </p>
    </div>
  );
}
