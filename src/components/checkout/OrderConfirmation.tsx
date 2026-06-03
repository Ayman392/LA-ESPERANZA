"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { paymentMethodLabels } from "@/lib/orders";
import type { SavedOrder } from "@/types/order";

export function OrderConfirmation() {
  const searchParams = useSearchParams();
  const requestedOrderNumber = searchParams.get("order");
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      if (!requestedOrderNumber) {
        setErrorMessage("Order number is missing.");
        setIsReady(true);
        return;
      }

      const loadOrder = async () => {
        try {
          const response = await fetch(
            `/api/orders/${encodeURIComponent(requestedOrderNumber)}`,
          );
          const data = (await response.json()) as {
            order?: SavedOrder;
            error?: string;
          };

          if (!response.ok || !data.order) {
            throw new Error(data.error ?? "Order not found.");
          }

          setOrder(data.order);
        } catch (error) {
          setErrorMessage(
            error instanceof Error ? error.message : "Order not found.",
          );
        } finally {
          setIsReady(true);
        }
      };

      void loadOrder();
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, [requestedOrderNumber]);

  if (isReady && !order) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-card border border-dashed border-border bg-surface-strong px-6 py-16 text-center"
      >
        <h1 className="font-serif text-4xl font-semibold text-charcoal md:text-5xl">
          Order not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          {errorMessage || "Place a new order from your cart to generate a confirmation."}
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-charcoal px-5 text-sm font-semibold text-white transition hover:bg-[#38352f] focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          Browse perfumes
        </Link>
      </motion.div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-card border border-border bg-surface-strong px-6 py-16 text-center shadow-soft">
        <p className="text-sm font-semibold uppercase text-accent">
          Loading order
        </p>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start"
    >
      <div className="rounded-card border border-border bg-surface-strong p-6 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <CheckCircle2 aria-hidden className="h-10 w-10 text-accent" />
          <div>
            <p className="text-sm font-semibold uppercase text-accent">
              Order confirmed
            </p>
            <h1 className="mt-2 font-serif text-5xl font-semibold text-charcoal md:text-6xl">
              Thank you, {order.customer.customerName}.
            </h1>
            <p className="mt-4 text-base leading-8 text-muted">
              Your order has been saved in Supabase. Order number:
              <span className="font-semibold text-charcoal">
                {" "}
                {order.orderNumber}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase text-accent">
              Delivery
            </p>
            <p className="mt-2 text-sm font-semibold text-charcoal">
              {order.customer.phone}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {order.customer.deliveryAddress}, {order.customer.district}
            </p>
          </div>
          <div className="rounded-card border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase text-accent">
              Payment
            </p>
            <p className="mt-2 text-sm font-semibold text-charcoal">
              {paymentMethodLabels[order.payment.method]}
            </p>
            {order.payment.transactionId ? (
              <p className="mt-2 text-sm text-muted">
                Transaction ID: {order.payment.transactionId}
              </p>
            ) : null}
          </div>
        </div>

        <Link
          href="/shop"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-charcoal px-6 text-sm font-semibold text-white transition hover:bg-[#38352f] focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          Continue shopping
        </Link>
      </div>

      <aside className="rounded-card border border-border bg-surface-strong p-6 shadow-soft">
        {/* Confirmation uses the saved order snapshot, not the now-cleared cart. */}
        <p className="text-sm font-semibold uppercase text-accent">
          Final summary
        </p>
        <div className="mt-5 space-y-4">
          {order.items.map((item) => (
            <div
              key={`${item.productId}-${item.size}`}
              className="grid grid-cols-[4.5rem_1fr] gap-4 border-b border-border pb-4 last:border-b-0"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-[#eee7e4]">
                <Image
                  src={item.image}
                  alt={`${item.name} perfume bottle`}
                  fill
                  sizes="4.5rem"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-serif text-lg font-semibold text-charcoal">
                  {item.name}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {item.size} | Qty {item.quantity}
                </p>
                <p className="mt-2 text-sm font-semibold text-charcoal">
                  BDT {item.lineTotal}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
          <div className="flex items-center justify-between text-muted">
            <span>Subtotal</span>
            <span className="font-semibold text-charcoal">
              BDT {order.totals.subtotal}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted">
            <span>Delivery charge</span>
            <span className="font-semibold text-charcoal">
              BDT {order.totals.deliveryCharge}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-semibold text-charcoal">Grand total</span>
            <span className="text-2xl font-semibold text-charcoal">
              BDT {order.totals.grandTotal}
            </span>
          </div>
        </div>
      </aside>
    </motion.section>
  );
}
