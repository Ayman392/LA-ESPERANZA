# LA ESPERANZA

Professional Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, and Lucide React foundation for the LA ESPERANZA perfume ecommerce brand.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Structure

```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  layout/
  motion/
  product/
  shared/
  ui/
hooks/
lib/
services/
supabase/
types/
docs/
public/
```

This project now includes the Phase 1 brand foundation and Phase 2 product catalog browsing system. Cart, checkout, payments, and admin tooling are still intentionally left for later phases.

## Phase 2 Catalog

The product catalog browsing system is available at `/shop`.

It includes 5 inspired perfume products, product detail pages, search, gender/price/occasion filters, a responsive grid, and an empty state. Cart, checkout, payments, and admin tooling are intentionally not included yet.

See `docs/product-catalog.md` for the Phase 2 structure.

## Phase 2 Files

```text
app/shop/page.tsx
app/shop/[slug]/page.tsx
components/product/
lib/products.ts
services/product-filters.ts
types/product.ts
public/products/
```
