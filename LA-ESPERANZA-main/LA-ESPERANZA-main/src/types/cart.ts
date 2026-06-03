import type { Product } from "@/types/product";

export type CartProductSize = "15ml" | "30ml";

export type CartItem = {
  productId: string;
  size: CartProductSize;
  quantity: number;
};

export type CartLineItem = CartItem & {
  product: Product;
  unitPrice: number;
  lineTotal: number;
};

export type CartTotals = {
  subtotal: number;
  totalItems: number;
};
