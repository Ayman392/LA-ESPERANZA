import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

// Product cards are browse-only previews; cart actions are deliberately excluded from Phase 2.
export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-soft">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#eee7e4]">
          <Image
            src={product.imagePath}
            alt={`${product.name} perfume bottle`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-accent">
                {product.gender}
              </p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-charcoal">
                {product.name}
              </h3>
            </div>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted">
              {product.occasion}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-muted">
            Inspired by {product.inspired_by}
          </p>
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">
            {product.description}
          </p>

          <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted">From</p>
              <p className="text-lg font-semibold text-charcoal">
                BDT {product.prices["15ml"]}
              </p>
            </div>
            <p className="text-xs font-medium text-muted">
              {product.stock} in stock
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
