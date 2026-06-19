"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getMarketingConsent,
  getServerMarketingConsent,
  hasConfiguredMetaPixelId,
  hasMarketingConfiguration,
  initializeMarketingPlatforms,
  META_PIXEL_ID,
  reportMetaPixelScriptState,
  setMarketingConsent,
  subscribeToMarketingConsent,
  trackPageView,
} from "@/lib/marketing";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const metaPixelBaseCode = `
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', ${JSON.stringify(META_PIXEL_ID)});
  console.log('Meta Pixel initialized');
  window.__laEsperanzaMetaPageViews = window.__laEsperanzaMetaPageViews || [];
  if (typeof window !== "undefined" && window.fbq) {
    var page = window.location.pathname + window.location.search;
    window.fbq("track", "PageView");
    if (window.__laEsperanzaMetaPageViews.indexOf(page) === -1) {
      window.__laEsperanzaMetaPageViews.push(page);
    }
    console.log('Meta PageView sent');
  }
`;

function MarketingScripts() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialPage = useRef(true);
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    initializeMarketingPlatforms();
  }, []);

  useEffect(() => {
    if (isInitialPage.current) {
      isInitialPage.current = false;
      return;
    }

    trackPageView();
  }, [routeKey]);

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
      <Script
        id="la-esperanza-meta-pixel-base"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: metaPixelBaseCode }}
        onReady={() => reportMetaPixelScriptState("loaded")}
        onError={() => reportMetaPixelScriptState("error")}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${encodeURIComponent(
            META_PIXEL_ID,
          )}&ev=PageView&noscript=1`}
        />
      </noscript>
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
    if (
      process.env.NODE_ENV === "development" &&
      !hasConfiguredMetaPixelId &&
      !isAdminRoute
    ) {
      console.warn(
        `[LA ESPERANZA] NEXT_PUBLIC_META_PIXEL_ID is missing. Using fallback Pixel ID ${META_PIXEL_ID}.`,
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
