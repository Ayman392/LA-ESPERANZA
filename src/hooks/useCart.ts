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
import type { CartItem, CartProductSize } from "@/types/cart";
import type { Product } from "@/types/product";

const CART_SYNC_EVENT = "la-esperanza-cart-sync";

const isCartSize = (size: unknown): size is CartProductSize =>
  size === "15ml" || size === "30ml";

const getSizeMl = (size: CartProductSize) => (size === "30ml" ? 30 : 15);

const normalizeStoredCart = (value: unknown): CartItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalizedItems: CartItem[] = [];

  value.forEach((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("productId" in item) ||
      !("size" in item) ||
      !("quantity" in item)
    ) {
      return;
    }

    const productId = item.productId;
    const variantId = "variantId" in item ? item.variantId : undefined;
    const size = item.size;
    const sizeMl = "sizeMl" in item ? item.sizeMl : undefined;
    const unitPrice = "unitPrice" in item ? item.unitPrice : undefined;
    const stockQuantity =
      "stockQuantity" in item ? item.stockQuantity : undefined;
    const quantity = item.quantity;

    if (
      typeof productId !== "string" ||
      (variantId !== undefined && typeof variantId !== "string") ||
      !isCartSize(size) ||
      (sizeMl !== undefined && sizeMl !== 15 && sizeMl !== 30) ||
      (unitPrice !== undefined && typeof unitPrice !== "number") ||
      (stockQuantity !== undefined && typeof stockQuantity !== "number") ||
      typeof quantity !== "number"
    ) {
      return;
    }

    normalizedItems.push({
      productId,
      variantId,
      size,
      sizeMl: sizeMl ?? getSizeMl(size),
      unitPrice,
      stockQuantity,
      quantity,
    });
  });

  return normalizedItems;
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
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
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

      if (response.ok && Array.isArray(payload.products)) {
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
      variantId?: string,
    ) => {
      commitItems(
        addCartItem(
          readCartStorage(),
          productId,
          size,
          quantity,
          productOverride ? mergeCatalogProduct(productOverride) : catalogProducts,
          variantId,
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
