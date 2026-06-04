import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { hasAdminSession } from "@/lib/admin-session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isLoggedIn = await hasAdminSession();

  return (
    <section className="min-h-screen bg-background text-charcoal">
      <div className="flex min-h-screen">
        {/* Admin routes use their own shell so public ecommerce chrome never appears here. */}
        <aside className="hidden w-[220px] shrink-0 border-r border-border bg-surface-strong/80 px-4 py-5 lg:flex lg:flex-col">
          <Link href="/admin#overview" className="block rounded-card px-3 py-2">
            <p className="whitespace-nowrap font-serif text-[21px] font-semibold leading-tight text-charcoal">
              LA ESPERANZA
            </p>
            <p className="mt-1 text-xs font-semibold uppercase text-accent">
              ADMIN
            </p>
          </Link>

          {isLoggedIn ? <AdminSidebarNav /> : null}
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
              {isLoggedIn ? <AdminLogoutButton /> : null}
            </div>
            {isLoggedIn ? (
              <div className="border-t border-border px-4 sm:px-6 lg:hidden">
                <AdminSidebarNav variant="mobile" />
              </div>
            ) : null}
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-7">{children}</main>
        </div>
      </div>
    </section>
  );
}
