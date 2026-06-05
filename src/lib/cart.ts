import { getProductVariant, products as defaultProducts } from "@/lib/products";
import type { CartItem, CartLineItem, CartProductSize } from "@/types/cart";
import type { Product } from "@/types/product";

export const CART_STORAGE_KEY = "la-esperanza-cart";

const getCartItemKey = (item: Pick<CartItem, "productId" | "size">) =>
  `${item.productId}:${item.size}`;

const findProduct = (productId: string, catalogProducts = defaultProducts) =>
  catalogProducts.find((product) => product.id === productId);

const normalizeQuantity = (
  quantity: number,
  product?: Product,
  size?: CartProductSize,
) => {
  const safeQuantity = Number.isFinite(quantity) ? Math.trunc(quantity) : 1;
  const minimumQuantity = Math.max(1, safeQuantity);
  const variant = product && size ? getProductVariant(product, size) : undefined;

  return variant
    ? Math.min(minimumQuantity, variant.stockQuantity)
    : minimumQuantity;
};

export const getProductUnitPrice = (
  product: Product,
  size: CartProductSize,
) => getProductVariant(product, size)?.price ?? 0;

// Pure cart helpers keep persistence separate from cart math and mutations.
export const addCartItem = (
  items: CartItem[],
  productId: string,
  size: CartProductSize,
  quantity = 1,
  catalogProducts = defaultProducts,
) => {
  const product = findProduct(productId, catalogProducts);
  const variant = product ? getProductVariant(product, size) : undefined;

  if (!product || !variant || variant.stockQuantity <= 0) {
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
        quantity: normalizeQuantity(quantity, product, size),
      },
    ];
  }

  return items.map((item) =>
    getCartItemKey(item) === itemKey
      ? {
          ...item,
          quantity: normalizeQuantity(item.quantity + quantity, product, size),
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
  catalogProducts = defaultProducts,
) => {
  if (quantity <= 0) {
    return removeCartItem(items, productId, size);
  }

  const product = findProduct(productId, catalogProducts);

  return items.map((item) =>
    getCartItemKey(item) === getCartItemKey({ productId, size })
      ? { ...item, quantity: normalizeQuantity(quantity, product, size) }
      : item,
  );
};

export const increaseCartItemQuantity = (
  items: CartItem[],
  productId: string,
  size: CartProductSize,
  catalogProducts = defaultProducts,
) => {
  const item = items.find(
    (cartItem) => getCartItemKey(cartItem) === getCartItemKey({ productId, size }),
  );

  return updateCartItemQuantity(
    items,
    productId,
    size,
    (item?.quantity ?? 0) + 1,
    catalogProducts,
  );
};

export const decreaseCartItemQuantity = (
  items: CartItem[],
  productId: string,
  size: CartProductSize,
  catalogProducts = defaultProducts,
) => {
  const item = items.find(
    (cartItem) => getCartItemKey(cartItem) === getCartItemKey({ productId, size }),
  );

  return updateCartItemQuantity(
    items,
    productId,
    size,
    (item?.quantity ?? 1) - 1,
    catalogProducts,
  );
};

export const hydrateCartProducts = (
  items: CartItem[],
  catalogProducts = defaultProducts,
): CartLineItem[] =>
  items
    .map((item) => {
      const product = findProduct(item.productId, catalogProducts);

      if (!product) {
        return null;
      }

      const variant = getProductVariant(product, item.size);

      if (!variant || variant.stockQuantity <= 0) {
        return null;
      }

      const quantity = normalizeQuantity(item.quantity, product, item.size);
      const unitPrice = variant.price;

      return {
        ...item,
        quantity,
        product,
        variant,
        variantId: variant.id,
        unitPrice,
        lineTotal: unitPrice * quantity,
      };
    })
    .filter((item): item is CartLineItem => Boolean(item));

export const getCartTotalItems = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.quantity, 0);

export const getCartSubtotal = (
  items: CartItem[],
  catalogProducts = defaultProducts,
) =>
  hydrateCartProducts(items, catalogProducts).reduce(
    (total, item) => total + item.lineTotal,
    0,
  );

export const clearCartItems = (): CartItem[] => [];
