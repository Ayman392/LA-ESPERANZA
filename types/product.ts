export type ProductGender = "Men" | "Women" | "Unisex";

export type ProductSize = "15ml" | "30ml";

export type ProductPrices = Record<ProductSize, number>;

export type Product = {
  slug: string;
  name: string;
  inspired_by: string;
  gender: ProductGender;
  sizes: ProductSize[];
  prices: ProductPrices;
  stockQuantity: number;
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  longevity: string;
  occasion: string;
  description: string;
  imagePath: string;
};

export type ProductFilters = {
  search: string;
  gender: "All" | ProductGender;
  maxPrice: number;
  occasion: "All" | string;
};
