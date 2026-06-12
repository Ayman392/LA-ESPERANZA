import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Order Confirmation | LA ESPERANZA",
  description: "View your saved LA ESPERANZA order confirmation.",
  path: "/order-confirmation",
  index: false,
});

export default function Page() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Container className="py-12 md:py-16">
        <Suspense
          fallback={
            <div className="rounded-card border border-border bg-surface-strong px-6 py-16 text-center shadow-soft">
              <p className="text-sm font-semibold uppercase text-accent">
                Loading order
              </p>
            </div>
          }
        >
          <OrderConfirmation />
        </Suspense>
      </Container>
      <Footer />
    </main>
  );
}
