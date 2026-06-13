"use client";

import { useEffect, useSyncExternalStore } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  getMarketingConsent,
  getServerMarketingConsent,
  hasMarketingConfiguration,
  initializeMarketingPlatforms,
  reportMetaPixelScriptState,
  setMarketingConsent,
  subscribeToMarketingConsent,
  trackPageView,
} from "@/lib/marketing";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function MarketingScripts() {
  const pathname = usePathname();

  useEffect(() => {
    initializeMarketingPlatforms();
  }, []);

  useEffect(() => {
    trackPageView();
  }, [pathname]);

  return (
    <>
      {gaMeasurementId ? (
        <Script
          id="la-esperanza-ga4"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
            gaMeasurementId,
          )}`}
          strategy="lazyOnload"
        />
      ) : null}
      {metaPixelId ? (
        <Script
          id="la-esperanza-meta-pixel"
          src="https://connect.facebook.net/en_US/fbevents.js"
          strategy="afterInteractive"
          onLoad={() => reportMetaPixelScriptState("loaded")}
          onError={() => reportMetaPixelScriptState("error")}
        />
      ) : null}
    </>
  );
}

export function MarketingAnalytics() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(
    subscribeToMarketingConsent,
    getMarketingConsent,
    getServerMarketingConsent,
  );
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    if (!metaPixelId && !isAdminRoute) {
      console.warn(
        "[LA ESPERANZA] NEXT_PUBLIC_META_PIXEL_ID is missing. Meta Pixel tracking is disabled.",
      );
    }
  }, [isAdminRoute]);

  if (!hasMarketingConfiguration || isAdminRoute) {
    return null;
  }

  return (
    <>
      {consent === "accepted" ? <MarketingScripts /> : null}
      {consent === null ? (
        <aside
          aria-label="Analytics preferences"
          className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-2xl rounded-card border border-white/12 bg-[#151515]/96 p-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-lg text-sm leading-6 text-white/72">
              We use optional analytics to understand visits and improve your
              fragrance experience. Tracking starts only after you accept.
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setMarketingConsent("declined")}
                className="btn-secondary-luxury h-10 rounded-full border border-white/18 px-4 text-xs font-semibold text-white/78 hover:bg-white/8"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => setMarketingConsent("accepted")}
                className="btn-primary-luxury btn-campaign-gold h-10 rounded-full px-4 text-xs font-semibold"
              >
                Accept
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}
