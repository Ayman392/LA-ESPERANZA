import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminProductManagement } from "@/components/admin/AdminDashboard";
import { hasAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Products | LA ESPERANZA Admin",
};

export default async function Page() {
  if (!(await hasAdminSession())) {
    redirect("/admin");
  }

  return <AdminProductManagement />;
}
