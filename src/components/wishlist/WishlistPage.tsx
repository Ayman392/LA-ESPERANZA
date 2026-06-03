"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { WishlistItemCard } from "@/components/wishlist/WishlistItemCard";
import { useWishlist } from "@/hooks/useWishlist";

export function WishlistPage() {
  const { wishlistProducts, removeItem } = useWishlist();

  if (wishlistProducts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-card border border-dashed border-border bg-surface-strong px-6 py-16 text-center"
      >
        <Heart aria-hidden className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-5 font-serif text-4xl font-semibold text-charcoal md:text-5xl">
          Your wishlist is empty
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Save perfumes you love and they will remain here after refresh or
          restart.
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
    <section>
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase text-accent">Wishlist</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold text-charcoal md:text-6xl">
          Saved fragrances
        </h1>
        <p className="mt-4 text-base leading-8 text-muted">
          Keep favorite LA ESPERANZA perfumes close before choosing the perfect
          size.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence initial={false}>
          {wishlistProducts.map((item) => (
            <WishlistItemCard
              key={item.productId}
              item={item}
              onRemove={() => removeItem(item.productId)}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
