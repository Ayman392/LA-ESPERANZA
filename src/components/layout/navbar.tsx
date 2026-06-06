"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/layout/container";
import { NavStoreBadges } from "@/components/layout/nav-store-badges";
import { navItems, siteConfig } from "@/lib/site";

const textNavigation = navItems.filter(
  (item) => item.label === "About" || item.label === "Contact",
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
          ? "border-b border-white/10 bg-[#0F0F0F]/14 backdrop-blur-md"
          : "border-b border-white/10 bg-[#0F0F0F]/94 shadow-[0_16px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl",
      ].join(" ")}
    >
      <Container className="flex h-20 items-center justify-between gap-3">
        <Link
          href="/"
          className="whitespace-nowrap font-[var(--font-campaign-serif)] text-xl font-semibold tracking-[0.04em] text-white transition hover:text-[#E1C78F] sm:text-2xl"
        >
          {siteConfig.name}
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 lg:flex"
        >
          {textNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-white/68 transition hover:text-[#E1C78F]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/#signature-collection"
            className="hidden h-11 items-center justify-center rounded-full border border-white/18 bg-white/8 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md transition hover:border-[#C9A96A]/70 hover:bg-white/13 md:inline-flex"
          >
            Collection
          </Link>
          <Link
            href="/shop"
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#C9A96A] px-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#111111] shadow-[0_10px_30px_rgba(201,169,106,0.2)] transition hover:bg-[#D9BD82] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8D4A8] sm:h-11 sm:px-5"
          >
            Shop
          </Link>
          <NavStoreBadges />
        </div>
      </Container>
    </header>
  );
}
