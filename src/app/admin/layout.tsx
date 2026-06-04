import { hasAdminSession } from "@/lib/admin-session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isLoggedIn = await hasAdminSession();

  if (!isLoggedIn) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-charcoal">
        {children}
      </section>
    );
  }

  return children;
}
