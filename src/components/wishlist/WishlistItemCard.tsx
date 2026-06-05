"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { getProductImageSrc, getProductVariant } from "@/lib/products";
import type { WishlistProduct } from "@/types/wishlist";

type WishlistItemCardProps = {
  item: WishlistProduct;
  onRemove: () => void;
};

export function WishlistItemCard({ item, onRemove }: WishlistItemCardProps) {
  const { addItem } = useCart();
  const defaultVariant = getProductVariant(item.product, "15ml");
  const isDefaultOutOfStock =
    !defaultVariant || defaultVariant.stockQuantity <= 0;
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
          From BDT {item.product.size15mlPrice}
        </p>
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
          <button
            type="button"
            disabled={isDefaultOutOfStock}
            onClick={() => addItem(item.product.id, "15ml")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-charcoal px-4 text-sm font-semibold text-white transition hover:bg-[#38352f] focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingBag aria-hidden className="h-4 w-4" />
            {isDefaultOutOfStock ? "Out of stock" : "Add 15ml"}
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
