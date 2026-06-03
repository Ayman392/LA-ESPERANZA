"use client";

import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import type { Product } from "@/types/product";
import type { CartProductSize } from "@/types/cart";

type ProductActionsProps = {
  product: Product;
  variant?: "compact" | "detail";
};

export function ProductActions({
  product,
  variant = "compact",
}: ProductActionsProps) {
  const [selectedSize, setSelectedSize] = useState<CartProductSize>("15ml");
  const { addItem } = useCart();
  const { hasItem, toggleItem } = useWishlist();
  const isWishlisted = hasItem(product.id);
  const isOutOfStock = product.stock <= 0;

  const sizeOptions: Array<{
    label: CartProductSize;
    price: number;
  }> = [
    { label: "15ml", price: product.size15mlPrice },
    { label: "30ml", price: product.size30mlPrice },
  ];

  if (variant === "compact") {
    return (
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={() => addItem(product.id, "15ml")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-charcoal px-4 text-sm font-semibold text-white transition hover:bg-[#38352f] focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag aria-hidden className="h-4 w-4" />
          Add 15ml
        </button>
        <button
          type="button"
          onClick={() => toggleItem(product.id)}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-charcoal transition hover:border-accent/45 hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <Heart
            aria-hidden
            className="h-4 w-4"
            fill={isWishlisted ? "currentColor" : "none"}
          />
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mt-6 rounded-card border border-border bg-surface-strong p-5 shadow-soft"
    >
      {/* Size selection controls the cart item price while keeping checkout work out of scope. */}
      <p className="text-sm font-semibold uppercase text-accent">Choose size</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {sizeOptions.map((option) => {
          const isSelected = selectedSize === option.label;

          return (
            <button
              key={option.label}
              type="button"
              onClick={() => setSelectedSize(option.label)}
              className={`rounded-card border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                isSelected
                  ? "border-accent bg-background shadow-soft"
                  : "border-border bg-white hover:border-accent/45"
              }`}
              aria-pressed={isSelected}
            >
              <span className="text-sm text-muted">{option.label}</span>
              <span className="mt-1 block text-2xl font-semibold text-charcoal">
                BDT {option.price}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={() => addItem(product.id, selectedSize)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-charcoal px-6 text-sm font-semibold text-white transition hover:bg-[#38352f] focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag aria-hidden className="h-4 w-4" />
          Add to cart
        </button>
        <button
          type="button"
          onClick={() => toggleItem(product.id)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-semibold text-charcoal transition hover:border-accent/45 hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <Heart
            aria-hidden
            className="h-4 w-4"
            fill={isWishlisted ? "currentColor" : "none"}
          />
          {isWishlisted ? "Wishlisted" : "Wishlist"}
        </button>
      </div>
    </motion.div>
  );
}
