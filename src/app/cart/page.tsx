import type { Metadata } from "next";
import { CartPage } from "@/components/cart/CartPage";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Shopping Cart | LA ESPERANZA",
  description: "Review your selected LA ESPERANZA inspired perfumes.",
  path: "/cart",
  index: false,
});

export default function Page() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Container className="py-12 md:py-16">
        <CartPage />
      </Container>
      <Footer />
    </main>
  );
}
