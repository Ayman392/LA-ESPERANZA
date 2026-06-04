"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  CreditCard,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { clsx } from "clsx";

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: AlertTriangle },
];

export function AdminSidebarNav({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const isDesktop = variant === "desktop";

  return (
    <nav
      aria-label="Admin navigation"
      className={clsx(
        isDesktop ? "mt-8 grid gap-1.5" : "flex gap-2 overflow-x-auto py-3",
      )}
    >
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "flex h-11 items-center gap-3 rounded-card text-sm font-semibold transition",
              isDesktop ? "px-3" : "shrink-0 border px-4",
              isActive
                ? "bg-charcoal text-white shadow-soft"
                : "border-border text-muted hover:bg-background hover:text-charcoal",
            )}
          >
            <Icon
              aria-hidden
              className={clsx(
                "h-4 w-4 shrink-0",
                isActive ? "text-white" : "text-accent",
              )}
            />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
