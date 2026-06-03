import Image from "next/image";
import Link from "next/link";
import { DELIVERY_CHARGE } from "@/lib/orders";
import type { CartLineItem } from "@/types/cart";

type CheckoutOrderSummaryProps = {
  lineItems: CartLineItem[];
  subtotal: number;
};

export function CheckoutOrderSummary({
  lineItems,
  subtotal,
}: CheckoutOrderSummaryProps) {
  const grandTotal = subtotal + DELIVERY_CHARGE;

  return (
    <aside className="rounded-card border border-border bg-surface-strong p-6 shadow-soft">
      {/* Checkout totals are calculated from the persisted cart snapshot. */}
      <p className="text-sm font-semibold uppercase text-accent">Order summary</p>
      <div className="mt-5 space-y-4">
        {lineItems.map((item) => (
          <div
            key={`${item.productId}-${item.size}`}
            className="grid grid-cols-[4.5rem_1fr] gap-4 border-b border-border pb-4 last:border-b-0"
          >
            <Link
              href={`/products/${item.product.slug}`}
              className="relative aspect-[4/5] overflow-hidden rounded-card bg-[#eee7e4]"
            >
              <Image
                src={item.product.image}
                alt={`${item.product.name} perfume bottle`}
                fill
                sizes="4.5rem"
                className="object-cover"
              />
            </Link>
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-lg font-semibold text-charcoal">
                    {item.product.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {item.size} | Qty {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-charcoal">
                  BDT {item.lineTotal}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted">
                BDT {item.unitPrice} each
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-3 border-t border-border pt-5">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Subtotal</span>
          <span className="font-semibold text-charcoal">BDT {subtotal}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Delivery charge</span>
          <span className="font-semibold text-charcoal">
            BDT {DELIVERY_CHARGE}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm font-semibold text-charcoal">Grand total</span>
          <span className="text-2xl font-semibold text-charcoal">
            BDT {grandTotal}
          </span>
        </div>
      </div>
    </aside>
  );
}
