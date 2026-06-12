import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { WishlistPage } from "@/components/wishlist/WishlistPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Wishlist | LA ESPERANZA",
  description: "View your saved LA ESPERANZA perfume favorites.",
  path: "/wishlist",
  index: false,
});

export default function Page() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Container className="py-12 md:py-16">
        <WishlistPage />
      </Container>
      <Footer />
    </main>
  );
}
