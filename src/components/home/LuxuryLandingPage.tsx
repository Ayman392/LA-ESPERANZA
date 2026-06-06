"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Droplets, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/container";
import type { Product } from "@/types/product";

const LiquidEther = dynamic(
  () => import("@/components/effects/LiquidEther"),
  { ssr: false, loading: () => null },
);

const liquidEtherColors = ["#0F0F0F", "#C9A96A", "#E6C78A"];

type CampaignProduct = {
  name: string;
  slug?: string;
  inspiredBy: string;
  description: string;
  image: string;
  href: string;
};

const signatureOrder = ["ZEUS", "POSEIDON", "VENYX", "VELOUR", "MYST", "LUME"];

const fallbackCampaignProducts: CampaignProduct[] = [
  {
    name: "ZEUS",
    inspiredBy: "Inspired by bold amber icons",
    description:
      "Commanding warmth, polished woods, and a confident trail for nights that need presence.",
    image: "/products/flame.png",
    href: "/shop",
  },
  {
    name: "POSEIDON",
    inspiredBy: "Inspired by fresh blue signatures",
    description:
      "Marine clarity, crisp citrus, and smooth woods shaped for clean everyday elegance.",
    image: "/products/poseidon.png",
    href: "/shop",
  },
  {
    name: "VENYX",
    inspiredBy: "Inspired by modern aromatic depth",
    description:
      "A refined contrast of bright opening notes and a shadowed, magnetic drydown.",
    image: "/products/sera.png",
    href: "/shop",
  },
  {
    name: "VELOUR",
    inspiredBy: "Inspired by sensual floral amber",
    description:
      "Soft petals, creamy warmth, and a dressed-up finish with quiet sophistication.",
    image: "/products/velour.png",
    href: "/shop",
  },
  {
    name: "MYST",
    inspiredBy: "Inspired by airy musks",
    description:
      "Transparent florals and gentle musk for a close, elegant skin scent.",
    image: "/products/rosee.png",
    href: "/shop",
  },
  {
    name: "LUME",
    inspiredBy: "Inspired by luminous fresh florals",
    description:
      "Radiant fruit, clean petals, and a soft golden trail for day-to-evening polish.",
    image: "/products/sera.png",
    href: "/shop",
  },
];

const droplets = [
  { left: "9%", top: "27%", size: 6, delay: 0 },
  { left: "18%", top: "68%", size: 4, delay: 0.7 },
  { left: "37%", top: "21%", size: 5, delay: 0.25 },
  { left: "59%", top: "18%", size: 4, delay: 1.05 },
  { left: "72%", top: "58%", size: 7, delay: 0.45 },
  { left: "88%", top: "34%", size: 5, delay: 0.85 },
  { left: "50%", top: "77%", size: 4, delay: 1.2 },
];

const testimonials = [
  "Long lasting and elegant.",
  "Feels far more expensive than its price.",
  "My new daily signature scent.",
];

const toCampaignProduct = (product: Product): CampaignProduct => ({
  name: product.name.toUpperCase(),
  slug: product.slug,
  inspiredBy: `Inspired by ${product.inspiredBy}`,
  description: shortenDescription(product.description),
  image: product.imageUrl || product.image,
  href: `/products/${product.slug}`,
});

const shortenDescription = (description: string) => {
  if (description.length <= 135) {
    return description;
  }

  return `${description.slice(0, 132).trim()}...`;
};

// Signature panels prefer live Supabase catalog products and fall back to existing public assets.
const getSignatureProducts = (products: Product[]) => {
  const liveProducts = new Map(
    products.map((product) => [product.name.trim().toUpperCase(), product]),
  );

  return signatureOrder.map((name) => {
    const liveProduct = liveProducts.get(name);

    if (liveProduct) {
      return toCampaignProduct(liveProduct);
    }

    return fallbackCampaignProducts.find((product) => product.name === name)!;
  });
};

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
      initial={shouldReduceMotion ? false : { opacity: 0, y: 34 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-110px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#C9A96A]">
      {children}
    </p>
  );
}

function CampaignButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";

  return (
    <Link
      href={href}
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-xs font-semibold uppercase tracking-[0.08em]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96A]",
        isPrimary
          ? "btn-primary-luxury btn-campaign-gold"
          : "btn-primary-luxury btn-campaign-gold btn-campaign-gold-muted",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export function LuxuryLandingPage({ products }: { products: Product[] }) {
  const shouldReduceMotion = useReducedMotion();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const signatureProducts = useMemo(
    () => getSignatureProducts(products),
    [products],
  );
  const collageProducts = [
    signatureProducts[3] ?? fallbackCampaignProducts[3],
    signatureProducts[1] ?? fallbackCampaignProducts[1],
    signatureProducts[4] ?? fallbackCampaignProducts[4],
  ];

  const handleHeroPointerMove = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => {
    if (shouldReduceMotion || window.innerWidth < 768) {
      return;
    }

    const { innerWidth, innerHeight } = window;
    const x = (event.clientX / innerWidth - 0.5) * 18;
    const y = (event.clientY / innerHeight - 0.5) * 14;

    setParallax({ x, y });
  };

  return (
    <main className="overflow-hidden bg-[#FAF7F2] text-[#111111]">
      {/* Hero Section */}
      <section
        className="relative min-h-[100svh] overflow-hidden bg-[#0F0F0F] text-white"
        onMouseMove={handleHeroPointerMove}
        onMouseLeave={() => setParallax({ x: 0, y: 0 })}
      >
        {/* Layer 1: dark textured campaign image. */}
        <div className="absolute inset-0 bg-[#05070B]" />
        <motion.div
          aria-hidden
          className="absolute inset-0"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.03 }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                  scale: 1,
                  x: parallax.x * 0.18,
                  y: parallax.y * 0.14,
                }
          }
          transition={{ duration: 1.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/hero/la-esperanza-bottle.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[52%_center] brightness-[0.52] saturate-[0.72] md:object-center"
          />
        </motion.div>

        {/* Layer 2: low-opacity React Bits atmosphere. */}
        {shouldReduceMotion === false ? (
          <div
            aria-hidden
            className="absolute inset-0 z-[1] opacity-[0.2] mix-blend-screen"
          >
            <LiquidEther
              colors={liquidEtherColors}
              mouseForce={7}
              cursorSize={82}
              resolution={0.3}
              iterationsPoisson={18}
              iterationsViscous={18}
              autoDemo
              autoSpeed={0.2}
              autoIntensity={0.85}
              autoResumeDelay={1800}
              autoRampDuration={1.4}
            />
          </div>
        ) : null}

        {/* Layer 3: spotlight, mist, and readable cinematic falloff. */}
        <div className="absolute inset-0 z-[2] bg-[radial-gradient(circle_at_50%_43%,rgba(230,199,138,0.18),rgba(7,10,15,0.2)_25%,rgba(5,7,11,0.76)_72%)]" />
        <div className="absolute inset-x-0 bottom-0 z-[2] h-[48%] bg-[linear-gradient(0deg,rgba(5,7,11,0.96)_0%,rgba(5,7,11,0.56)_52%,transparent_100%)]" />
        <motion.div
          aria-hidden
          className="absolute inset-x-[10%] bottom-[8%] z-[3] h-44 rounded-full bg-white/8 blur-[70px]"
          animate={shouldReduceMotion ? undefined : { x: ["-3%", "3%", "-3%"] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-y-0 left-[18%] z-[3] w-2/3 bg-[linear-gradient(112deg,transparent_26%,rgba(230,199,138,0.1)_50%,transparent_70%)] blur-2xl"
          animate={shouldReduceMotion ? undefined : { x: ["-10%", "10%", "-10%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Layer 4: oversized fragrance-house wordmark. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[28%] z-[4] flex justify-center px-3 text-center"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.35, ease: "easeOut" }}
        >
          <p className="whitespace-nowrap font-serif text-[clamp(3rem,11vw,10.5rem)] font-semibold tracking-[0.08em] text-white/[0.13] [text-shadow:0_0_42px_rgba(230,199,138,0.14)]">
            LA ESPERANZA
          </p>
        </motion.div>

        {/* Layer 5: the masked foreground restores the bottle above the wordmark. */}
        <motion.div
          aria-hidden
          className="hero-bottle-mask absolute inset-0 z-[5]"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.05 }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                  scale: 1,
                  x: parallax.x * 0.42,
                  y: parallax.y * 0.32,
                }
          }
          transition={{ duration: 1.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="relative h-full w-full"
            animate={shouldReduceMotion ? undefined : { y: [0, -5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/hero/la-esperanza-bottle.png"
              alt="Frosted LA ESPERANZA perfume bottle"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[52%_center] md:object-center"
            />
          </motion.div>
        </motion.div>

        {/* Layer 6: minimal suspended fragrance droplets. */}
        {droplets.map((droplet) => (
          <motion.span
            key={`${droplet.left}-${droplet.top}`}
            aria-hidden
            className="absolute z-[6] rounded-full border border-white/42 bg-white/12 shadow-[0_0_18px_rgba(255,255,255,0.28)] backdrop-blur"
            style={{
              left: droplet.left,
              top: droplet.top,
              width: droplet.size,
              height: droplet.size * 1.35,
            }}
            animate={
              shouldReduceMotion
                ? undefined
                : { y: [-6, 14, -6], opacity: [0.1, 0.48, 0.1] }
            }
            transition={{
              duration: 7.2,
              repeat: Infinity,
              delay: droplet.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Layer 7: restrained editorial message and actions. */}
        <Container className="relative z-[7] flex min-h-[100svh] items-end justify-center pb-9 pt-24 text-center sm:pb-12 md:pb-14">
          <motion.div
            className="max-w-2xl"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.95,
              delay: 0.78,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <h1 className="font-serif text-2xl font-semibold tracking-[0.025em] text-white [text-shadow:0_6px_26px_rgba(0,0,0,0.58)] sm:text-3xl md:text-4xl">
              Timeless Scents. Endless Elegance.
            </h1>
            <motion.p
              className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/66 [text-shadow:0_4px_18px_rgba(0,0,0,0.6)] sm:text-base"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
            >
              Inspired fragrances crafted for presence, memory and lasting
              impression.
            </motion.p>
            <motion.div
              className="mt-5 flex flex-wrap justify-center gap-3"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.18, ease: "easeOut" }}
            >
              <CampaignButton href="#signature-collection">
                Explore Collection
              </CampaignButton>
              <CampaignButton href="/shop" variant="secondary">
                Shop Now
              </CampaignButton>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* The Art of Inspiration */}
      <section id="art-of-inspiration" className="py-20 md:py-28">
        <Container className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <Reveal>
            <SectionLabel>The Art of Inspiration</SectionLabel>
            <h2 className="mt-5 max-w-xl font-[var(--font-campaign-serif)] text-4xl font-semibold leading-tight text-[#111111] md:text-6xl">
              A Fragrance Born From Precision
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#6F6F6F] md:text-lg">
              At LA ESPERANZA, every fragrance is selected to capture the
              emotion, memory, and elegance of iconic scents, refined for
              everyday luxury.
            </p>
          </Reveal>

          <Reveal className="relative min-h-[33rem]">
            <div className="absolute left-0 top-8 h-72 w-[58%] overflow-hidden rounded-lg border border-[#E8E3D8] bg-white shadow-[0_24px_70px_rgba(17,17,17,0.12)]">
              <Image
                src={collageProducts[0].image}
                alt={`${collageProducts[0].name} perfume editorial visual`}
                fill
                sizes="(min-width: 768px) 36vw, 80vw"
                className="object-cover"
              />
            </div>
            <div className="absolute right-0 top-0 h-80 w-[48%] overflow-hidden rounded-lg border border-[#E8E3D8] bg-[#0F0F0F] shadow-[0_24px_70px_rgba(17,17,17,0.14)]">
              <Image
                src={collageProducts[1].image}
                alt={`${collageProducts[1].name} perfume editorial visual`}
                fill
                sizes="(min-width: 768px) 28vw, 70vw"
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-[28%] h-60 w-[44%] overflow-hidden rounded-lg border border-[#E8E3D8] bg-white shadow-[0_24px_70px_rgba(17,17,17,0.13)]">
              <Image
                src={collageProducts[2].image}
                alt={`${collageProducts[2].name} perfume editorial visual`}
                fill
                sizes="(min-width: 768px) 30vw, 70vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Signature Collection */}
      <section id="signature-collection" className="bg-[#F8F7F4] py-20 md:py-28">
        <Container>
          <Reveal className="mx-auto max-w-3xl text-center">
            <SectionLabel>Signature Collection</SectionLabel>
            <h2 className="mt-5 font-[var(--font-campaign-serif)] text-4xl font-semibold leading-tight md:text-6xl">
              Six signatures, one quiet standard of elegance.
            </h2>
          </Reveal>

          <div className="mt-16 space-y-14 md:space-y-20">
            {signatureProducts.map((product, index) => {
              const isReversed = index % 2 === 1;

              return (
                <Reveal key={product.name} delay={index * 0.04}>
                  <article
                    className={[
                      "grid overflow-hidden rounded-lg border border-[#E8E3D8] bg-[#FAF7F2] shadow-[0_24px_90px_rgba(17,17,17,0.08)] md:grid-cols-2",
                      isReversed ? "md:[&>div:first-child]:order-2" : "",
                    ].join(" ")}
                  >
                    <div className="relative min-h-[23rem] bg-[#0F0F0F] md:min-h-[34rem]">
                      <Image
                        src={product.image}
                        alt={`${product.name} perfume campaign visual`}
                        fill
                        sizes="(min-width: 1024px) 45vw, 100vw"
                        className="object-cover transition duration-700 hover:scale-[1.025]"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(15,15,15,0.42)_100%)]" />
                    </div>
                    <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
                      <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#C9A96A]">
                        {product.inspiredBy}
                      </p>
                      <h3 className="mt-5 font-[var(--font-campaign-serif)] text-4xl font-semibold leading-tight md:text-6xl">
                        {product.name}
                      </h3>
                      <p className="mt-6 max-w-md text-base leading-8 text-[#6F6F6F]">
                        {product.description}
                      </p>
                      <Link
                        href={product.href}
                        className="btn-secondary-luxury mt-8 inline-flex w-fit items-center gap-3 rounded-full border border-[#111111]/18 px-6 py-3 text-sm font-semibold text-[#111111] hover:text-[#8E6F35]"
                      >
                        Discover
                        <ArrowRight aria-hidden className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Luxury Statement Banner */}
      <section className="relative overflow-hidden bg-[#0F0F0F] py-24 text-white md:py-32">
        <motion.div
          aria-hidden
          className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(105deg,transparent_20%,rgba(201,169,106,0.16)_48%,transparent_70%)]"
          animate={shouldReduceMotion ? undefined : { x: ["-18%", "18%", "-18%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <Container className="relative z-10">
          <Reveal className="mx-auto max-w-4xl text-center">
            <h2 className="font-[var(--font-campaign-serif)] text-4xl font-semibold leading-tight text-white md:text-7xl">
              More Than Fragrance.
              <span className="block text-white/72">
                A signature that stays with you.
              </span>
            </h2>
          </Reveal>
        </Container>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28">
        <Container>
          <Reveal className="mx-auto max-w-3xl text-center">
            <SectionLabel>Testimonials</SectionLabel>
            <h2 className="mt-5 font-[var(--font-campaign-serif)] text-4xl font-semibold leading-tight md:text-6xl">
              Quiet impressions from daily wear.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Reveal key={testimonial} delay={index * 0.06}>
                <article className="h-full rounded-lg border border-[#E8E3D8] bg-white/70 p-7 shadow-[0_18px_60px_rgba(17,17,17,0.06)] backdrop-blur">
                  <div className="mb-8 flex items-center gap-2 text-[#C9A96A]">
                    <Sparkles aria-hidden className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.3em]">
                      LA ESPERANZA
                    </span>
                  </div>
                  <p className="font-[var(--font-campaign-serif)] text-2xl leading-snug text-[#111111]">
                    &ldquo;{testimonial}&rdquo;
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-[#E8E3D8] bg-[#F8F7F4] py-10">
        <Container className="flex flex-col gap-5 text-sm text-[#6F6F6F] md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-3">
            <Droplets aria-hidden className="h-4 w-4 text-[#C9A96A]" />
            <span>Luxury perfume, curated for lasting impressions.</span>
          </div>
          <Link
            href="/shop"
            className="btn-primary-luxury btn-campaign-gold btn-campaign-gold-muted inline-flex w-fit items-center gap-3 rounded-full px-6 py-3 text-sm font-semibold"
          >
            Shop the Collection
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Container>
      </section>
    </main>
  );
}
