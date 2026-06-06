import Link from "next/link";
import { Container } from "@/components/layout/container";
import { footerLinks, siteConfig } from "@/lib/site";

const contactLinks = [
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "WhatsApp", href: "https://wa.me/" },
];

// The customer footer carries the brand campaign tone across public pages.
export function Footer() {
  return (
    <footer id="contact" className="bg-[#0F0F0F] text-white">
      <Container className="border-t border-white/10 py-14 md:py-18">
        <div className="grid gap-10 md:grid-cols-[1.25fr_0.75fr_0.75fr]">
          <div>
            <p className="font-[var(--font-campaign-serif)] text-4xl font-semibold">
              {siteConfig.name}
            </p>
            <p className="mt-4 max-w-sm text-base leading-7 text-white/68">
              Timeless Scents. Endless Elegance.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#C9A96A]">
              Explore
            </p>
            <nav
              aria-label="Footer navigation"
              className="mt-5 grid gap-3 text-sm text-white/70"
            >
              {footerLinks.map((item) => (
                <Link
                  key={item.href}
                  className="transition hover:text-white"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#C9A96A]">
              Social
            </p>
            <div className="mt-5 grid gap-3 text-sm text-white/70">
              {contactLinks.map((item) => (
                <Link
                  key={item.label}
                  className="transition hover:text-white"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-7 text-xs uppercase tracking-[0.24em] text-white/42 md:flex-row md:items-center md:justify-between">
          <p>Dhaka, Bangladesh</p>
          <p>LA ESPERANZA Fragrance House</p>
        </div>
      </Container>
    </footer>
  );
}
