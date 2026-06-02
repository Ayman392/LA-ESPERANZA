import type { Product, ProductFilters } from "@/types/product";

export const maxCatalogPrice = (products: Product[]) =>
  Math.max(...products.map((product) => product.size30mlPrice));

export const minCatalogPrice = (products: Product[]) =>
  Math.min(...products.map((product) => product.size15mlPrice));

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
    const matchesPrice =
      product.size15mlPrice >= filters.minPrice &&
      product.size15mlPrice <= filters.maxPrice;
    const matchesOccasion =
      filters.occasion === "All" || product.occasion === filters.occasion;

    return matchesSearch && matchesGender && matchesPrice && matchesOccasion;
  });
}
