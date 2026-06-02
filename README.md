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
src/
  app/
    globals.css
    layout.tsx
    page.tsx
    shop/
    products/
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

This project includes the Phase 1 brand foundation and the Phase 2 product catalog browsing system. Cart, checkout, payments, and admin tooling are intentionally not part of this scope.

## Phase 2 Catalog

The product catalog browsing system is available at `/shop`.

It includes 5 inspired perfume products, product detail pages, search, gender/price/occasion filters, a responsive grid, and an empty state. The catalog is browsing-only by design.

See `docs/product-catalog.md` for the Phase 2 structure.

## Phase 2 Files

```text
src/app/shop/page.tsx
src/app/products/[slug]/page.tsx
src/components/product/ProductCard.tsx
src/components/product/ProductFilters.tsx
src/components/product/ProductGrid.tsx
src/lib/products.ts
src/services/product-filters.ts
src/types/product.ts
public/products/
```
