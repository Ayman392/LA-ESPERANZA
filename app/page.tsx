import { ArrowRight, FlaskConical, Leaf, Sparkles } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/shared/section-heading";
import flameBottle from "../product pic/flame.png";

// Brand pillars define the homepage skeleton without introducing product data or commerce logic.
const brandPillars = [
  {
    title: "Soft Presence",
    description: "A calm visual system for fragrance storytelling, editorial content, and future commerce flows.",
    icon: Sparkles,
  },
  {
    title: "Carefully Layered",
    description: "Reusable layout primitives keep the interface composed as the catalog and brand world grow.",
    icon: FlaskConical,
  },
  {
    title: "Quietly Refined",
    description: "Warm accent tones and rounded surfaces pair with a soft grey foundation.",
    icon: Leaf,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <Navbar />

      {/* Hero: brand positioning and visual tone for the future storefront. */}
      <section className="relative">
        <Container className="grid min-h-[calc(100vh-5rem)] items-center gap-12 py-16 md:grid-cols-[1.03fr_0.97fr] md:py-20 lg:py-24">
          <FadeIn className="max-w-2xl">
            <p className="mb-5 text-sm font-semibold uppercase text-accent">
              LA ESPERANZA
            </p>
            <h1 className="text-balance font-serif text-5xl font-semibold leading-[0.95] text-charcoal sm:text-6xl lg:text-7xl">
              Perfume with a soft sense of arrival.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted sm:text-lg">
              A clean ecommerce foundation for a fragrance brand built around
              elegance, restraint, and emotional detail.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="#brand-foundation">
                Explore Foundation
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button href="#structure" variant="secondary">
                View Structure
              </Button>
            </div>
          </FadeIn>

          <FadeIn
            className="relative mx-auto aspect-[4/5] w-full max-w-[30rem] overflow-hidden rounded-card border border-border bg-surface-strong p-3 shadow-soft"
            delay={0.08}
          >
            <div className="relative h-full overflow-hidden rounded-card bg-[#171715]">
              <Image
                src={flameBottle}
                alt="LA ESPERANZA perfume bottle used as a brand visual"
                fill
                priority
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* Foundation: reusable cards for non-commerce brand and UI principles. */}
      <section id="brand-foundation" className="py-16 md:py-24">
        <Container>
          <FadeIn>
            <SectionHeading
              eyebrow="Brand foundation"
              title="A composed base for the store to come."
              description="These starter sections define the visual rhythm, messaging space, and reusable building blocks before ecommerce features are added."
            />
          </FadeIn>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {brandPillars.map((pillar, index) => (
              <FadeIn key={pillar.title} delay={index * 0.06}>
                <Card className="h-full p-6">
                  <div className="flex size-11 items-center justify-center rounded-full bg-[#efebe4] text-accent">
                    <pillar.icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-charcoal">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{pillar.description}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </Container>
      </section>

      {/* Architecture: visible checklist of project layers prepared for future work. */}
      <section id="structure" className="border-y border-border/70 bg-surface/70 py-16 md:py-24">
        <Container className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:items-start">
          <FadeIn>
            <SectionHeading
              eyebrow="Architecture"
              title="Ready for product, cart, and content layers later."
              description="The current build stops at the foundation: app shell, layout, UI primitives, theme tokens, and a homepage skeleton."
            />
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "App Router",
              "TypeScript",
              "Tailwind CSS",
              "Reusable UI",
              "Responsive Layout",
              "Soft Grey Theme",
              "Hooks",
              "Services",
              "Types",
              "Supabase",
            ].map((item, index) => (
              <FadeIn key={item} delay={index * 0.035}>
                <Card className="min-h-28 p-5">
                  <p className="text-sm font-semibold uppercase text-accent">
                    {item}
                  </p>
                  <div className="mt-6 h-2 rounded-full bg-[#e4e1d9]" />
                  <div className="mt-3 h-2 w-2/3 rounded-full bg-[#d7d3c8]" />
                </Card>
              </FadeIn>
            ))}
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
