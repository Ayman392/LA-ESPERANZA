"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Circle,
  Clock3,
  CreditCard,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import {
  paymentMethodLabels,
  paymentStatusLabels,
} from "@/lib/orders";
import type { OrderStatus } from "@/types/order";
import type { TrackedOrder } from "@/types/order-tracking";

type TrackingFormErrors = {
  orderNumber?: string;
  phone?: string;
};

const timelineSteps = [
  { label: "Order Placed", icon: PackageCheck },
  { label: "Payment Verification", icon: CreditCard },
  { label: "Processing", icon: Clock3 },
  { label: "Shipped", icon: Truck },
  { label: "Delivered", icon: Check },
] as const;

const statusProgress: Record<OrderStatus, number> = {
  pending: 0,
  payment_verification: 1,
  confirmed: 2,
  processing: 2,
  shipped: 3,
  delivered: 4,
  completed: 4,
  cancelled: -1,
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Order Placed",
  payment_verification: "Payment Verification",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const currencyFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

function OrderTimeline({ status }: { status: OrderStatus }) {
  const currentStep = statusProgress[status];
  const isCancelled = status === "cancelled";

  return (
    <section aria-labelledby="tracking-timeline-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Journey
          </p>
          <h2
            id="tracking-timeline-title"
            className="mt-2 font-serif text-3xl font-semibold text-charcoal"
          >
            Order timeline
          </h2>
        </div>
        <span
          className={[
            "rounded-full px-3 py-1.5 text-xs font-semibold",
            isCancelled
              ? "bg-red-50 text-red-700"
              : "bg-[#f3ead8] text-[#725b2f]",
          ].join(" ")}
        >
          {statusLabels[status]}
        </span>
      </div>

      <ol className="mt-7 grid gap-0 md:grid-cols-5">
        {timelineSteps.map((step, index) => {
          const isComplete = !isCancelled && index < currentStep;
          const isActive = !isCancelled && index === currentStep;
          const Icon = step.icon;

          return (
            <li
              key={step.label}
              className="relative flex min-h-20 gap-4 pb-5 last:pb-0 md:min-h-0 md:flex-col md:items-center md:gap-3 md:pb-0 md:text-center"
            >
              {index < timelineSteps.length - 1 ? (
                <span
                  aria-hidden
                  className={[
                    "absolute left-[1.15rem] top-9 h-[calc(100%-1.5rem)] w-px md:left-[calc(50%+1.2rem)] md:top-[1.15rem] md:h-px md:w-[calc(100%-2.4rem)]",
                    isComplete ? "bg-[#C9A96A]" : "bg-border",
                  ].join(" ")}
                />
              ) : null}
              <span
                className={[
                  "relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                  isComplete || isActive
                    ? "border-[#C9A96A] bg-[#C9A96A] text-[#17130d] shadow-[0_8px_22px_rgba(201,169,106,0.24)]"
                    : "border-border bg-[#f1eeee] text-muted",
                ].join(" ")}
              >
                {isComplete ? (
                  <Check aria-hidden className="h-4 w-4" />
                ) : isActive ? (
                  <Icon aria-hidden className="h-4 w-4" />
                ) : (
                  <Circle aria-hidden className="h-3 w-3" />
                )}
              </span>
              <div>
                <p
                  className={[
                    "text-sm font-semibold",
                    isComplete || isActive ? "text-charcoal" : "text-muted",
                  ].join(" ")}
                >
                  {step.label}
                </p>
                {isActive ? (
                  <p className="mt-1 text-xs text-accent">Current status</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {isCancelled ? (
        <div className="mt-6 flex gap-3 rounded-card border border-red-200 bg-red-50 p-4 text-red-800">
          <XCircle aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">This order was cancelled.</p>
            <p className="mt-1 text-sm leading-6 text-red-700">
              Contact LA ESPERANZA if you need help with this order.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TrackingResult({ order }: { order: TrackedOrder }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mt-10 space-y-6"
    >
      <div className="rounded-card border border-border bg-surface-strong p-5 shadow-soft sm:p-7">
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Tracking result
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-charcoal sm:text-4xl">
              {order.orderNumber}
            </h1>
          </div>
          <p className="text-sm text-muted">Placed {formatDate(order.createdAt)}</p>
        </div>

        <div className="mt-7">
          <OrderTimeline status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-card border border-border bg-surface-strong p-5 shadow-soft sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Fragrances
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-charcoal">
            Order items
          </h2>

          <div className="mt-6 divide-y divide-border">
            {order.items.map((item, index) => (
              <article
                key={`${item.productName}-${item.size}-${index}`}
                className="grid gap-3 py-5 first:pt-0 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <h3 className="font-serif text-xl font-semibold text-charcoal">
                    {item.productName}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {item.size} · Quantity {item.quantity}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatCurrency(item.unitPrice)} each
                  </p>
                </div>
                <p className="font-semibold text-charcoal">
                  {formatCurrency(item.totalPrice)}
                </p>
              </article>
            ))}
          </div>

          <dl className="space-y-3 border-t border-border pt-5 text-sm">
            <div className="flex justify-between gap-4 text-muted">
              <dt>Subtotal</dt>
              <dd className="font-semibold text-charcoal">
                {formatCurrency(order.totals.subtotal)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 text-muted">
              <dt>Delivery charge</dt>
              <dd className="font-semibold text-charcoal">
                {formatCurrency(order.totals.deliveryCharge)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-4">
              <dt className="font-semibold text-charcoal">Total amount</dt>
              <dd className="font-serif text-2xl font-semibold text-charcoal">
                {formatCurrency(order.totals.grandTotal)}
              </dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-card border border-border bg-surface-strong p-5 shadow-soft sm:p-6">
            <div className="flex items-center gap-3">
              <MapPin aria-hidden className="h-5 w-5 text-accent" />
              <h2 className="font-serif text-2xl font-semibold text-charcoal">
                Delivery
              </h2>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Customer
                </dt>
                <dd className="mt-1 font-semibold text-charcoal">
                  {order.customer.name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Phone
                </dt>
                <dd className="mt-1 text-charcoal">{order.customer.phone}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Address
                </dt>
                <dd className="mt-1 leading-6 text-charcoal">
                  {order.customer.deliveryAddress}
                  {order.customer.district
                    ? `, ${order.customer.district}`
                    : ""}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-card border border-border bg-surface-strong p-5 shadow-soft sm:p-6">
            <div className="flex items-center gap-3">
              <CreditCard aria-hidden className="h-5 w-5 text-accent" />
              <h2 className="font-serif text-2xl font-semibold text-charcoal">
                Payment
              </h2>
            </div>
            {order.payment ? (
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Method</dt>
                  <dd className="text-right font-semibold text-charcoal">
                    {paymentMethodLabels[order.payment.method]}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Status</dt>
                  <dd className="rounded-full bg-[#f3ead8] px-3 py-1 text-right text-xs font-semibold text-[#725b2f]">
                    {paymentStatusLabels[order.payment.status]}
                  </dd>
                </div>
                {order.payment.transactionId ? (
                  <div>
                    <dt className="text-muted">Transaction ID</dt>
                    <dd className="mt-1 break-all font-semibold text-charcoal">
                      {order.payment.transactionId}
                    </dd>
                  </div>
                ) : null}
                {order.payment.senderNumber ? (
                  <div>
                    <dt className="text-muted">Sender number</dt>
                    <dd className="mt-1 font-semibold text-charcoal">
                      {order.payment.senderNumber}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted">
                Payment information is not available yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </motion.div>
  );
}

export function OrderTracker() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<TrackingFormErrors>({});
  const [requestError, setRequestError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: TrackingFormErrors = {};
    if (!orderNumber.trim()) {
      nextErrors.orderNumber = "Order number is required.";
    }
    if (!phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    }

    setErrors(nextErrors);
    setRequestError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          phone: phone.trim(),
        }),
      });
      const data = (await response.json()) as {
        order?: TrackedOrder;
        error?: string;
      };

      if (!response.ok || !data.order) {
        throw new Error(
          data.error ?? "We could not find an order with those details.",
        );
      }

      setOrder(data.order);
    } catch (error) {
      setOrder(null);
      setRequestError(
        error instanceof Error
          ? error.message
          : "We could not find an order with those details.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section className="mx-auto max-w-3xl rounded-card border border-border bg-surface-strong p-5 shadow-soft sm:p-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Your fragrance journey
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-charcoal sm:text-5xl">
            Track your order
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted sm:text-base">
            Enter the order number from your confirmation and the phone number
            used at checkout.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-charcoal">
              Order Number
            </span>
            <input
              type="text"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="LE-XXXXXXXX-XXXX"
              autoComplete="off"
              aria-invalid={Boolean(errors.orderNumber)}
              aria-describedby={
                errors.orderNumber ? "order-number-error" : undefined
              }
              className="mt-2 h-12 w-full rounded-full border border-border bg-background px-5 text-sm text-charcoal outline-none transition placeholder:text-muted/70 focus:border-[#C9A96A] focus:ring-4 focus:ring-[#C9A96A]/10"
            />
            {errors.orderNumber ? (
              <span
                id="order-number-error"
                className="mt-2 block text-xs text-red-700"
              >
                {errors.orderNumber}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-charcoal">
              Phone Number
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "tracking-phone-error" : undefined}
              className="mt-2 h-12 w-full rounded-full border border-border bg-background px-5 text-sm text-charcoal outline-none transition placeholder:text-muted/70 focus:border-[#C9A96A] focus:ring-4 focus:ring-[#C9A96A]/10"
            />
            {errors.phone ? (
              <span
                id="tracking-phone-error"
                className="mt-2 block text-xs text-red-700"
              >
                {errors.phone}
              </span>
            ) : null}
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary-luxury btn-campaign-gold inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <Search aria-hidden className="h-4 w-4" />
              )}
              {isLoading ? "Checking order..." : "Track Order"}
            </button>
          </div>
        </form>

        {requestError ? (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800"
          >
            {requestError}
          </motion.div>
        ) : null}
      </section>

      {order ? <TrackingResult order={order} /> : null}
    </>
  );
}
