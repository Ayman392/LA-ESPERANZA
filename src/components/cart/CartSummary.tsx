import Link from "next/link";
import { trackBeginCheckout } from "@/lib/marketing";
import type { CartLineItem } from "@/types/cart";

type CartSummaryProps = {
  lineItems: CartLineItem[];
  subtotal: number;
  totalItems: number;
  onClearCart: () => void;
};

export function CartSummary({
  lineItems,
  subtotal,
  totalItems,
  onClearCart,
}: CartSummaryProps) {
  return (
    <aside className="rounded-card border border-border bg-surface-strong p-6 shadow-soft">
      {/* Cart summary links into the local checkout flow while payment remains manual. */}
      <p className="text-sm font-semibold uppercase text-accent">Cart summary</p>
      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Total items</span>
          <span className="font-semibold text-charcoal">{totalItems}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted">Subtotal</span>
          <span className="text-2xl font-semibold text-charcoal">
            BDT {subtotal}
          </span>
        </div>
      </div>
      <div className="mt-6 grid gap-3">
        <Link
          href="/checkout"
          onClick={() => trackBeginCheckout(lineItems, subtotal)}
          className="btn-primary-luxury inline-flex h-11 items-center justify-center rounded-full bg-charcoal px-5 text-sm font-semibold text-white hover:bg-[#38352f] focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          Checkout
        </Link>
        <Link
          href="/shop"
          className="btn-secondary-luxury inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-semibold text-charcoal hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          Continue shopping
        </Link>
        <button
          type="button"
          onClick={onClearCart}
          className="btn-secondary-luxury inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-semibold text-charcoal hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          Clear cart
        </button>
      </div>
    </aside>
  );
}
