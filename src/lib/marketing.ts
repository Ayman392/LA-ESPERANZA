"use client";

import type { CartLineItem } from "@/types/cart";
import type { SavedOrder } from "@/types/order";
import type { Product, ProductVariant } from "@/types/product";

export const MARKETING_CONSENT_KEY = "la-esperanza-marketing-consent";
export const MARKETING_CONSENT_EVENT = "la-esperanza-marketing-consent-change";

export type MarketingConsent = "accepted" | "declined";

type Gtag = (...args: unknown[]) => void;

type MetaPixel = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  getState?: () => {
    pixels?: Array<{
      id: string;
      eventCount?: number;
    }>;
  };
  push: MetaPixel;
  queue: unknown[][];
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: Gtag;
    fbq?: MetaPixel;
    _fbq?: MetaPixel;
    __laEsperanzaMetaPageViews?: string[];
  }
}

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const configuredMetaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
export const META_PIXEL_ID =
  configuredMetaPixelId || "1702835577585306";
export const hasConfiguredMetaPixelId = Boolean(configuredMetaPixelId);
let inMemoryConsent: MarketingConsent | null = null;
let lastTrackedPage: string | null = null;

export const hasMarketingConfiguration = Boolean(
  gaMeasurementId || META_PIXEL_ID,
);

export const getMarketingConsent = (): MarketingConsent | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(MARKETING_CONSENT_KEY);

    return value === "accepted" || value === "declined"
      ? value
      : inMemoryConsent;
  } catch {
    return inMemoryConsent;
  }
};

export const setMarketingConsent = (consent: MarketingConsent) => {
  inMemoryConsent = consent;

  try {
    window.localStorage.setItem(MARKETING_CONSENT_KEY, consent);
  } catch {
    // Consent still applies for this page session when storage is unavailable.
  }

  window.dispatchEvent(
    new CustomEvent<MarketingConsent>(MARKETING_CONSENT_EVENT, {
      detail: consent,
    }),
  );

  console.log("[LA ESPERANZA] Consent Status:", consent);
};

export const subscribeToMarketingConsent = (onStoreChange: () => void) => {
  window.addEventListener(MARKETING_CONSENT_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(MARKETING_CONSENT_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
};

export const getServerMarketingConsent = (): MarketingConsent | null => null;

export const ensureGoogleAnalyticsQueue = () => {
  window.dataLayer ??= [];
  window.gtag ??= (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
};

export const ensureMetaPixelQueue = () => {
  if (window.fbq) {
    return;
  }

  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
      return;
    }

    fbq.queue.push(args);
  }) as MetaPixel;

  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;
};

const canTrack = () => getMarketingConsent() === "accepted";

const getCurrentPagePath = () =>
  `${window.location.pathname}${window.location.search}`;

const hasTrackedMetaPageView = (page: string) =>
  window.__laEsperanzaMetaPageViews?.includes(page) ?? false;

const rememberMetaPageView = (page: string) => {
  window.__laEsperanzaMetaPageViews ??= [];

  if (!window.__laEsperanzaMetaPageViews.includes(page)) {
    window.__laEsperanzaMetaPageViews.push(page);
  }
};

const sendGoogleEvent = (
  eventName: string,
  parameters: Record<string, unknown>,
) => {
  if (!gaMeasurementId || !canTrack()) {
    return;
  }

  ensureGoogleAnalyticsQueue();
  window.gtag?.("event", eventName, parameters);
};

const sendMetaEvent = (
  eventName: string,
  parameters: Record<string, unknown>,
) => {
  if (
    typeof window === "undefined" ||
    !META_PIXEL_ID ||
    !canTrack() ||
    !window.fbq
  ) {
    return false;
  }

  window.fbq("track", eventName, parameters);

  return true;
};

const toAnalyticsItem = (
  product: Product,
  variant: ProductVariant,
  quantity = 1,
) => ({
  item_id: variant.id,
  item_name: product.name,
  item_brand: "LA ESPERANZA",
  item_category: "Inspired Perfume",
  item_variant: variant.sizeLabel,
  price: variant.price,
  quantity,
});

export const initializeMarketingPlatforms = () => {
  const consent = getMarketingConsent();

  console.log("[LA ESPERANZA] Pixel ID:", META_PIXEL_ID);
  console.log("[LA ESPERANZA] Consent Status:", consent);

  if (consent !== "accepted") {
    console.log("[LA ESPERANZA] Pixel Initialized:", false);
    return;
  }

  if (gaMeasurementId) {
    ensureGoogleAnalyticsQueue();
    window.gtag?.("js", new Date());
    window.gtag?.("config", gaMeasurementId, {
      send_page_view: false,
      anonymize_ip: true,
    });
  }

  console.log("[LA ESPERANZA] Pixel Initialized:", isMetaPixelInitialized());
  console.log("Meta Pixel initialized");
};

