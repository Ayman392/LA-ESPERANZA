"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Globe,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/layout/container";

const heroParticles = [
  { left: "12%", top: "22%", size: 4, delay: 0 },
  { left: "22%", top: "64%", size: 5, delay: 0.45 },
  { left: "42%", top: "18%", size: 3, delay: 0.2 },
  { left: "67%", top: "29%", size: 4, delay: 0.7 },
  { left: "78%", top: "61%", size: 5, delay: 0.35 },
  { left: "88%", top: "38%", size: 3, delay: 0.95 },
  { left: "55%", top: "78%", size: 4, delay: 0.55 },
  { left: "31%", top: "42%", size: 3, delay: 1.1 },
];

const bestSellers = [
  {
    name: "Velour",
    image: "/products/velour.png",
    inspiredBy: "Good Girl",
    mood: "Evening floral amber",
    price: "From BDT 700",
  },
  {
    name: "Flame",
    image: "/products/flame.png",
    inspiredBy: "Versace Eros",
    mood: "Green apple, mint, woods",
    price: "From BDT 650",
  },
  {
    name: "Poseidon",
    image: "/products/poseidon.png",
    inspiredBy: "Bleu De Chanel",
    mood: "Aquatic woods",
    price: "From BDT 680",
  },
];

const pillars = [
  {
    title: "Inspired Luxury",
    description:
      "Profiles shaped around beloved designer moods with a polished LA ESPERANZA signature.",
    icon: Sparkles,
  },
  {
    title: "Size-Level Freshness",
    description:
      "15ml and 30ml choices are tracked separately so every order reflects current availability.",
    icon: ShieldCheck,
  },
  {
    title: "Quiet Projection",
    description:
      "Balanced blends made for presence, not noise, with a refined trail from first spray to drydown.",
    icon: Wand2,
  },
];

const collections = [
  {
    title: "Noir Classics",
    description: "Deep woods, amber, spice, and dressed-up night signatures.",
    image: "/products/velour.png",
  },
  {
    title: "Fresh Icons",
    description: "Clean citrus, marine air, herbs, and everyday sophistication.",
    image: "/products/poseidon.png",
  },
  {
    title: "Soft Florals",
    description: "Petals, musk, luminous fruit, and gentle modern femininity.",
    image: "/products/rosee.png",
  },
];

const finderSteps = [
  "Choose a mood",
  "Select your moment",
  "Discover your trail",
];

const reviews = [
  {
    name: "Nadia R.",
    text: "Velour feels elegant without becoming heavy. It settles beautifully after the first hour.",
  },
  {
    name: "Mahin A.",
    text: "Poseidon is clean, confident, and easy to wear. The bottle looks premium on my shelf.",
  },
  {
    name: "Samira K.",
    text: "The 15ml size is perfect for trying a scent before committing. Flame surprised me most.",
  },
];

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-charcoal md:text-6xl">
        {title}
      </h2>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted">
        {description}
      </p>
    </Reveal>
  );
}

