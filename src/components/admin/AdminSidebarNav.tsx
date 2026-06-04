"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "customers", label: "Customers", icon: Users },
  { id: "products", label: "Products", icon: Package },
  { id: "inventory", label: "Inventory", icon: AlertTriangle },
];

const getActiveSection = () => {
  if (typeof window === "undefined") {
    return "overview";
  }

  const hash = window.location.hash.replace("#", "");

  return adminNavItems.some((item) => item.id === hash) ? hash : "overview";
};

export function AdminSidebarNav({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const [activeSection, setActiveSection] = useState(getActiveSection);
  const isDesktop = variant === "desktop";

  useEffect(() => {
    const syncActiveSection = () => setActiveSection(getActiveSection());

    syncActiveSection();
    window.addEventListener("hashchange", syncActiveSection);

    return () => window.removeEventListener("hashchange", syncActiveSection);
  }, []);

  return (
    <nav
      aria-label="Admin navigation"
      className={clsx(
        isDesktop ? "mt-8 grid gap-1.5" : "flex gap-2 overflow-x-auto py-3",
      )}
    >
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;

        return (
          <Link
            key={item.id}
            href={`/admin#${item.id}`}
            aria-current={isActive ? "page" : undefined}
            onClick={() => setActiveSection(item.id)}
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
