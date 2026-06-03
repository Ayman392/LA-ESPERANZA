import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/product";

type ProductGridProps = {
  products: Product[];
};

// Responsive catalog grid with an empty state for searches and filters with no matches.
export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-surface-strong px-6 py-16 text-center">
        <p className="font-serif text-3xl font-semibold text-charcoal">
          No perfumes found
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Try a softer search term or adjust the gender, price, or occasion
          filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
