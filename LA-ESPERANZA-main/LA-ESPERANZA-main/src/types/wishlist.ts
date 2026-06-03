import type { Product } from "@/types/product";

export type WishlistItem = {
  productId: string;
};

export type WishlistProduct = WishlistItem & {
  product: Product;
};
