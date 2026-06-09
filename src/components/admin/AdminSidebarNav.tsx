"use client";

import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  MessageSquareText,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { clsx } from "clsx";
import type { AdminSection } from "@/types/admin";

const adminNavItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "customers", label: "Customers", icon: Users },
  { id: "products", label: "Products", icon: Package },
  { id: "inventory", label: "Inventory", icon: AlertTriangle },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "reviews", label: "Reviews", icon: MessageSquareText },
] satisfies Array<{
  id: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
}>;

type AdminSidebarNavProps = {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  variant?: "desktop" | "mobile";
};

export function AdminSidebarNav({
  activeSection,
  onSectionChange,
  variant = "desktop",
}: AdminSidebarNavProps) {
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
        const isActive = activeSection === item.id;

        return (
          <button
            key={item.id}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onSectionChange(item.id)}
            className={clsx(
              "flex h-11 items-center gap-3 rounded-card text-left text-sm font-semibold transition",
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
          </button>
        );
      })}
    </nav>
  );
}
