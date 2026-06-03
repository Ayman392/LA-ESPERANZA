import type { Metadata } from "next";
import { CartPage } from "@/components/cart/CartPage";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "Cart | LA ESPERANZA",
  description: "Review saved LA ESPERANZA perfume cart items.",
};

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
