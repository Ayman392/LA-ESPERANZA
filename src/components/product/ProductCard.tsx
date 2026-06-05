import Image from "next/image";
import Link from "next/link";
import { ProductActions } from "@/components/product/ProductActions";
import { Card } from "@/components/ui/card";
import {
  getProductImageSrc,
  getProductMinPrice,
  getProductTotalStock,
  sortProductVariants,
} from "@/lib/products";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

// Catalog cards surface quick cart and wishlist actions while keeping details linked.
export function ProductCard({ product }: ProductCardProps) {
  const totalStock = getProductTotalStock(product);
  const imageSrc = getProductImageSrc(product);
  const variants = sortProductVariants(product.variants);

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#eee7e4]">
          <Image
            src={imageSrc}
            alt={`${product.name} perfume bottle`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/products/${product.slug}`} className="block flex-1">
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
            Inspired by {product.inspiredBy}
          </p>
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">
            {product.description}
          </p>
        </Link>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted">From</p>
            <p className="text-lg font-semibold text-charcoal">
              BDT {getProductMinPrice(product)}
            </p>
          </div>
          <p className="text-xs font-medium text-muted">
            {totalStock} total units
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {variants.map((variant) => (
            <span
              key={variant.id}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted"
            >
              {variant.sizeLabel}: {variant.stockQuantity}
            </span>
          ))}
        </div>
        <ProductActions product={product} />
      </div>
    </Card>
  );
}
