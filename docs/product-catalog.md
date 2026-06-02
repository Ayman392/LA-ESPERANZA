# Phase 2 Product Catalog

The LA ESPERANZA product catalog system is implemented as a browsing-only storefront layer.

## Routes

- `/shop` displays the searchable and filterable product catalog.
- `/shop/[slug]` displays a static product detail page for each perfume.

## Catalog Features

- 5 inspired perfume products
- Product cards
- Product detail pages
- Search by name, notes, inspiration, description, gender, and occasion
- Gender filter
- Price filter
- Occasion filter
- Responsive product grid
- Empty state when no products match

## Product Fields

Each product includes:

- `name`
- `inspired_by`
- `gender`
- `sizes`
- `prices`
- `stockQuantity`
- `topNotes`
- `middleNotes`
- `baseNotes`
- `longevity`
- `occasion`
- `description`
- `imagePath`

## Current Boundary

Phase 2 is a browsing-only product catalog. Cart, checkout, payments, and admin tools are intentionally excluded from this phase.
