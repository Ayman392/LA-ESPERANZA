import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminInventoryPage } from "@/components/admin/AdminDashboard";
import { hasAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Inventory | LA ESPERANZA Admin",
};

export default async function Page() {
  if (!(await hasAdminSession())) {
    redirect("/admin");
  }

  return <AdminInventoryPage />;
}