export function LuxuryLandingPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="overflow-hidden bg-background text-charcoal">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100svh-5rem)] overflow-hidden bg-charcoal text-white">
        <Image
          src="/products/flame.png"
          alt="LA ESPERANZA Flame perfume bottle surrounded by fruits, leaves, and warm light"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,11,10,0.88)_0%,rgba(18,16,13,0.58)_42%,rgba(18,16,13,0.2)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(225,194,141,0.22),transparent_28rem)]" />

        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(0deg,rgba(252,248,248,0.92)_0%,rgba(252,248,248,0.22)_56%,transparent_100%)] blur-sm"
          animate={shouldReduceMotion ? undefined : { opacity: [0.65, 0.9, 0.65] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(115deg,transparent,rgba(255,255,255,0.12),transparent)] blur-2xl"
          animate={shouldReduceMotion ? undefined : { x: ["8%", "-10%", "8%"] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        {heroParticles.map((particle) => (
          <motion.span
            key={`${particle.left}-${particle.top}`}
            aria-hidden
            className="absolute rounded-full bg-white/75 shadow-[0_0_18px_rgba(255,255,255,0.75)]"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
            }}
            animate={
              shouldReduceMotion
                ? undefined
                : { y: [0, -26, 0], opacity: [0.2, 0.9, 0.2] }
            }
            transition={{
              duration: 5.5,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        <Container className="relative z-10 flex min-h-[calc(100svh-5rem)] items-center py-20">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.38em] text-white/72">
              LA ESPERANZA
            </p>
            <h1 className="mt-6 max-w-4xl font-serif text-6xl font-semibold leading-[0.92] text-white sm:text-7xl lg:text-8xl">
              Luxury in Every Drop
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/76 sm:text-lg">
              A refined perfume house for modern signatures, soft projection,
              and scents that arrive with quiet confidence.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-charcoal shadow-soft transition hover:bg-[#f3ece7] focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                Explore Perfumes
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
              <Link
                href="#fragrance-finder"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/34 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/16 focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                Find Your Scent
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Best Sellers */}
      <section id="best-sellers" className="py-20 md:py-28">
        <Container>
          <SectionIntro
            eyebrow="Best Sellers"
            title="Signatures with a lasting impression."
            description="A curated edit of customer favorites, styled with premium bottle photography and size-level availability in the shop."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {bestSellers.map((product, index) => (
              <Reveal key={product.name} delay={index * 0.08}>
                <Link
                  href="/shop"
                  className="group block overflow-hidden rounded-card border border-white/70 bg-white/54 shadow-[0_30px_90px_rgba(38,36,33,0.09)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_100px_rgba(38,36,33,0.15)]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#e9e2df]">
                    <Image
                      src={product.image}
                      alt={`${product.name} perfume bottle`}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-4 bottom-4 rounded-card border border-white/30 bg-white/18 p-4 text-white shadow-soft backdrop-blur-md">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/72">
                        {product.inspiredBy}
                      </p>
                      <p className="mt-1 font-serif text-3xl font-semibold">
                        {product.name}
                      </p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-6 text-muted">{product.mood}</p>
                    <p className="mt-4 text-lg font-semibold text-charcoal">
                      {product.price}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Why Choose LA ESPERANZA */}
      <section className="border-y border-border/70 bg-surface/72 py-20 md:py-28">
        <Container>
          <SectionIntro
            eyebrow="Why Choose LA ESPERANZA"
            title="Luxury made precise, personal, and wearable."
            description="Every detail is built for a smoother fragrance journey, from product discovery to bottle-size selection."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {pillars.map((pillar, index) => (
              <Reveal key={pillar.title} delay={index * 0.08}>
                <div className="h-full rounded-card border border-border bg-surface-strong p-7 shadow-soft transition hover:-translate-y-1 hover:border-accent/35">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ede4df] text-accent">
                    <pillar.icon aria-hidden className="h-5 w-5" />
                  </div>
                  <h3 className="mt-7 font-serif text-3xl font-semibold text-charcoal">
                    {pillar.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-muted">
                    {pillar.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured Collections */}
      <section className="py-20 md:py-28">
        <Container>
          <SectionIntro
            eyebrow="Featured Collections"
            title="A wardrobe of fragrance moods."
            description="Move from polished evenings to fresh mornings with collections shaped around atmosphere and occasion."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {collections.map((collection, index) => (
              <Reveal key={collection.title} delay={index * 0.08}>
                <Link
                  href="/shop"
                  className="group relative block min-h-[28rem] overflow-hidden rounded-card border border-border bg-charcoal text-white shadow-soft"
                >
                  <Image
                    src={collection.image}
                    alt={`${collection.title} perfume collection`}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_20%,rgba(12,11,10,0.86)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/64">
                      Collection
                    </p>
                    <h3 className="mt-2 font-serif text-4xl font-semibold">
                      {collection.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-white/72">
                      {collection.description}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Fragrance Finder */}
      <section
        id="fragrance-finder"
        className="border-y border-border/70 bg-[#f7f2f1] py-20 md:py-28"
      >
        <Container className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">
              Fragrance Finder
            </p>
            <h2 className="mt-4 font-serif text-5xl font-semibold leading-tight text-charcoal md:text-6xl">
              Let your next signature find you.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted">
              Start with how you want to feel, then move through occasion and
              trail. The experience stays calm, precise, and personal.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-charcoal px-6 text-sm font-semibold text-white shadow-soft transition hover:bg-[#38352f]"
            >
              Browse the Finder Edit
              <Search aria-hidden className="h-4 w-4" />
            </Link>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="rounded-card border border-white/70 bg-white/58 p-5 shadow-[0_30px_90px_rgba(38,36,33,0.1)] backdrop-blur-xl">
              <div className="grid gap-3">
                {finderSteps.map((step, index) => (
                  <motion.div
                    key={step}
                    whileHover={shouldReduceMotion ? undefined : { x: 6 }}
                    className="flex items-center gap-4 rounded-card border border-border bg-background p-4"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-charcoal">{step}</p>
                      <p className="mt-1 text-sm text-muted">
                        {index === 0
                          ? "Fresh, warm, floral, aquatic, woody"
                          : index === 1
                            ? "Daily, office, evening, formal, signature"
                            : "Soft, intimate, confident, memorable"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Customer Reviews */}
      <section className="py-20 md:py-28">
        <Container>
          <SectionIntro
            eyebrow="Customer Reviews"
            title="A quiet kind of devotion."
            description="Early favorites from customers choosing compact sizes, polished drydowns, and everyday luxury."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {reviews.map((review, index) => (
              <Reveal key={review.name} delay={index * 0.08}>
                <article className="h-full rounded-card border border-border bg-surface-strong p-6 shadow-soft">
                  <div className="flex gap-1 text-accent">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        aria-hidden
                        className="h-4 w-4"
                        fill="currentColor"
                      />
                    ))}
                  </div>
                  <p className="mt-5 text-base leading-8 text-charcoal">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <p className="mt-6 text-sm font-semibold text-muted">
                    {review.name}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Newsletter */}
      <section className="px-5 pb-20 md:pb-28">
        <Container className="overflow-hidden rounded-card border border-border bg-charcoal px-0 text-white shadow-soft">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="p-8 md:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/56">
                Newsletter
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight md:text-6xl">
                Receive the first note.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/68">
                New launches, restocks, and private fragrance edits, composed
                for the LA ESPERANZA circle.
              </p>
              <form className="mt-8 flex flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor="newsletter-email">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-5 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/60"
                />
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-charcoal transition hover:bg-[#f3ece7]"
                >
                  Join
                </button>
              </form>
            </div>
            <div className="relative min-h-80 overflow-hidden">
              <Image
                src="/products/sera.png"
                alt="LA ESPERANZA perfume bottle used for newsletter visual"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Luxury Footer */}
      <footer className="bg-[#181614] py-14 text-white">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr_0.8fr]">
          <div>
            <p className="font-serif text-4xl font-semibold">LA ESPERANZA</p>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/62">
              Inspired perfumes with a premium touch, modern bottle-size
              choices, and a customer experience designed around elegance.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { label: "Instagram", icon: Camera },
                { label: "Facebook", icon: Globe },
                { label: "WhatsApp", icon: MessageCircle },
              ].map((item) => (
                <Link
                  key={item.label}
                  href="/"
                  aria-label={item.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:bg-white/14"
                >
                  <item.icon aria-hidden className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/48">
              Visit
            </p>
            <nav className="mt-5 grid gap-3 text-sm text-white/70">
              <Link className="transition hover:text-white" href="/shop">
                Shop
              </Link>
              <Link className="transition hover:text-white" href="#best-sellers">
                Best Sellers
              </Link>
              <Link
                className="transition hover:text-white"
                href="#fragrance-finder"
              >
                Fragrance Finder
              </Link>
            </nav>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/48">
              Contact
            </p>
            <div className="mt-5 space-y-3 text-sm text-white/70">
              <p>Dhaka, Bangladesh</p>
              <p>+880 1XXX XXXXXX</p>
              <p className="inline-flex items-center gap-2">
                <Mail aria-hidden className="h-4 w-4" />
                hello@laesperanza.bd
              </p>
            </div>
          </div>
        </Container>
      </footer>
    </main>
  );
}
