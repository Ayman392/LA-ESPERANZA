import Link from "next/link";
import { AdminDashboardProvider } from "@/components/admin/AdminDashboard";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
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

  return (
    <section className="min-h-screen bg-background text-charcoal">
      <div className="flex min-h-screen">
        {/* Admin routes use their own shell so public ecommerce chrome never appears here. */}
        <aside className="hidden w-[220px] shrink-0 border-r border-border bg-surface-strong/80 px-4 py-5 lg:flex lg:flex-col">
          <Link href="/admin/dashboard" className="block rounded-card px-3 py-2">
            <p className="whitespace-nowrap font-serif text-[21px] font-semibold leading-tight text-charcoal">
              LA ESPERANZA
            </p>
            <p className="mt-1 text-xs font-semibold uppercase text-accent">
              ADMIN
            </p>
          </Link>

          <AdminSidebarNav />

          <div className="mt-auto border-t border-border pt-4">
            <AdminLogoutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-7">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase text-accent">
                  LA ESPERANZA Admin
                </p>
                <p className="mt-1 text-xs text-muted">
                  Separate dashboard workspace
                </p>
              </div>
              <div className="lg:hidden">
                <AdminLogoutButton />
              </div>
            </div>
            <div className="border-t border-border px-4 sm:px-6 lg:hidden">
              <AdminSidebarNav variant="mobile" />
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-7">
            <AdminDashboardProvider>{children}</AdminDashboardProvider>
          </main>
        </div>
      </div>
    </section>
  );
}
