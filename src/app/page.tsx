import type { Metadata } from "next";
import { LuxuryLandingPage } from "@/components/home/LuxuryLandingPage";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getCatalogProducts } from "@/services/catalog-products";

export const metadata: Metadata = {
  title: "LA ESPERANZA | Timeless Scents. Endless Elegance.",
  description:
    "Inspired fragrances crafted to leave a lasting impression.",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getCatalogProducts();

  return (
    <>
      <Navbar />
      <LuxuryLandingPage products={products} />
      <Footer />
    </>
  );
}
