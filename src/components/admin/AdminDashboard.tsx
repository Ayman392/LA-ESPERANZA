"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Package,
  Search,
  Shield,
  ShoppingBag,
  Users,
} from "lucide-react";
import { getAdminRequestHeaders } from "@/lib/admin-auth";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/orders";
import type {
  AdminCustomer,
  AdminDashboardSummary,
  AdminOrder,
  AdminOrderStatus,
  AdminPayment,
  AdminProduct,
  AdminProductInput,
} from "@/types/admin";

type AdminPayload = {
  dashboard: AdminDashboardSummary;
  orders: AdminOrder[];
  payments: AdminPayment[];
  customers: AdminCustomer[];
  products: AdminProduct[];
  accessMode: "key" | "phase8-placeholder";
};

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

const callAdminApi = async (path: string, init?: RequestInit) => {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAdminRequestHeaders(),
      ...init?.headers,
    },
  });
  const data = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Admin request failed.");
  }

  return data;
};

export function AdminDashboard() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminOrderStatus>(
    "all",
  );
  const [productForm, setProductForm] =
    useState<AdminProductInput>(emptyProduct);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/dashboard", {
        headers: getAdminRequestHeaders(),
      });
      const payload = (await response.json()) as AdminPayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load admin dashboard.");
      }

      setData(payload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load admin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

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

  const lowStockProducts = (data?.products ?? []).filter(
    (product) => product.stock <= 5,
  );

  const metrics = data
    ? [
        ["Total Orders", data.dashboard.totalOrders],
        ["Total Revenue", `BDT ${data.dashboard.totalRevenue}`],
        ["Pending Orders", data.dashboard.pendingOrders],
        ["Payment Checks", data.dashboard.pendingPaymentVerifications],
      ]
    : [];

  const refreshAfter = async (action: () => Promise<void>) => {
    setMessage("");
    await action();
    await loadDashboard();
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

  if (isLoading) {
    return (
      <div className="rounded-card border border-border bg-surface-strong px-6 py-16 text-center shadow-soft">
        <p className="text-sm font-semibold uppercase text-accent">
          Loading admin dashboard
        </p>
      </div>
    );
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
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-accent">
            Admin Dashboard
          </p>
          <h1 className="mt-3 font-serif text-5xl font-semibold text-charcoal md:text-6xl">
            LA ESPERANZA operations
          </h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-strong px-4 py-2 text-sm font-semibold text-charcoal">
          <Shield aria-hidden className="h-4 w-4 text-accent" />
          {data.accessMode === "key" ? "Access key protected" : "Phase 8 auth-ready"}
        </div>
      </header>

      {message ? (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {message}
        </div>
      ) : null}

      <nav className="flex flex-wrap gap-2">
        {["overview", "orders", "payments", "customers", "products", "inventory"].map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`h-10 rounded-full px-4 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-charcoal text-white"
                  : "border border-border bg-surface-strong text-charcoal hover:border-accent/45"
              }`}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ),
        )}
      </nav>

      {activeTab === "overview" ? (
        <section className="space-y-6">
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
          <AdminOrderList orders={data.dashboard.recentOrders} compact />
        </section>
      ) : null}

      {activeTab === "orders" ? (
        <section className="space-y-5">
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
            onStatusChange={(orderId, status) =>
              refreshAfter(() =>
                callAdminApi(`/api/admin/orders/${orderId}`, {
                  method: "PATCH",
                  body: JSON.stringify({ status }),
                }).then(() => undefined),
              )
            }
          />
        </section>
      ) : null}

      {activeTab === "payments" ? (
        <section className="grid gap-4">
          {data.payments.length === 0 ? (
            <EmptyState title="No pending manual payments" />
          ) : (
            data.payments.map((payment) => (
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
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        refreshAfter(() =>
                          callAdminApi(`/api/admin/payments/${payment.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ action: "verify" }),
                          }).then(() => undefined),
                        )
                      }
                      className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white"
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const rejectionReason = window.prompt(
                          "Enter rejection reason",
                        );
                        if (rejectionReason) {
                          void refreshAfter(() =>
                            callAdminApi(`/api/admin/payments/${payment.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({
                                action: "reject",
                                rejectionReason,
                              }),
                            }).then(() => undefined),
                          );
                        }
                      }}
                      className="h-10 rounded-full border border-border bg-background px-4 text-sm font-semibold text-charcoal"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      ) : null}

      {activeTab === "customers" ? (
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
      ) : null}

      {activeTab === "products" ? (
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
            onDelete={(productId) =>
              refreshAfter(() =>
                callAdminApi(`/api/admin/products/${productId}`, {
                  method: "DELETE",
                }).then(() => undefined),
              )
            }
          />
        </section>
      ) : null}

      {activeTab === "inventory" ? (
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
      ) : null}
    </motion.div>
  );
}

