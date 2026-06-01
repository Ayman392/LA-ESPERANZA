import Link from "next/link";
import { Container } from "@/components/layout/container";
import { footerLinks, siteConfig } from "@/lib/site";

// Footer keeps brand context visible while the ecommerce surface is still being planned.
export function Footer() {
  return (
    <footer className="bg-charcoal py-12 text-white">
      <Container className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-serif text-3xl font-semibold">{siteConfig.name}</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/68">
            A refined perfume ecommerce foundation, prepared for future catalog,
            content, and customer experience layers.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-5 text-sm text-white/72">
          {footerLinks.map((item) =>
            item.href.startsWith("#") ? (
              <a key={item.href} className="transition hover:text-white" href={item.href}>
                {item.label}
              </a>
            ) : (
              <Link key={item.href} className="transition hover:text-white" href={item.href}>
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </Container>
    </footer>
  );
}
