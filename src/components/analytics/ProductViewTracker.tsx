"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getProductVariants, sortProductVariants } from "@/lib/products";
import {
  getMarketingConsent,
  getServerMarketingConsent,
  subscribeToMarketingConsent,
  trackProductView,
} from "@/lib/marketing";
import type { Product } from "@/types/product";

export function ProductViewTracker({ product }: { product: Product }) {
  const consent = useSyncExternalStore(
    subscribeToMarketingConsent,
    getMarketingConsent,
    getServerMarketingConsent,
  );

  useEffect(() => {
    if (consent !== "accepted") {
      return;
    }

    const variants = sortProductVariants(getProductVariants(product));
    const trackedVariant =
      variants.find((variant) => variant.stockQuantity > 0) ?? variants[0];

    trackProductView(product, trackedVariant);
  }, [consent, product]);

  return null;
}
