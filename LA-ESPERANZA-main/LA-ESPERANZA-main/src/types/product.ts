export type ProductGender = "Men" | "Women" | "Unisex";

export type Product = {
  id: string;
  slug: string;
  name: string;
  inspiredBy: string;
  gender: ProductGender;
  size15mlPrice: number;
  size30mlPrice: number;
  stock: number;
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  longevity: string;
  occasion: string;
  description: string;
  image: string;
};

export type ProductFilters = {
  search: string;
  gender: "All" | ProductGender;
  minPrice: number;
  maxPrice: number;
  occasion: "All" | string;
};
