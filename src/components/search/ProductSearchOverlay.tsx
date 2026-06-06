"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import { getProductImageSrc, getProductMinPrice } from "@/lib/products";
import type { Product } from "@/types/product";

type ProductSearchOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

const matchesProductSearch = (product: Product, query: string) =>
  [
    product.name,
    product.inspiredBy,
    product.occasion,
    product.gender,
    product.description,
    ...product.topNotes,
    ...product.middleNotes,
    ...product.baseNotes,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);

export function ProductSearchOverlay({
  isOpen,
  onClose,
}: ProductSearchOverlayProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const controller = new AbortController();

    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => inputRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    if (!hasLoaded) {
      fetch("/api/products", {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Unable to load fragrances.");
          }

          return (await response.json()) as { products?: Product[] };
        })
        .then((payload) => setProducts(payload.products ?? []))
        .catch((fetchError: unknown) => {
          if (
            fetchError instanceof DOMException &&
            fetchError.name === "AbortError"
          ) {
            return;
          }

          setError("The fragrance collection could not be loaded.");
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setHasLoaded(true);
          }
        });
    }

    return () => {
      controller.abort();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasLoaded, isOpen, onClose]);

  const normalizedQuery = query.trim().toLowerCase();
  const isLoading = isOpen && !hasLoaded && !error;
  const results = useMemo(
    () =>
      normalizedQuery
        ? products
            .filter((product) =>
              matchesProductSearch(product, normalizedQuery),
            )
            .slice(0, 6)
        : [],
    [normalizedQuery, products],
  );

  const submitSearch = () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    onClose();
    router.push(`/shop?search=${encodeURIComponent(trimmedQuery)}`);
  };

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Search fragrances"
          className="fixed inset-0 z-[100] overflow-y-auto bg-[#08090A]/88 text-white backdrop-blur-2xl"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(201,169,106,0.13),transparent_28rem)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(230,199,138,0.5),transparent)]" />

          <button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="btn-icon-luxury fixed right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/8 text-white backdrop-blur-md hover:text-[#E6C78A] sm:right-8 sm:top-8"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>

          <motion.div
            className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-5 pb-16 pt-28 sm:px-8 md:pt-36"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto w-full max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#C9A96A]">
                LA ESPERANZA
              </p>
              <form
                className="mt-8"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitSearch();
                }}
              >
                <label className="sr-only" htmlFor="luxury-product-search">
                  Search fragrances
                </label>
                <div className="flex items-center gap-4 border-b border-white/24 pb-4 transition focus-within:border-[#C9A96A]">
                  <Search
                    aria-hidden
                    className="h-6 w-6 shrink-0 text-[#C9A96A]"
                  />
                  <input
                    ref={inputRef}
                    id="luxury-product-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search fragrances..."
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent font-[var(--font-campaign-serif)] text-3xl text-white outline-none placeholder:text-white/32 sm:text-5xl"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48 transition hover:text-white"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </form>
              <p className="mt-4 text-sm text-white/44">
                Search by fragrance, inspiration, or collection.
              </p>
            </div>

            <div className="mx-auto mt-12 w-full max-w-4xl">
              {isLoading ? (
                <p className="text-center text-sm text-white/48">
                  Preparing the collection...
                </p>
              ) : null}
              {error ? (
                <p className="text-center text-sm text-[#E6C78A]">{error}</p>
              ) : null}
              {!normalizedQuery && !isLoading ? (
                <p className="text-center font-[var(--font-campaign-serif)] text-2xl text-white/42">
                  Begin with a name or an inspiration.
                </p>
              ) : null}
              {normalizedQuery && !isLoading && results.length === 0 ? (
                <div className="rounded-lg border border-white/12 bg-white/[0.04] px-6 py-12 text-center">
                  <p className="font-[var(--font-campaign-serif)] text-3xl">
                    No fragrance found
                  </p>
                  <p className="mt-3 text-sm text-white/48">
                    Try another perfume name or inspiration.
                  </p>
                </div>
              ) : null}

              {results.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {results.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={
                        shouldReduceMotion ? false : { opacity: 0, y: 14 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: index * 0.035,
                        ease: "easeOut",
                      }}
                    >
                      <Link
                        href={`/products/${product.slug}`}
                        onClick={onClose}
                        className="group grid grid-cols-[5.5rem_1fr_auto] items-center gap-4 rounded-lg border border-white/10 bg-white/[0.045] p-3 transition duration-300 hover:border-[#C9A96A]/48 hover:bg-white/[0.075]"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-white/8">
                          <Image
                            src={getProductImageSrc(product)}
                            alt={`${product.name} perfume bottle`}
                            fill
                            sizes="88px"
                            className="object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-[var(--font-campaign-serif)] text-2xl font-semibold">
                            {product.name}
                          </p>
                          <p className="mt-1 truncate text-sm text-white/52">
                            Inspired by {product.inspiredBy}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#E6C78A]">
                            From ৳{getProductMinPrice(product)}
                          </p>
                        </div>
                        <ArrowRight
                          aria-hidden
                          className="h-4 w-4 text-white/28 transition duration-300 group-hover:translate-x-0.5 group-hover:text-[#E6C78A]"
                        />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
