import type { Product, ProductFilters } from "@/types/product";

export const maxCatalogPrice = (products: Product[]) =>
  Math.max(...products.map((product) => product.prices["30ml"]));

// Pure filtering helper keeps catalog logic reusable outside the Shop page.
export function filterProducts(products: Product[], filters: ProductFilters) {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return products.filter((product) => {
    const matchesSearch =
      !normalizedSearch ||
      [
        product.name,
        product.inspired_by,
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
    const matchesPrice = product.prices["15ml"] <= filters.maxPrice;
    const matchesOccasion =
      filters.occasion === "All" || product.occasion === filters.occasion;

    return matchesSearch && matchesGender && matchesPrice && matchesOccasion;
  });
}
