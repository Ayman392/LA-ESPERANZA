import type { Metadata, Viewport } from "next";
import { MarketingAnalytics } from "@/components/analytics/MarketingAnalytics";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  absoluteUrl,
  defaultSeoDescription,
  defaultSeoTitle,
  defaultSocialImage,
} from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: defaultSeoTitle,
  description: defaultSeoDescription,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "Inspired perfumes",
  keywords: [
    "perfume Bangladesh",
    "inspired perfume Bangladesh",
    "luxury fragrance Bangladesh",
    "LA ESPERANZA perfume",
    "perfume online Bangladesh",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_BD",
    url: "/",
    siteName: siteConfig.name,
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    images: [
      {
        url: defaultSocialImage,
        alt: "LA ESPERANZA luxury inspired perfume bottle",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    images: [defaultSocialImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F0F0F",
  colorScheme: "light",
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteConfig.url}#organization`,
  name: siteConfig.name,
  url: siteConfig.url,
  slogan: siteConfig.description,
  description: defaultSeoDescription,
  image: absoluteUrl(defaultSocialImage),
  address: {
    "@type": "PostalAddress",
    addressLocality: "Dhaka",
    addressCountry: "BD",
  },
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteConfig.url}#website`,
  name: siteConfig.name,
  url: siteConfig.url,
  description: defaultSeoDescription,
  publisher: {
    "@id": `${siteConfig.url}#organization`,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${absoluteUrl("/shop")}?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <JsonLd data={[organizationStructuredData, websiteStructuredData]} />
        {children}
        {/* Global consent-gated GA and Meta Pixel base code. */}
        <MarketingAnalytics />
      </body>
    </html>
  );
}
