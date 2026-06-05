export type ProductGender = "Men" | "Women" | "Unisex";
export type ProductSizeMl = 15 | 30;
export type ProductSizeLabel = `${ProductSizeMl}ml`;

export type ProductVariant = {
  id: string;
  productId: string;
  sizeMl: ProductSizeMl;
  sizeLabel: ProductSizeLabel;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  inspiredBy: string;
  gender: ProductGender;
  size15mlPrice: number;
  size30mlPrice: number;
  variants: ProductVariant[];
  stock: number;
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  longevity: string;
  occasion: string;
  description: string;
  image: string;
  imageUrl?: string;
  imagePath?: string;
};

export type ProductFilters = {
  search: string;
  gender: "All" | ProductGender;
  minPrice: number;
  maxPrice: number;
  occasion: "All" | string;
};
