"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

const Badge = ({ count }: { count: number }) => (
  <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">
    {count}
  </span>
);

export function NavStoreBadges() {
  const { totalItems: cartItems, isReady: isCartReady } = useCart();
  const { totalItems: wishlistItems, isReady: isWishlistReady } = useWishlist();

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/wishlist"
        aria-label="Open wishlist"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-strong text-charcoal transition hover:border-accent/45 hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        <Heart aria-hidden className="h-4 w-4" />
        {isWishlistReady && wishlistItems > 0 ? (
          <Badge count={wishlistItems} />
        ) : null}
      </Link>
      <Link
        href="/cart"
        aria-label="Open cart"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-charcoal text-white transition hover:bg-[#38352f] focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        <ShoppingBag aria-hidden className="h-4 w-4" />
        {isCartReady && cartItems > 0 ? <Badge count={cartItems} /> : null}
      </Link>
    </div>
  );
}
