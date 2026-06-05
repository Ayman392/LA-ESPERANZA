import type {
  Product,
  ProductSizeLabel,
  ProductSizeMl,
  ProductVariant,
} from "@/types/product";

export type CartProductSize = ProductSizeLabel;

export type CartItem = {
  productId: string;
  variantId?: string;
  size: CartProductSize;
  sizeMl?: ProductSizeMl;
  unitPrice?: number;
  stockQuantity?: number;
  quantity: number;
};

export type CartLineItem = CartItem & {
  product: Product;
  variant: ProductVariant;
  variantId: string;
  sizeMl: ProductSizeMl;
  unitPrice: number;
  lineTotal: number;
};

export type CartTotals = {
  subtotal: number;
  totalItems: number;
};
