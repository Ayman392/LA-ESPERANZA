import { redirect } from "next/navigation";

type LegacyShopProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Legacy compatibility route: product detail pages now live at /products/[slug].
export default async function LegacyShopProductPage({
  params,
}: LegacyShopProductPageProps) {
  const { slug } = await params;

  redirect(`/products/${slug}`);
}
