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
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Users,
} from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/orders";
import type {
  AdminCustomer,
  AdminDashboardSummary,
  AdminOrder,
  AdminOrderStatus,
  AdminPayment,
  AdminProduct,
  AdminProductInput,
  AdminSection,
} from "@/types/admin";

type AdminPayload = {
  dashboard: AdminDashboardSummary;
  orders: AdminOrder[];
  payments: AdminPayment[];
  customers: AdminCustomer[];
  products: AdminProduct[];
};

type AdminContextValue = {
  data: AdminPayload;
  message: string;
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
  isRefreshing: boolean;
  filteredOrders: AdminOrder[];
  lowStockProducts: AdminProduct[];
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
  updateOrderStatus: (orderId: string, status: AdminOrderStatus) => Promise<void>;
  updatePayment: (
    payment: AdminPayment,
    action: "verify" | "reject",
    rejectionReason?: string,
  ) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  saveProduct: () => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
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
  size15mlPrice: 0,
  size30mlPrice: 0,
  stock: 0,
  image: "/products/flame.png",
  isActive: true,
};

const metricIcons = [ShoppingBag, CreditCard, Package, Users];

const inputClass =
  "h-11 rounded-card border border-border bg-background px-3 text-sm text-charcoal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

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
  recentOrders: orders.slice(0, 5),
});

const withDashboardMetrics = (currentData: AdminPayload): AdminPayload => ({
  ...currentData,
  dashboard: calculateDashboardMetrics(currentData.orders, currentData.payments),
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
          if (response.status === 401) {
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

  const lowStockProducts = useMemo(
    () => (data?.products ?? []).filter((product) => product.stock <= 5),
    [data?.products],
  );

  const dashboardMetrics = data
    ? calculateDashboardMetrics(data.orders, data.payments)
    : null;

  const metrics: Array<[string, string | number]> = dashboardMetrics
    ? [
        ["Total Orders", dashboardMetrics.totalOrders],
        ["Total Revenue", `BDT ${dashboardMetrics.totalRevenue}`],
        ["Pending Orders", dashboardMetrics.pendingOrders],
        ["Payment Checks", dashboardMetrics.pendingPaymentVerifications],
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
      if (error instanceof AdminApiError && error.status === 401) {
        router.refresh();
      }
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
        lowStockProducts,
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
        updateOrderStatus,
        updatePayment,
        refreshDashboard,
        saveProduct,
        deleteProduct,
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
            setEditingProductId(product.id);
            setProductForm(product);
          }}
          onDelete={(productId) => void deleteProduct(productId)}
        />
      </section>
    </AdminPageShell>
  );
}

export function AdminInventoryPage() {
  const { data, message, lowStockProducts } = useAdminDashboard();

  return (
    <AdminPageShell eyebrow="Inventory" title="Stock inventory" message={message}>
      <section className="space-y-5">
        {lowStockProducts.length > 0 ? (
          <div className="rounded-card border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle aria-hidden className="h-5 w-5 text-amber-700" />
              <p className="font-semibold text-amber-900">
                {lowStockProducts.length} low stock warning
              </p>
            </div>
          </div>
        ) : null}
        <ProductTable products={data.products} />
      </section>
    </AdminPageShell>
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
  const update = <Key extends keyof AdminProductInput>(
    key: Key,
    value: AdminProductInput[Key],
  ) => onChange({ ...product, [key]: value });

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
        <input
          className={inputClass}
          value={product.image}
          onChange={(event) => update("image", event.target.value)}
          placeholder="/products/flame.png"
        />
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
          value={product.size30mlPrice}
          onChange={(event) =>
            update("size30mlPrice", Number(event.target.value))
          }
          placeholder="30ml price"
        />
        <input
          className={inputClass}
          type="number"
          value={product.stock}
          onChange={(event) => update("stock", Number(event.target.value))}
          placeholder="Stock"
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
            onClick={onSave}
            className="h-11 rounded-full bg-charcoal px-4 text-sm font-semibold text-white"
          >
            {isEditing ? "Save" : "Create"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-full border border-border bg-background px-4 text-sm font-semibold text-charcoal"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

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

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface-strong shadow-soft">
      {products.map((product) => (
        <div
          key={product.id}
          className="grid gap-4 border-b border-border p-4 last:border-b-0 md:grid-cols-[1fr_8rem_8rem_auto]"
        >
          <div>
            <p className="font-semibold text-charcoal">{product.name}</p>
            <p className="mt-1 text-sm text-muted">
              {product.gender} | {product.inspiredBy}
            </p>
          </div>
          <p className="text-sm text-muted">Stock {product.stock}</p>
          <p className="text-sm text-muted">
            {product.stock <= 5
              ? "Low stock"
              : product.isActive
                ? "Active"
                : "Hidden"}
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
