"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CartItemCard } from "@/components/cart/CartItemCard";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCart } from "@/hooks/useCart";

export function CartPage() {
  const {
    lineItems,
    subtotal,
    totalItems,
    clearCart,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    updateQuantity,
  } = useCart();

  if (lineItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-card border border-dashed border-border bg-surface-strong px-6 py-16 text-center"
      >
        <ShoppingBag
          aria-hidden
          className="mx-auto h-10 w-10 text-accent"
        />
        <h1 className="mt-5 font-serif text-4xl font-semibold text-charcoal md:text-5xl">
          Your cart is empty
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Add a fragrance from the shop and it will stay here after refresh or
          restart.
        </p>
        <Link
          href="/shop"
          className="btn-primary-luxury mt-6 inline-flex h-11 items-center justify-center rounded-full bg-charcoal px-5 text-sm font-semibold text-white hover:bg-[#38352f] focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          Browse perfumes
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <section>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase text-accent">
            Shopping cart
          </p>
          <h1 className="mt-3 font-serif text-5xl font-semibold text-charcoal md:text-6xl">
            Selected perfumes
          </h1>
        </div>
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {lineItems.map((item) => (
              <CartItemCard
                key={`${item.productId}-${item.size}`}
                item={item}
                onIncrease={() => increaseQuantity(item.productId, item.size)}
                onDecrease={() => decreaseQuantity(item.productId, item.size)}
                onRemove={() => removeItem(item.productId, item.size)}
                onUpdateQuantity={(quantity) =>
                  updateQuantity(item.productId, item.size, quantity)
                }
              />
            ))}
          </AnimatePresence>
        </div>
      </section>
      <CartSummary
        lineItems={lineItems}
        subtotal={subtotal}
        totalItems={totalItems}
        onClearCart={clearCart}
      />
    </div>
  );
}
