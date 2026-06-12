import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Checkout | LA ESPERANZA",
  description:
    "Complete delivery and payment details for your LA ESPERANZA fragrance order.",
  path: "/checkout",
  index: false,
});

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
