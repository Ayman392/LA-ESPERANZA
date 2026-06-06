import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminWorkspace } from "@/components/admin/AdminDashboard";
import { hasAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Admin | LA ESPERANZA",
  description: "Admin dashboard for LA ESPERANZA operations.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const isLoggedIn = await hasAdminSession();

  if (!isLoggedIn) {
    redirect("/admin/login");
  }

  return <AdminWorkspace />;
}
