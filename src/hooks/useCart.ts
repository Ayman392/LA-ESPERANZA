"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CART_STORAGE_KEY,
  addCartItem,
  clearCartItems,
  decreaseCartItemQuantity,
  getCartSubtotal,
  hydrateCartProducts,
  increaseCartItemQuantity,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/cart";
import { products as defaultProducts } from "@/lib/products";
import type { CartItem, CartProductSize } from "@/types/cart";
import type { Product } from "@/types/product";

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
  const [catalogProducts, setCatalogProducts] =
    useState<Product[]>(defaultProducts);
  const [isReady, setIsReady] = useState(false);

  const mergeCatalogProduct = useCallback(
    (product: Product) => {
      const hasProduct = catalogProducts.some((entry) => entry.id === product.id);

      return hasProduct
        ? catalogProducts.map((entry) =>
            entry.id === product.id ? product : entry,
          )
        : [...catalogProducts, product];
    },
    [catalogProducts],
  );

  const refreshCatalogProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products", {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        products?: Product[];
      };

      if (response.ok && payload.products?.length) {
        setCatalogProducts(payload.products);
      }
    } catch {
      setCatalogProducts((currentProducts) => currentProducts);
    }
  }, []);

  useEffect(() => {
    const syncCart = () => setItems(readCartStorage());
    const hydrationTimer = window.setTimeout(() => {
      syncCart();
      void refreshCatalogProducts();
      setIsReady(true);
    }, 0);

    window.addEventListener("storage", syncCart);
    window.addEventListener(CART_SYNC_EVENT, syncCart);
    window.addEventListener("focus", refreshCatalogProducts);

    return () => {
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("storage", syncCart);
      window.removeEventListener(CART_SYNC_EVENT, syncCart);
      window.removeEventListener("focus", refreshCatalogProducts);
    };
  }, [refreshCatalogProducts]);

  const commitItems = useCallback((nextItems: CartItem[]) => {
    setItems(nextItems);
    writeCartStorage(nextItems);
  }, []);

  const addItem = useCallback(
    (
      productId: string,
      size: CartProductSize = "15ml",
      quantity = 1,
      productOverride?: Product,
    ) => {
      commitItems(
        addCartItem(
          readCartStorage(),
          productId,
          size,
          quantity,
          productOverride ? mergeCatalogProduct(productOverride) : catalogProducts,
        ),
      );
    },
    [catalogProducts, commitItems, mergeCatalogProduct],
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
        updateCartItemQuantity(
          readCartStorage(),
          productId,
          size,
          quantity,
          catalogProducts,
        ),
      );
    },
    [catalogProducts, commitItems],
  );

  const increaseQuantity = useCallback(
    (productId: string, size: CartProductSize) => {
      commitItems(
        increaseCartItemQuantity(
          readCartStorage(),
          productId,
          size,
          catalogProducts,
        ),
      );
    },
    [catalogProducts, commitItems],
  );

  const decreaseQuantity = useCallback(
    (productId: string, size: CartProductSize) => {
      commitItems(
        decreaseCartItemQuantity(
          readCartStorage(),
          productId,
          size,
          catalogProducts,
        ),
      );
    },
    [catalogProducts, commitItems],
  );

  const clearCart = useCallback(() => {
    commitItems(clearCartItems());
  }, [commitItems]);

  const lineItems = useMemo(
    () => hydrateCartProducts(items, catalogProducts),
    [catalogProducts, items],
  );
  const subtotal = useMemo(
    () => getCartSubtotal(items, catalogProducts),
    [catalogProducts, items],
  );
  const totalItems = useMemo(
    () => lineItems.reduce((total, item) => total + item.quantity, 0),
    [lineItems],
  );

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
