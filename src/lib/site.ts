import type { NavItem } from "@/types/site";

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
  "https://laesperanza.com.bd";

// Central brand configuration keeps navigation and metadata aligned.
export const siteConfig = {
  name: "LA ESPERANZA",
  description: "Timeless Scents. Endless Elegance.",
  url: configuredSiteUrl,
};

export const navItems: NavItem[] = [
  { label: "Shop", href: "/shop" },
  { label: "Collection", href: "/#signature-collection" },
  { label: "About", href: "/#art-of-inspiration" },
  { label: "Contact", href: "/#contact" },
  { label: "Track Order", href: "/track-order" },
];

export const footerLinks: NavItem[] = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/#signature-collection" },
  { label: "About", href: "/#art-of-inspiration" },
  { label: "Contact", href: "/#contact" },
];
