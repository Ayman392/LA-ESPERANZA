"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/layout/container";
import { NavStoreBadges } from "@/components/layout/nav-store-badges";
import { navItems, siteConfig } from "@/lib/site";

const textNavigation = navItems.filter((item) =>
  ["Collection", "About", "Contact"].includes(item.label),
);

// The homepage header begins as hero glass and settles into a dark campaign bar.
export function Navbar() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 32);

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  const isHeroState = isHomepage && !isScrolled;

  return (
    <header
      className={[
        "top-0 z-50 w-full text-white transition-[background-color,border-color,box-shadow] duration-500",
        isHomepage ? "fixed" : "sticky",
        isHeroState
          ? "border-b border-white/10 bg-transparent backdrop-blur-md"
          : "border-b border-white/10 bg-[#0F0F0F]/94 shadow-[0_16px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl",
      ].join(" ")}
    >
      <Container className="grid h-20 grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <Link
          href="/"
          className="justify-self-start whitespace-nowrap font-[var(--font-campaign-serif)] text-xl font-semibold tracking-[0.04em] text-white transition duration-300 hover:text-[#E1C78F] sm:text-2xl"
        >
          {siteConfig.name}
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-9 lg:flex"
        >
          {textNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link-luxury text-xs font-semibold uppercase tracking-[0.2em] text-white/72 hover:text-[#E1C78F]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-self-end gap-1.5 sm:gap-2">
          <NavStoreBadges />
        </div>
      </Container>
    </header>
  );
}
