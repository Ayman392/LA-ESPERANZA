import type { Product, ProductSizeLabel, ProductVariant } from "@/types/product";

export type CartProductSize = ProductSizeLabel;

export type CartItem = {
  productId: string;
  size: CartProductSize;
  quantity: number;
};

export type CartLineItem = CartItem & {
  product: Product;
  variant: ProductVariant;
  variantId: string;
  unitPrice: number;
  lineTotal: number;
};

export type CartTotals = {
  subtotal: number;
  totalItems: number;
};
