"use client";

import Link from "next/link";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

const iconButtonClass =
  "btn-icon-luxury relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md hover:bg-white/14 hover:text-[#E1C78F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96A] sm:h-11 sm:w-11";

const Badge = ({ count }: { count: number }) => (
  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[#0F0F0F] bg-[#C9A96A] px-1 text-[10px] font-bold text-[#111111]">
    {count}
  </span>
);

export function NavStoreBadges() {
  const { totalItems: cartItems, isReady: isCartReady } = useCart();
  const { totalItems: wishlistItems, isReady: isWishlistReady } = useWishlist();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link href="/shop" aria-label="Search perfumes" className={iconButtonClass}>
        <Search aria-hidden className="h-4 w-4" />
      </Link>
      <Link
        href="/wishlist"
        aria-label="Open wishlist"
        className={iconButtonClass}
      >
        <Heart aria-hidden className="h-4 w-4" />
        {isWishlistReady && wishlistItems > 0 ? (
          <Badge count={wishlistItems} />
        ) : null}
      </Link>
      <Link href="/cart" aria-label="Open cart" className={iconButtonClass}>
        <ShoppingBag aria-hidden className="h-4 w-4" />
        {isCartReady && cartItems > 0 ? <Badge count={cartItems} /> : null}
      </Link>
    </div>
  );
}
