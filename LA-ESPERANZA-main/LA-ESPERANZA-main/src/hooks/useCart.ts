"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CART_STORAGE_KEY,
  addCartItem,
  clearCartItems,
  decreaseCartItemQuantity,
  getCartSubtotal,
  getCartTotalItems,
  hydrateCartProducts,
  increaseCartItemQuantity,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/cart";
import type { CartItem, CartProductSize } from "@/types/cart";

const CART_SYNC_EVENT = "la-esperanza-cart-sync";

const isCartSize = (size: unknown): size is CartProductSize =>
  size === "15ml" || size === "30ml";

const normalizeStoredCart = (value: unknown): CartItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("productId" in item) ||
        !("size" in item) ||
        !("quantity" in item)
      ) {
        return null;
      }

      const productId = item.productId;
      const size = item.size;
      const quantity = item.quantity;

      if (
        typeof productId !== "string" ||
        !isCartSize(size) ||
        typeof quantity !== "number"
      ) {
        return null;
      }

      return {
        productId,
        size,
        quantity,
      };
    })
    .filter((item): item is CartItem => Boolean(item));
};

const readCartStorage = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return normalizeStoredCart(
      JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]"),
    );
  } catch {
    return [];
  }
};

const writeCartStorage = (items: CartItem[]) => {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_SYNC_EVENT));
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const syncCart = () => setItems(readCartStorage());
    const hydrationTimer = window.setTimeout(() => {
      syncCart();
      setIsReady(true);
    }, 0);

    window.addEventListener("storage", syncCart);
    window.addEventListener(CART_SYNC_EVENT, syncCart);

    return () => {
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("storage", syncCart);
      window.removeEventListener(CART_SYNC_EVENT, syncCart);
    };
  }, []);

  const commitItems = useCallback((nextItems: CartItem[]) => {
    setItems(nextItems);
    writeCartStorage(nextItems);
  }, []);

  const addItem = useCallback(
    (productId: string, size: CartProductSize = "15ml", quantity = 1) => {
      commitItems(addCartItem(readCartStorage(), productId, size, quantity));
    },
    [commitItems],
  );

  const removeItem = useCallback(
    (productId: string, size: CartProductSize) => {
      commitItems(removeCartItem(readCartStorage(), productId, size));
    },
    [commitItems],
  );

  const updateQuantity = useCallback(
    (productId: string, size: CartProductSize, quantity: number) => {
      commitItems(
        updateCartItemQuantity(readCartStorage(), productId, size, quantity),
      );
    },
    [commitItems],
  );

  const increaseQuantity = useCallback(
    (productId: string, size: CartProductSize) => {
      commitItems(increaseCartItemQuantity(readCartStorage(), productId, size));
    },
    [commitItems],
  );

  const decreaseQuantity = useCallback(
    (productId: string, size: CartProductSize) => {
      commitItems(decreaseCartItemQuantity(readCartStorage(), productId, size));
    },
    [commitItems],
  );

  const clearCart = useCallback(() => {
    commitItems(clearCartItems());
  }, [commitItems]);

  const lineItems = useMemo(() => hydrateCartProducts(items), [items]);
  const subtotal = useMemo(() => getCartSubtotal(items), [items]);
  const totalItems = useMemo(() => getCartTotalItems(items), [items]);

  return {
    items,
    lineItems,
    subtotal,
    totalItems,
    isReady,
    addItem,
    removeItem,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  };
}
