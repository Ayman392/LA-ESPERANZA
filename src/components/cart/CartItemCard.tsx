"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { CartLineItem } from "@/types/cart";

type CartItemCardProps = {
  item: CartLineItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
};

export function CartItemCard({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  onUpdateQuantity,
}: CartItemCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="grid gap-5 rounded-card border border-border bg-surface-strong p-4 shadow-soft sm:grid-cols-[8rem_1fr]"
    >
      <Link
        href={`/products/${item.product.slug}`}
        className="relative aspect-[4/5] overflow-hidden rounded-card bg-[#eee7e4]"
      >
        <Image
          src={item.product.image}
          alt={`${item.product.name} perfume bottle`}
          fill
          sizes="8rem"
          className="object-cover"
        />
      </Link>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">
              {item.product.gender} | {item.size}
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
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${item.product.name} from cart`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-charcoal transition hover:border-accent/45 hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <Trash2 aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit items-center rounded-full border border-border bg-background p-1">
            <button
              type="button"
              onClick={onDecrease}
              aria-label={`Decrease ${item.product.name} quantity`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-charcoal transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <Minus aria-hidden className="h-4 w-4" />
            </button>
            <input
              aria-label={`${item.product.name} quantity`}
              type="number"
              min={1}
              max={item.variant.stockQuantity}
              value={item.quantity}
              onChange={(event) => onUpdateQuantity(Number(event.target.value))}
              className="h-9 w-14 bg-transparent text-center text-sm font-semibold text-charcoal outline-none"
            />
            <button
              type="button"
              onClick={onIncrease}
              aria-label={`Increase ${item.product.name} quantity`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-charcoal transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <Plus aria-hidden className="h-4 w-4" />
            </button>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-muted">BDT {item.unitPrice} each</p>
            <p className="text-xl font-semibold text-charcoal">
              BDT {item.lineTotal}
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
