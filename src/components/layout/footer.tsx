import Link from "next/link";
import { Container } from "@/components/layout/container";

export function Footer() {
  return (
    <footer className="bg-charcoal py-12 text-white">
      <Container className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-serif text-3xl font-semibold">LA ESPERANZA</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/68">
            A refined perfume ecommerce foundation, prepared for future catalog,
            content, and customer experience layers.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-5 text-sm text-white/72">
          <a className="transition hover:text-white" href="#brand-foundation">
            Foundation
          </a>
          <a className="transition hover:text-white" href="#structure">
            Structure
          </a>
          <Link className="transition hover:text-white" href="/">
            Home
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
