import type { Metadata } from "next";
import { getProductImageSrc } from "@/lib/products";
import { siteConfig } from "@/lib/site";
import type { Product } from "@/types/product";
import type { ReviewSummary } from "@/types/review";

export const defaultSeoTitle =
  "LA ESPERANZA | Timeless Scents. Endless Elegance.";

export const defaultSeoDescription =
  "Discover premium inspired fragrances crafted for presence, memory, and lasting impression. Shop LA ESPERANZA perfumes in Bangladesh.";

export const defaultSocialImage = "/hero/la-esperanza-bottle.png";

export const absoluteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return new URL(path, siteConfig.url).toString();
};

export const createPageMetadata = ({
  title,
  description,
  path,
  image = defaultSocialImage,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  index?: boolean;
}): Metadata => ({
  title,
  description,
  alternates: {
    canonical: path,
  },
  robots: {
    index,
    follow: index,
    googleBot: {
      index,
      follow: index,
      "max-image-preview": index ? "large" : "none",
      "max-snippet": index ? -1 : 0,
      "max-video-preview": index ? -1 : 0,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_BD",
    url: path,
    siteName: siteConfig.name,
    title,
    description,
    images: [{ url: image, alt: `${siteConfig.name} inspired perfumes` }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [image],
  },
});

export const createProductStructuredData = (
  product: Product,
  reviewSummary: ReviewSummary,
) => {
  const image = absoluteUrl(getProductImageSrc(product));
  const variants = product.product_variants ?? product.variants ?? [];
  const productUrl = absoluteUrl(`/products/${product.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    image: [image],
    description: product.description,
    sku: product.id,
    category: "Inspired Perfume",
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Inspired by",
        value: product.inspiredBy,
      },
      {
        "@type": "PropertyValue",
        name: "Gender",
        value: product.gender,
      },
    ],
    offers: variants.map((variant) => ({
      "@type": "Offer",
      url: productUrl,
      sku: variant.id,
      name: `${product.name} ${variant.sizeLabel}`,
      priceCurrency: "BDT",
      price: variant.price,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        variant.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    })),
    ...(reviewSummary.totalReviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewSummary.averageRating,
            reviewCount: reviewSummary.totalReviews,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
};

export const createProductBreadcrumbStructuredData = (product: Product) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: absoluteUrl("/"),
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Shop",
      item: absoluteUrl("/shop"),
    },
    {
      "@type": "ListItem",
      position: 3,
      name: product.name,
      item: absoluteUrl(`/products/${product.slug}`),
    },
  ],
});
