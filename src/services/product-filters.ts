import type { Product, ProductFilters } from "@/types/product";
import { getProductMaxPrice, getProductMinPrice } from "@/lib/products";

export const maxCatalogPrice = (products: Product[]) =>
  products.length
    ? Math.max(...products.map((product) => getProductMaxPrice(product)))
    : 0;

export const minCatalogPrice = (products: Product[]) =>
  products.length
    ? Math.min(...products.map((product) => getProductMinPrice(product)))
    : 0;

// Pure filtering helper keeps catalog logic reusable outside the Shop page.
export function filterProducts(products: Product[], filters: ProductFilters) {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return products.filter((product) => {
    const matchesSearch =
      !normalizedSearch ||
      [
        product.name,
        product.inspiredBy,
        product.description,
        product.gender,
        product.occasion,
        ...product.topNotes,
        ...product.middleNotes,
        ...product.baseNotes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

    const matchesGender =
      filters.gender === "All" || product.gender === filters.gender;
    const matchesPrice = product.variants.some(
      (variant) =>
        variant.price >= filters.minPrice && variant.price <= filters.maxPrice,
    );
    const matchesOccasion =
      filters.occasion === "All" || product.occasion === filters.occasion;

    return matchesSearch && matchesGender && matchesPrice && matchesOccasion;
  });
}
