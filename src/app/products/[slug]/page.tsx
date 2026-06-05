import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ProductActions } from "@/components/product/ProductActions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getProductBySlug,
  getProductImageSrc,
  getProductTotalStock,
  products,
} from "@/lib/products";
import { getCatalogProductBySlug } from "@/services/catalog-products";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found | LA ESPERANZA",
    };
  }

  return {
    title: `${product.name} | LA ESPERANZA`,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const noteGroups = [
    { label: "Top notes", notes: product.topNotes },
    { label: "Middle notes", notes: product.middleNotes },
    { label: "Base notes", notes: product.baseNotes },
  ];
  const totalStock = getProductTotalStock(product);
  const imageSrc = getProductImageSrc(product);

  return (
    <main className="min-h-screen">
      <Navbar />
      <Container className="py-12 md:py-16">
        {/* Product details include cart and wishlist actions without checkout or payment flows. */}
        <Button href="/shop" variant="secondary" size="sm">
          Back to shop
        </Button>

        <section className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-card border border-border bg-surface-strong p-3 shadow-soft">
            <div className="relative h-full overflow-hidden rounded-card bg-[#171715]">
              <Image
                src={imageSrc}
                alt={`${product.name} perfume bottle`}
                fill
                priority
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase text-accent">
              {product.gender} fragrance
            </p>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight text-charcoal md:text-6xl">
              {product.name}
            </h1>
            <p className="mt-3 text-lg text-muted">
              Inspired by {product.inspiredBy}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted">
              {product.description}
            </p>
            <ProductActions product={product} variant="detail" />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Card className="p-5">
                <p className="text-xs font-semibold uppercase text-accent">
                  Longevity
                </p>
                <p className="mt-2 text-lg font-semibold text-charcoal">
                  {product.longevity}
                </p>
              </Card>
              <Card className="p-5">
                <p className="text-xs font-semibold uppercase text-accent">
                  Occasion
                </p>
                <p className="mt-2 text-lg font-semibold text-charcoal">
                  {product.occasion}
                </p>
              </Card>
              <Card className="p-5">
                <p className="text-xs font-semibold uppercase text-accent">
                  Stock
                </p>
                <p className="mt-2 text-lg font-semibold text-charcoal">
                  {totalStock} total units
                </p>
              </Card>
            </div>

            <Card className="mt-5 p-5">
              <p className="text-sm font-semibold uppercase text-accent">
                Sizes and prices
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="rounded-card border border-border bg-background p-4"
                  >
                    <p className="text-sm text-muted">{variant.sizeLabel}</p>
                    <p className="mt-1 text-2xl font-semibold text-charcoal">
                      BDT {variant.price}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase text-accent">
                      {variant.stockQuantity > 0
                        ? `${variant.stockQuantity} in stock`
                        : "Out of stock"}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {noteGroups.map((group) => (
                <Card key={group.label} className="p-5">
                  <p className="text-sm font-semibold uppercase text-accent">
                    {group.label}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-muted">
                    {group.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </Container>
      <Footer />
    </main>
  );
}
