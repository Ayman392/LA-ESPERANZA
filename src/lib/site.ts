import type { NavItem } from "@/types/site";

// Central brand configuration keeps navigation and metadata aligned.
export const siteConfig = {
  name: "LA ESPERANZA",
  description: "A refined Next.js ecommerce foundation for a perfume brand.",
  url: "https://la-esperanza.example",
};

export const navItems: NavItem[] = [
  { label: "Shop", href: "/shop" },
  { label: "Foundation", href: "/#brand-foundation" },
  { label: "Structure", href: "/#structure" },
];

export const footerLinks: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Foundation", href: "/#brand-foundation" },
  { label: "Structure", href: "/#structure" },
];