export const trackPageView = () => {
  if (typeof window === "undefined" || !canTrack()) {
    return;
  }

  const page = getCurrentPagePath();

  if (lastTrackedPage === page || hasTrackedMetaPageView(page)) {
    return;
  }

  sendGoogleEvent("page_view", {
    page_title: document.title,
    page_location: window.location.href,
    page_path: page,
  });

  if (sendMetaEvent("PageView", {})) {
    lastTrackedPage = page;
    rememberMetaPageView(page);
    console.log("[LA ESPERANZA] PageView fired:", page);
    console.log("Meta PageView sent");
  }
};

export const reportMetaPixelScriptState = (
  status: "loaded" | "error",
) => {
  const initialized = isMetaPixelInitialized();

  console.log("[LA ESPERANZA] Pixel Initialized:", initialized);
  console.log("[LA ESPERANZA] fbq state:", {
    status,
    available: typeof window.fbq === "function",
    initialized,
    queueLength: window.fbq?.queue?.length ?? 0,
  });
};

const isMetaPixelInitialized = () => {
  const pixels = window.fbq?.getState?.().pixels ?? [];

  if (pixels.some((pixel) => pixel.id === META_PIXEL_ID)) {
    return true;
  }

  return window.fbq?.queue?.some(
    (entry) => entry[0] === "init" && entry[1] === META_PIXEL_ID,
  ) ?? false;
};

export const trackProductView = (
  product: Product,
  variant: ProductVariant | undefined,
) => {
  if (!variant) {
    return;
  }

  const item = toAnalyticsItem(product, variant);
  const parameters = {
    currency: "BDT",
    value: variant.price,
    items: [item],
  };

  sendGoogleEvent("view_item", parameters);
  sendGoogleEvent("product_view", parameters);
  sendMetaEvent("ViewContent", {
    content_ids: [variant.id],
    content_name: product.name,
    content_type: "product",
    content_category: "Inspired Perfume",
    currency: "BDT",
    value: variant.price,
  });
};

export const trackAddToCart = (
  product: Product,
  variant: ProductVariant,
  quantity: number,
) => {
  const item = toAnalyticsItem(product, variant, quantity);

  sendGoogleEvent("add_to_cart", {
    currency: "BDT",
    value: variant.price * quantity,
    items: [item],
  });
  sendMetaEvent("AddToCart", {
    content_ids: [variant.id],
    content_name: product.name,
    content_type: "product",
    currency: "BDT",
    value: variant.price * quantity,
    num_items: quantity,
  });
};

export const trackBeginCheckout = (
  lineItems: CartLineItem[],
  subtotal: number,
) => {
  const analyticsItems = lineItems.map((item) =>
    toAnalyticsItem(item.product, item.variant, item.quantity),
  );
  const totalItems = lineItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  sendGoogleEvent("begin_checkout", {
    currency: "BDT",
    value: subtotal,
    items: analyticsItems,
  });
  sendMetaEvent("InitiateCheckout", {
    content_ids: lineItems.map((item) => item.variantId),
    content_type: "product",
    currency: "BDT",
    value: subtotal,
    num_items: totalItems,
  });
};

export const trackPurchase = (order: SavedOrder) => {
  const items = order.items.map((item) => ({
    item_id: item.productVariantId ?? item.productId,
    item_name: item.name,
    item_brand: "LA ESPERANZA",
    item_category: "Inspired Perfume",
    item_variant: item.size,
    price: item.unitPrice,
    quantity: item.quantity,
  }));
  const parameters = {
    transaction_id: order.orderNumber,
    currency: "BDT",
    value: order.totals.grandTotal,
    shipping: order.totals.deliveryCharge,
    items,
  };

  sendGoogleEvent("purchase", parameters);
  sendGoogleEvent("order_created", {
    order_number: order.orderNumber,
    payment_method: order.payment.method,
    value: order.totals.grandTotal,
    currency: "BDT",
  });
  sendMetaEvent("Purchase", {
    content_ids: order.items.map(
      (item) => item.productVariantId ?? item.productId,
    ),
    content_type: "product",
    currency: "BDT",
    value: order.totals.grandTotal,
    num_items: order.items.reduce(
      (total, item) => total + item.quantity,
      0,
    ),
  });
};
