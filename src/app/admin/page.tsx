import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { hasAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Admin | LA ESPERANZA",
  description: "Admin dashboard for LA ESPERANZA operations.",
};

export default async function Page() {
  const isLoggedIn = await hasAdminSession();

  if (isLoggedIn) {
    redirect("/admin/dashboard");
  }

  return <AdminLogin />;
}
