import type { Metadata } from "next";
import { LuxuryLandingPage } from "@/components/home/LuxuryLandingPage";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import {
  createPageMetadata,
  defaultSeoDescription,
  defaultSeoTitle,
} from "@/lib/seo";
import { getCatalogProducts } from "@/services/catalog-products";
import { getHomepageApprovedReviews } from "@/services/reviews";

export const metadata: Metadata = createPageMetadata({
  title: defaultSeoTitle,
  description: defaultSeoDescription,
  path: "/",
});

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, reviews] = await Promise.all([
    getCatalogProducts(),
    getHomepageApprovedReviews(),
  ]);

  return (
    <>
      <Navbar />
      <LuxuryLandingPage products={products} reviews={reviews} />
      <Footer />
    </>
  );
}
