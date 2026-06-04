import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { hasAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Admin | LA ESPERANZA",
  description: "Admin dashboard for LA ESPERANZA operations.",
};

export default async function Page() {
  const isLoggedIn = await hasAdminSession();

  return isLoggedIn ? <AdminDashboard /> : <AdminLogin />;
}
