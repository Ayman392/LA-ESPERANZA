import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { hasAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Admin Login | LA ESPERANZA",
  description: "Secure administrator access for LA ESPERANZA.",
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await hasAdminSession()) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-charcoal">
      <AdminLogin />
    </main>
  );
}
