import { products } from "@/lib/products";
import type { CartItem, CartLineItem, CartProductSize } from "@/types/cart";
import type { Product } from "@/types/product";

export const CART_STORAGE_KEY = "la-esperanza-cart";

const getCartItemKey = (item: Pick<CartItem, "productId" | "size">) =>
  `${item.productId}:${item.size}`;

const findProduct = (productId: string) =>
  products.find((product) => product.id === productId);

const normalizeQuantity = (quantity: number, product?: Product) => {
  const safeQuantity = Number.isFinite(quantity) ? Math.trunc(quantity) : 1;
  const minimumQuantity = Math.max(1, safeQuantity);

  return product ? Math.min(minimumQuantity, product.stock) : minimumQuantity;
};

export const getProductUnitPrice = (
  product: Product,
  size: CartProductSize,
) => (size === "15ml" ? product.size15mlPrice : product.size30mlPrice);

// Pure cart helpers keep persistence separate from cart math and mutations.
export const addCartItem = (
  items: CartItem[],
  productId: string,
  size: CartProductSize,
  quantity = 1,
) => {
  const product = findProduct(productId);

  if (!product || product.stock <= 0) {
    return items;
  }

  const itemKey = getCartItemKey({ productId, size });
  const existingItem = items.find((item) => getCartItemKey(item) === itemKey);

  if (!existingItem) {
    return [
      ...items,
      {
        productId,
        size,
        quantity: normalizeQuantity(quantity, product),
      },
    ];
  }

  return items.map((item) =>
    getCartItemKey(item) === itemKey
      ? {
          ...item,
          quantity: normalizeQuantity(item.quantity + quantity, product),
        }
      : item,
  );
};

export const removeCartItem = (
  items: CartItem[],
  productId: string,
  size: CartProductSize,
) =>
  items.filter((item) => getCartItemKey(item) !== getCartItemKey({ productId, size }));

export const updateCartItemQuantity = (
  items: CartItem[],
  productId: string,
  size: CartProductSize,
  quantity: number,
) => {
  if (quantity <= 0) {
    return removeCartItem(items, productId, size);
  }

  const product = findProduct(productId);

  return items.map((item) =>
    getCartItemKey(item) === getCartItemKey({ productId, size })
      ? { ...item, quantity: normalizeQuantity(quantity, product) }
      : item,
  );
};

export const increaseCartItemQuantity = (
  items: CartItem[],
  productId: string,
  size: CartProductSize,
) => {
  const item = items.find(
    (cartItem) => getCartItemKey(cartItem) === getCartItemKey({ productId, size }),
  );

  return updateCartItemQuantity(
    items,
    productId,
    size,
    (item?.quantity ?? 0) + 1,
  );
};

export const decreaseCartItemQuantity = (
  items: CartItem[],
  productId: string,
  size: CartProductSize,
) => {
  const item = items.find(
    (cartItem) => getCartItemKey(cartItem) === getCartItemKey({ productId, size }),
  );

  return updateCartItemQuantity(
    items,
    productId,
    size,
    (item?.quantity ?? 1) - 1,
  );
};

export const hydrateCartProducts = (items: CartItem[]): CartLineItem[] =>
  items
    .map((item) => {
      const product = findProduct(item.productId);

      if (!product) {
        return null;
      }

      const quantity = normalizeQuantity(item.quantity, product);
      const unitPrice = getProductUnitPrice(product, item.size);

      return {
        ...item,
        quantity,
        product,
        unitPrice,
        lineTotal: unitPrice * quantity,
      };
    })
    .filter((item): item is CartLineItem => Boolean(item));

export const getCartTotalItems = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.quantity, 0);

export const getCartSubtotal = (items: CartItem[]) =>
  hydrateCartProducts(items).reduce((total, item) => total + item.lineTotal, 0);

export const clearCartItems = (): CartItem[] => [];
