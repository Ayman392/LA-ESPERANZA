import Link from "next/link";
import {
  CreditCard,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { hasAdminSession } from "@/lib/admin-session";

const adminNavItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Orders", icon: ShoppingBag },
  { label: "Payments", icon: CreditCard },
  { label: "Customers", icon: Users },
  { label: "Inventory", icon: Package },
];

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
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface-strong/80 px-5 py-6 lg:flex lg:flex-col">
          <Link href="/admin" className="rounded-card px-3 py-2">
            <p className="font-serif text-2xl font-semibold text-charcoal">
              LA ESPERANZA
            </p>
            <p className="mt-1 text-sm font-semibold uppercase text-accent">
              Admin
            </p>
          </Link>

          <nav aria-label="Admin navigation" className="mt-8 grid gap-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href="/admin"
                  className="flex h-11 items-center gap-3 rounded-card px-3 text-sm font-semibold text-muted transition hover:bg-background hover:text-charcoal"
                >
                  <Icon aria-hidden className="h-4 w-4 text-accent" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <div>
                <p className="text-sm font-semibold uppercase text-accent">
                  LA ESPERANZA Admin
                </p>
                <p className="mt-1 text-xs text-muted">
                  Separate dashboard workspace
                </p>
              </div>
              {isLoggedIn ? <AdminLogoutButton /> : null}
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </section>
  );
}
