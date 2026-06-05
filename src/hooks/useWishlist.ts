"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  WISHLIST_STORAGE_KEY,
  addWishlistItem,
  getWishlistCount,
  hydrateWishlistProducts,
  isProductWishlisted,
  removeWishlistItem,
  toggleWishlistItem,
} from "@/lib/wishlist";
import type { Product } from "@/types/product";
import type { WishlistItem } from "@/types/wishlist";

const WISHLIST_SYNC_EVENT = "la-esperanza-wishlist-sync";

const normalizeStoredWishlist = (value: unknown): WishlistItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("productId" in item) ||
        typeof item.productId !== "string"
      ) {
        return null;
      }

      return {
        productId: item.productId,
      };
    })
    .filter((item): item is WishlistItem => Boolean(item));
};

const readWishlistStorage = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return normalizeStoredWishlist(
      JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY) ?? "[]"),
    );
  } catch {
    return [];
  }
};

const writeWishlistStorage = (items: WishlistItem[]) => {
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(WISHLIST_SYNC_EVENT));
};

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [isReady, setIsReady] = useState(false);

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
    const syncWishlist = () => setItems(readWishlistStorage());
    const hydrationTimer = window.setTimeout(() => {
      syncWishlist();
      void refreshCatalogProducts();
      setIsReady(true);
    }, 0);

    window.addEventListener("storage", syncWishlist);
    window.addEventListener(WISHLIST_SYNC_EVENT, syncWishlist);
    window.addEventListener("focus", refreshCatalogProducts);

    return () => {
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("storage", syncWishlist);
      window.removeEventListener(WISHLIST_SYNC_EVENT, syncWishlist);
      window.removeEventListener("focus", refreshCatalogProducts);
    };
  }, [refreshCatalogProducts]);

  const commitItems = useCallback((nextItems: WishlistItem[]) => {
    setItems(nextItems);
    writeWishlistStorage(nextItems);
  }, []);

  const addItem = useCallback(
    (productId: string) => {
      commitItems(addWishlistItem(readWishlistStorage(), productId));
    },
    [commitItems],
  );

  const removeItem = useCallback(
    (productId: string) => {
      commitItems(removeWishlistItem(readWishlistStorage(), productId));
    },
    [commitItems],
  );

  const toggleItem = useCallback(
    (productId: string) => {
      commitItems(toggleWishlistItem(readWishlistStorage(), productId));
    },
    [commitItems],
  );

  const hasItem = useCallback(
    (productId: string) => isProductWishlisted(items, productId),
    [items],
  );

  const wishlistProducts = useMemo(
    () => hydrateWishlistProducts(items, catalogProducts),
    [catalogProducts, items],
  );
  const totalItems = useMemo(() => getWishlistCount(items), [items]);

  return {
    items,
    wishlistProducts,
    totalItems,
    isReady,
    addItem,
    removeItem,
    toggleItem,
    hasItem,
  };
}
