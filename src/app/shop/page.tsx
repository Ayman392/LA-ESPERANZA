import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ShopCatalog } from "@/components/product/shop-catalog";
import { getProductOccasions } from "@/lib/products";
import { getCatalogProducts } from "@/services/catalog-products";

export const metadata: Metadata = {
  title: "Shop | LA ESPERANZA",
  description: "Browse the LA ESPERANZA inspired perfume catalog.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const catalogProducts = await getCatalogProducts();
  const productOccasions = getProductOccasions(catalogProducts);

  return (
    <main className="min-h-screen">
      <Navbar />
      <Container className="py-12 md:py-16">
        {/* Shop page supports cart and wishlist actions while checkout remains out of scope. */}
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase text-accent">
            Perfume catalog
          </p>
          <h1 className="text-balance mt-4 font-serif text-5xl font-semibold leading-tight text-charcoal md:text-6xl">
            Explore the LA ESPERANZA perfume catalog.
          </h1>
          <p className="mt-5 text-base leading-8 text-muted">
            Six inspired perfumes with typed product data, fragrance notes,
            stock context, price range filtering, and wishlist-ready browsing.
          </p>
        </div>
        <ShopCatalog products={catalogProducts} occasions={productOccasions} />
      </Container>
      <Footer />
    </main>
  );
}
