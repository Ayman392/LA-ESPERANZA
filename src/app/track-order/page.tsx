import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { OrderTracker } from "@/components/order-tracking/OrderTracker";

export const metadata: Metadata = {
  title: "Track Order | LA ESPERANZA",
  description:
    "Track your LA ESPERANZA fragrance order using your order number and checkout phone number.",
};

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(201,169,106,0.13),transparent_68%)]"
        />
        <Container className="relative">
          <OrderTracker />
        </Container>
      </section>
      <Footer />
    </main>
  );
}