function AdminOrderList({
  orders,
  compact = false,
  onStatusChange,
}: {
  orders: AdminOrder[];
  compact?: boolean;
  onStatusChange?: (orderId: string, status: AdminOrderStatus) => void;
}) {
  if (orders.length === 0) {
    return <EmptyState title="No orders found" />;
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface-strong shadow-soft">
      {orders.map((order) => (
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
                {order.paymentStatus ? paymentStatusLabels[order.paymentStatus] : "Pending"}
              </p>
            ) : null}
          </div>
          <p className="text-sm font-semibold text-charcoal">
            BDT {order.grandTotal}
          </p>
          {onStatusChange ? (
            <select
              value={order.status}
              onChange={(event) =>
                onStatusChange(order.id, event.target.value as AdminOrderStatus)
              }
              className={inputClass}
            >
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm font-semibold text-accent">{order.status}</p>
          )}
        </div>
      ))}
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
        <input className={inputClass} value={product.name} onChange={(event) => update("name", event.target.value)} placeholder="Name" />
        <input className={inputClass} value={product.slug} onChange={(event) => update("slug", event.target.value)} placeholder="Slug" />
        <input className={inputClass} value={product.inspiredBy} onChange={(event) => update("inspiredBy", event.target.value)} placeholder="Inspired by" />
        <select className={inputClass} value={product.gender} onChange={(event) => update("gender", event.target.value as AdminProduct["gender"])}>
          <option>Men</option>
          <option>Women</option>
          <option>Unisex</option>
        </select>
        <input className={inputClass} value={product.image} onChange={(event) => update("image", event.target.value)} placeholder="/products/flame.png" />
        <input className={inputClass} type="number" value={product.size15mlPrice} onChange={(event) => update("size15mlPrice", Number(event.target.value))} placeholder="15ml price" />
        <input className={inputClass} type="number" value={product.size30mlPrice} onChange={(event) => update("size30mlPrice", Number(event.target.value))} placeholder="30ml price" />
        <input className={inputClass} type="number" value={product.stock} onChange={(event) => update("stock", Number(event.target.value))} placeholder="Stock" />
        <label className="flex items-center gap-2 text-sm font-semibold text-charcoal">
          <input type="checkbox" checked={product.isActive} onChange={(event) => update("isActive", event.target.checked)} />
          Active
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onSave} className="h-11 rounded-full bg-charcoal px-4 text-sm font-semibold text-white">
            {isEditing ? "Save" : "Create"}
          </button>
          <button type="button" onClick={onCancel} className="h-11 rounded-full border border-border bg-background px-4 text-sm font-semibold text-charcoal">
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
            {product.stock <= 5 ? "Low stock" : product.isActive ? "Active" : "Hidden"}
          </p>
          {onEdit || onDelete ? (
            <div className="flex gap-2">
              {onEdit ? (
                <button type="button" onClick={() => onEdit(product)} className="h-9 rounded-full border border-border px-3 text-sm font-semibold">
                  Edit
                </button>
              ) : null}
              {onDelete ? (
                <button type="button" onClick={() => onDelete(product.id)} className="h-9 rounded-full bg-charcoal px-3 text-sm font-semibold text-white">
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
