import { ArrowRight, FlaskConical, Leaf, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { SectionHeading } from "@/components/shared/section-heading";

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

      <section className="relative">
        <Container className="grid min-h-[calc(100vh-5rem)] items-center gap-12 py-16 md:grid-cols-[1.03fr_0.97fr] md:py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-accent">
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
          </div>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-[30rem] rounded-card border border-border bg-surface-strong p-4 shadow-soft">
            <div className="relative h-full overflow-hidden rounded-card bg-[#ebe9e1]">
              <div className="absolute inset-x-8 top-10 h-36 rounded-full bg-white/55 blur-3xl" />
              <div className="absolute left-1/2 top-[14%] h-[68%] w-[42%] -translate-x-1/2 rounded-t-[999px] rounded-b-lg border border-white/60 bg-gradient-to-b from-white/80 via-[#d8d1c2]/80 to-[#9e8a73]/85 shadow-[0_32px_80px_rgba(38,36,33,0.18)]" />
              <div className="absolute left-1/2 top-[8%] h-14 w-24 -translate-x-1/2 rounded-lg border border-white/70 bg-[#c9beb0]" />
              <div className="absolute left-1/2 top-[43%] w-[56%] -translate-x-1/2 rounded-card border border-white/60 bg-white/62 px-6 py-6 text-center backdrop-blur-sm">
                <p className="font-serif text-3xl font-semibold text-charcoal">LA</p>
                <p className="mt-1 text-xs font-semibold uppercase text-muted">
                  Esperanza
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="brand-foundation" className="py-16 md:py-24">
        <Container>
          <SectionHeading
            eyebrow="Brand foundation"
            title="A composed base for the store to come."
            description="These starter sections define the visual rhythm, messaging space, and reusable building blocks before ecommerce features are added."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {brandPillars.map((pillar) => (
              <Card key={pillar.title} className="p-6">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#efebe4] text-accent">
                  <pillar.icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-charcoal">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{pillar.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section id="structure" className="border-y border-border/70 bg-surface/70 py-16 md:py-24">
        <Container className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:items-start">
          <SectionHeading
            eyebrow="Architecture"
            title="Ready for product, cart, and content layers later."
            description="The current build stops at the foundation: app shell, layout, UI primitives, theme tokens, and a homepage skeleton."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {["App Router", "TypeScript", "Tailwind CSS", "Reusable UI", "Responsive Layout", "Soft Grey Theme"].map((item) => (
              <Card key={item} className="min-h-28 p-5">
                <p className="text-sm font-semibold uppercase text-accent">
                  {item}
                </p>
                <div className="mt-6 h-2 rounded-full bg-[#e4e1d9]" />
                <div className="mt-3 h-2 w-2/3 rounded-full bg-[#d7d3c8]" />
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
