"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import {
  getProductImageSrc,
  getProductMinPrice,
  sortProductVariants,
} from "@/lib/products";
import type { WishlistProduct } from "@/types/wishlist";

type WishlistItemCardProps = {
  item: WishlistProduct;
  onRemove: () => void;
};

export function WishlistItemCard({ item, onRemove }: WishlistItemCardProps) {
  const { addItem } = useCart();
  const sortedVariants = sortProductVariants(item.product.variants);
  const firstAvailableVariant =
    sortedVariants.find((variant) => variant.stockQuantity > 0) ??
    sortedVariants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(
    firstAvailableVariant?.id ?? "",
  );
  const selectedVariant =
    sortedVariants.find((variant) => variant.id === selectedVariantId) ??
    firstAvailableVariant;
  const isSelectedOutOfStock =
    !selectedVariant || selectedVariant.stockQuantity <= 0;
  const imageSrc = getProductImageSrc(item.product);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden rounded-card border border-border bg-surface-strong shadow-soft"
    >
      <Link
        href={`/products/${item.product.slug}`}
        className="relative block aspect-[4/5] bg-[#eee7e4]"
      >
        <Image
          src={imageSrc}
          alt={`${item.product.name} perfume bottle`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </Link>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase text-accent">
          {item.product.gender} | {item.product.occasion}
        </p>
        <Link
          href={`/products/${item.product.slug}`}
          className="mt-2 block font-serif text-2xl font-semibold text-charcoal transition hover:text-accent"
        >
          {item.product.name}
        </Link>
        <p className="mt-2 text-sm text-muted">
          Inspired by {item.product.inspiredBy}
        </p>
        <p className="mt-4 text-lg font-semibold text-charcoal">
          From BDT {getProductMinPrice(item.product)}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {sortedVariants.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id;
            const isOutOfStock = variant.stockQuantity <= 0;

            return (
              <button
                key={variant.id}
                type="button"
                disabled={isOutOfStock}
                onClick={() => setSelectedVariantId(variant.id)}
                className={`rounded-full border px-3 py-2 text-left text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                  isSelected
                    ? "border-accent bg-background text-charcoal shadow-soft"
                    : "border-border bg-white text-muted hover:border-accent/45 disabled:opacity-55"
                } disabled:cursor-not-allowed`}
                aria-pressed={isSelected}
              >
                <span className="block">{variant.sizeLabel}</span>
                <span className="mt-1 block font-medium">
                  {isOutOfStock ? "Out of Stock" : `${variant.stockQuantity} left`}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
          <button
            type="button"
            disabled={isSelectedOutOfStock}
            onClick={() =>
              selectedVariant
                ? addItem(
                    item.product.id,
                    selectedVariant.sizeLabel,
                    1,
                    item.product,
                    selectedVariant.id,
                  )
                : undefined
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-charcoal px-4 text-sm font-semibold text-white transition hover:bg-[#38352f] focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingBag aria-hidden className="h-4 w-4" />
            {isSelectedOutOfStock
              ? "Out of Stock"
              : `Add ${selectedVariant?.sizeLabel ?? ""}`}
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${item.product.name} from wishlist`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-charcoal transition hover:border-accent/45 hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <Trash2 aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
