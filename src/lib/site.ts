import type { NavItem } from "@/types/site";

// Central brand configuration keeps navigation and metadata aligned.
export const siteConfig = {
  name: "LA ESPERANZA",
  description: "Timeless Scents. Endless Elegance.",
  url: "https://la-esperanza.example",
};

export const navItems: NavItem[] = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/#signature-collection" },
  { label: "About", href: "/#art-of-inspiration" },
  { label: "Contact", href: "/#contact" },
];

export const footerLinks: NavItem[] = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/#signature-collection" },
  { label: "About", href: "/#art-of-inspiration" },
  { label: "Contact", href: "/#contact" },
];
