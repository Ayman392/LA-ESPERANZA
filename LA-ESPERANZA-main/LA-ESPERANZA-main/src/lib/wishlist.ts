import { products } from "@/lib/products";
import type { WishlistItem, WishlistProduct } from "@/types/wishlist";

export const WISHLIST_STORAGE_KEY = "la-esperanza-wishlist";

const findProduct = (productId: string) =>
  products.find((product) => product.id === productId);

// Wishlist helpers are pure so pages, hooks, and future services can reuse them.
export const addWishlistItem = (items: WishlistItem[], productId: string) => {
  const product = findProduct(productId);

  if (!product || items.some((item) => item.productId === productId)) {
    return items;
  }

  return [...items, { productId }];
};

export const removeWishlistItem = (
  items: WishlistItem[],
  productId: string,
) => items.filter((item) => item.productId !== productId);

export const isProductWishlisted = (
  items: WishlistItem[],
  productId: string,
) => items.some((item) => item.productId === productId);

export const toggleWishlistItem = (
  items: WishlistItem[],
  productId: string,
) =>
  isProductWishlisted(items, productId)
    ? removeWishlistItem(items, productId)
    : addWishlistItem(items, productId);

export const hydrateWishlistProducts = (
  items: WishlistItem[],
): WishlistProduct[] =>
  items
    .map((item) => {
      const product = findProduct(item.productId);

      return product ? { ...item, product } : null;
    })
    .filter((item): item is WishlistProduct => Boolean(item));

export const getWishlistCount = (items: WishlistItem[]) => items.length;
