import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { hasAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Admin | LA ESPERANZA",
  description: "Admin dashboard for LA ESPERANZA operations.",
};

export default async function Page() {
  const isLoggedIn = await hasAdminSession();

  return (
    <main className="min-h-screen">
      <Navbar />
      <Container className="py-12 md:py-16">
        {isLoggedIn ? <AdminDashboard /> : <AdminLogin />}
      </Container>
      <Footer />
    </main>
  );
}
