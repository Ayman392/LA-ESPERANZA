import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "Admin | LA ESPERANZA",
  description: "Admin dashboard for LA ESPERANZA operations.",
};

export default function Page() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Container className="py-12 md:py-16">
        <AdminDashboard />
      </Container>
      <Footer />
    </main>
  );
}
