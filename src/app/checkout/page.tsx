import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "Checkout | LA ESPERANZA",
  description: "Place a local LA ESPERANZA perfume order.",
};

export default function Page() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Container className="py-12 md:py-16">
        <CheckoutForm />
      </Container>
      <Footer />
    </main>
  );
}
