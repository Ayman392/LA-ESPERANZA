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
  createdAt?: string;
  updatedAt?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  inspiredBy: string;
  gender: ProductGender;
  variants: ProductVariant[];
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  longevity: string;
  occasion: string;
  description: string;
  image: string;
  imageUrl?: string;
  imagePath?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductFilters = {
  search: string;
  gender: "All" | ProductGender;
  minPrice: number;
  maxPrice: number;
  occasion: "All" | string;
};
