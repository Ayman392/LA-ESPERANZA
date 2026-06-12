import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getProductImageSrc } from "@/lib/products";
import { getCatalogProducts } from "@/services/catalog-products";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCatalogProducts();
  const publicPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/shop"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/track-order"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/#art-of-inspiration"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/#contact"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
  const productPages: MetadataRoute.Sitemap = products.map((product) => {
    const lastModified = product.updatedAt ?? product.createdAt;

    return {
      url: absoluteUrl(`/products/${product.slug}`),
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
      images: [absoluteUrl(getProductImageSrc(product))],
    };
  });

  return [...publicPages, ...productPages];
}
