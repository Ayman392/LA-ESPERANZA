import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ShopCatalog } from "@/components/product/shop-catalog";
import { products, productOccasions } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop | LA ESPERANZA",
  description: "Browse the Phase 2 LA ESPERANZA inspired perfume catalog.",
};

export default function ShopPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Container className="py-12 md:py-16">
        {/* Shop page remains a browsing surface only: no cart, checkout, or payment flows. */}
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase text-accent">
            Phase 2 product system
          </p>
          <h1 className="text-balance mt-4 font-serif text-5xl font-semibold leading-tight text-charcoal md:text-6xl">
            Explore the LA ESPERANZA perfume catalog.
          </h1>
          <p className="mt-5 text-base leading-8 text-muted">
            Five inspired perfumes with typed product data, fragrance notes,
            stock context, price range filtering, and clean catalog browsing.
          </p>
        </div>
        <ShopCatalog products={products} occasions={productOccasions} />
      </Container>
      <Footer />
    </main>
  );
}
