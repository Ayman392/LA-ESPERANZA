"use client";

import { useMemo, useState } from "react";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  filterProducts,
  maxCatalogPrice,
  minCatalogPrice,
} from "@/services/product-filters";
import type { Product, ProductFilters as ProductFilterState } from "@/types/product";

type ShopCatalogProps = {
  products: Product[];
  occasions: string[];
};

// Local catalog explorer keeps filtering client-side for a fast storefront feel.
export function ShopCatalog({ products, occasions }: ShopCatalogProps) {
  const maxPrice = maxCatalogPrice(products);
  const minPrice = minCatalogPrice(products);
  const [filters, setFilters] = useState<ProductFilterState>({
    search: "",
    gender: "All",
    minPrice,
    maxPrice,
    occasion: "All",
  });

  const filteredProducts = useMemo(
    () => filterProducts(products, filters),
    [filters, products],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr] lg:items-start">
      <ProductFilters
        filters={filters}
        minPrice={minPrice}
        maxPrice={maxPrice}
        occasions={occasions}
        onChange={setFilters}
      />
      <section aria-live="polite">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-accent">
              Catalog
            </p>
            <h2 className="font-serif text-3xl font-semibold text-charcoal">
              {filteredProducts.length} of {products.length} perfumes found
            </h2>
          </div>
          <p className="text-sm text-muted">
            Add favorites or build a cart directly from the catalog.
          </p>
        </div>
        <ProductGrid products={filteredProducts} />
      </section>
    </div>
  );
}
