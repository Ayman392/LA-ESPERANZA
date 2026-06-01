import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { navItems, siteConfig } from "@/lib/site";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/82 backdrop-blur-xl">
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-semibold text-charcoal">
          {siteConfig.name}
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted transition hover:text-charcoal"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Button href="#structure" size="sm" variant="secondary">
          Project Base
        </Button>
      </Container>
    </header>
  );
}
