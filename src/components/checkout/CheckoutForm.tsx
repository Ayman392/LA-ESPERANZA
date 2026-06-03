"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { useCart } from "@/hooks/useCart";
import {
  createOrderPayload,
  emptyCheckoutForm,
  isManualPayment,
  paymentMethodLabels,
  persistOrder,
  validateCheckoutForm,
} from "@/lib/orders";
import type {
  CheckoutFormErrors,
  CheckoutFormValues,
  PaymentMethod,
} from "@/types/order";

const districts = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Sylhet",
  "Barishal",
  "Rangpur",
  "Mymensingh",
];

const inputClass =
  "mt-2 h-12 w-full rounded-card border border-border bg-background px-4 text-sm text-charcoal outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

const textareaClass =
  "mt-2 min-h-28 w-full rounded-card border border-border bg-background px-4 py-3 text-sm text-charcoal outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

const labelClass = "text-sm font-semibold text-charcoal";

const ErrorText = ({ message }: { message?: string }) =>
  message ? <p className="mt-2 text-xs font-medium text-red-700">{message}</p> : null;

export function CheckoutForm() {
  const router = useRouter();
  const { lineItems, subtotal, isReady, clearCart } = useCart();
  const [values, setValues] = useState<CheckoutFormValues>(emptyCheckoutForm);
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [submissionError, setSubmissionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasCartItems = lineItems.length > 0;
  const showManualPaymentFields = isManualPayment(values.paymentMethod);

  const updateValue = <Key extends keyof CheckoutFormValues>(
    key: Key,
    value: CheckoutFormValues[Key],
  ) => {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [key]: undefined }));
    setSubmissionError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasCartItems) {
      return;
    }

    const nextErrors = validateCheckoutForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionError("");

    try {
      const order = await persistOrder(
        createOrderPayload(values, lineItems, subtotal),
      );

      clearCart();
      router.push(`/order-confirmation?order=${order.orderNumber}`);
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Unable to place your order. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isReady && !hasCartItems) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-card border border-dashed border-border bg-surface-strong px-6 py-16 text-center"
      >
        <AlertCircle aria-hidden className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-5 font-serif text-4xl font-semibold text-charcoal md:text-5xl">
          Your cart is empty
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Add perfume to your cart before continuing to checkout.
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

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start"
    >
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="rounded-card border border-border bg-surface-strong p-6 shadow-soft"
      >
        <div>
          <p className="text-sm font-semibold uppercase text-accent">Checkout</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold text-charcoal md:text-6xl">
            Delivery details
          </h1>
        </div>

        {/* Customer fields are validated before the Supabase order snapshot is saved. */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>
            Customer Name
            <input
              value={values.customerName}
              onChange={(event) => updateValue("customerName", event.target.value)}
              className={inputClass}
              placeholder="Full name"
              autoComplete="name"
            />
            <ErrorText message={errors.customerName} />
          </label>

          <label className={labelClass}>
            Phone Number
            <input
              value={values.phone}
              onChange={(event) => updateValue("phone", event.target.value)}
              className={inputClass}
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
            />
            <ErrorText message={errors.phone} />
          </label>

          <label className={labelClass}>
            Email <span className="text-muted">(optional)</span>
            <input
              type="email"
              value={values.email}
              onChange={(event) => updateValue("email", event.target.value)}
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className={labelClass}>
            District
            <select
              value={values.district}
              onChange={(event) => updateValue("district", event.target.value)}
              className={inputClass}
            >
              <option value="">Select district</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <ErrorText message={errors.district} />
          </label>
        </div>

        <div className="mt-5 grid gap-5">
          <label className={labelClass}>
            Delivery Address
            <textarea
              value={values.deliveryAddress}
              onChange={(event) =>
                updateValue("deliveryAddress", event.target.value)
              }
              className={textareaClass}
              placeholder="House, road, area, city"
              autoComplete="street-address"
            />
            <ErrorText message={errors.deliveryAddress} />
          </label>

          <label className={labelClass}>
            Notes
            <textarea
              value={values.notes}
              onChange={(event) => updateValue("notes", event.target.value)}
              className={textareaClass}
              placeholder="Delivery notes or fragrance preferences"
            />
          </label>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm font-semibold uppercase text-accent">
            Payment method
          </p>
          <div className="mt-4 grid gap-3">
            {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map(
              (method) => {
                const isSelected = values.paymentMethod === method;

                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => updateValue("paymentMethod", method)}
                    aria-pressed={isSelected}
                    className={`flex items-center gap-3 rounded-card border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                      isSelected
                        ? "border-accent bg-background shadow-soft"
                        : "border-border bg-white hover:border-accent/45"
                    }`}
                  >
                    {method === "cod" ? (
                      <Truck aria-hidden className="h-5 w-5 text-accent" />
                    ) : (
                      <CreditCard aria-hidden className="h-5 w-5 text-accent" />
                    )}
                    <span className="text-sm font-semibold text-charcoal">
                      {paymentMethodLabels[method]}
                    </span>
                    {isSelected ? (
                      <CheckCircle2
                        aria-hidden
                        className="ml-auto h-5 w-5 text-accent"
                      />
                    ) : null}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {showManualPaymentFields ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 grid gap-5 sm:grid-cols-2"
          >
            <label className={labelClass}>
              Sender Number
              <input
                value={values.senderNumber}
                onChange={(event) =>
                  updateValue("senderNumber", event.target.value)
                }
                className={inputClass}
                placeholder="01XXXXXXXXX"
                autoComplete="tel"
              />
              <ErrorText message={errors.senderNumber} />
            </label>
            <label className={labelClass}>
              Transaction ID
              <input
                value={values.transactionId}
                onChange={(event) =>
                  updateValue("transactionId", event.target.value)
                }
                className={inputClass}
                placeholder="Manual payment transaction ID"
              />
              <ErrorText message={errors.transactionId} />
            </label>
          </motion.div>
        ) : null}

        {submissionError ? (
          <div
            role="alert"
            className="mt-6 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {submissionError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!hasCartItems || isSubmitting}
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-charcoal px-6 text-sm font-semibold text-white transition hover:bg-[#38352f] focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSubmitting ? "Placing Order..." : "Place Order"}
        </button>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35, ease: "easeOut" }}
      >
        <CheckoutOrderSummary lineItems={lineItems} subtotal={subtotal} />
      </motion.div>
    </form>
  );
}
