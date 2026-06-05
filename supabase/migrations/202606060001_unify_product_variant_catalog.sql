-- Unify product metadata and size-level inventory around Supabase products + product_variants.
alter table public.products
  add column if not exists description text not null default '',
  add column if not exists image_url text,
  add column if not exists image_path text,
  add column if not exists top_notes text[] not null default '{}',
  add column if not exists middle_notes text[] not null default '{}',
  add column if not exists base_notes text[] not null default '{}',
  add column if not exists longevity text not null default '',
  add column if not exists occasion text not null default '',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.product_variants
  add column if not exists price numeric(12, 2) not null default 0;

alter table public.product_variants
  drop constraint if exists product_variants_price_check;

alter table public.product_variants
  add constraint product_variants_price_check check (price >= 0);

create index if not exists product_variants_price_idx on public.product_variants(price);

create or replace function public.set_product_variants_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.price := greatest(0, coalesce(new.price, 0));
  new.stock_quantity := greatest(0, coalesce(new.stock_quantity, 0));
  new.low_stock_threshold := greatest(0, coalesce(new.low_stock_threshold, 5));
  new.updated_at := now();

  return new;
end;
$$;

drop function if exists public.decrement_product_variant_stock(text, integer, integer);
drop function if exists public.decrement_product_variant_stock(uuid, integer);

create or replace function public.decrement_product_variant_stock(
  p_variant_id uuid,
  p_quantity integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_stock integer;
begin
  if p_variant_id is null then
    raise exception 'Product variant is required for stock deduction.';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Stock deduction quantity must be greater than zero.';
  end if;

  update public.product_variants as variant
  set stock_quantity = variant.stock_quantity - p_quantity,
      updated_at = now()
  from public.products as product
  where variant.product_id = product.id
    and variant.id = p_variant_id
    and product.is_active = true
    and variant.stock_quantity >= p_quantity
  returning variant.stock_quantity into next_stock;

  if next_stock is null then
    raise exception 'Insufficient stock for selected product variant.';
  end if;

  return next_stock;
end;
$$;

insert into public.products (
  slug,
  name,
  inspired_by,
  gender,
  description,
  top_notes,
  middle_notes,
  base_notes,
  longevity,
  occasion,
  size_15ml_price,
  size_30ml_price,
  stock,
  stock_quantity,
  low_stock_threshold,
  image,
  image_url,
  is_active
)
values
  (
    'velour',
    'Velour',
    'Yves Saint Laurent Libre',
    'Women',
    'A sleek floral amber profile with aromatic lift, creamy warmth, and a dressed-up finish.',
    array['Lavender', 'Mandarin', 'Blackcurrant'],
    array['Orange blossom', 'Jasmine', 'Neroli'],
    array['Vanilla', 'Musk', 'Cedar'],
    '7-9 hours',
    'Formal',
    700,
    1250,
    60,
    60,
    5,
    '/products/velour.png',
    '/products/velour.png',
    true
  ),
  (
    'myst',
    'Myst',
    'Dior Sauvage',
    'Men',
    'A crisp aromatic scent with spicy freshness, clean woods, and confident everyday projection.',
    array['Calabrian bergamot', 'Pepper', 'Grapefruit'],
    array['Lavender', 'Geranium', 'Elemi'],
    array['Ambroxan', 'Cedar', 'Patchouli'],
    '8-10 hours',
    'Daily',
    680,
    1200,
    60,
    60,
    5,
    '/products/flame.png',
    '/products/flame.png',
    true
  ),
  (
    'venyx',
    'Venyx',
    'Creed Aventus',
    'Men',
    'A refined fruity-woody fragrance with polished smoke, bright citrus, and a memorable masculine trail.',
    array['Pineapple', 'Bergamot', 'Blackcurrant'],
    array['Birch', 'Jasmine', 'Patchouli'],
    array['Oakmoss', 'Ambergris', 'Musk'],
    '8-10 hours',
    'Signature',
    720,
    1300,
    60,
    60,
    5,
    '/products/sera.png',
    '/products/sera.png',
    true
  ),
  (
    'poseidon',
    'Poseidon',
    'Acqua di Gio Profumo',
    'Men',
    'A refined aquatic aromatic fragrance with mineral freshness and a smoky masculine base.',
    array['Sea notes', 'Bergamot', 'Grapefruit'],
    array['Sage', 'Rosemary', 'Geranium'],
    array['Incense', 'Patchouli', 'Mineral amber'],
    '7-9 hours',
    'Office',
    680,
    1200,
    60,
    60,
    5,
    '/products/poseidon.png',
    '/products/poseidon.png',
    true
  ),
  (
    'lume',
    'Lume',
    'Chanel Chance Eau Tendre',
    'Women',
    'A luminous soft floral with airy fruit, delicate petals, and a graceful musky finish.',
    array['Quince', 'Grapefruit', 'Mandarin'],
    array['Jasmine', 'Hyacinth', 'Rose'],
    array['White musk', 'Amber', 'Cedar'],
    '6-8 hours',
    'Daytime',
    650,
    1150,
    60,
    60,
    5,
    '/products/rosee.png',
    '/products/rosee.png',
    true
  ),
  (
    'zeus',
    'Zeus',
    'Paco Rabanne Invictus',
    'Men',
    'A powerful fresh-woody scent with aquatic brightness, warm woods, and energetic performance.',
    array['Grapefruit', 'Marine accord', 'Mandarin'],
    array['Bay leaf', 'Jasmine', 'Spices'],
    array['Guaiac wood', 'Ambergris', 'Oakmoss'],
    '7-9 hours',
    'Evening',
    690,
    1220,
    60,
    60,
    5,
    '/products/flame.png',
    '/products/flame.png',
    true
  )
on conflict (slug) do update
set name = excluded.name,
    inspired_by = excluded.inspired_by,
    gender = excluded.gender,
    description = excluded.description,
    top_notes = excluded.top_notes,
    middle_notes = excluded.middle_notes,
    base_notes = excluded.base_notes,
    longevity = excluded.longevity,
    occasion = excluded.occasion,
    size_15ml_price = excluded.size_15ml_price,
    size_30ml_price = excluded.size_30ml_price,
    image = excluded.image,
    image_url = coalesce(public.products.image_url, excluded.image_url),
    is_active = true,
    updated_at = now();

with variant_seed(slug, size_ml, price, stock_quantity, low_stock_threshold) as (
  values
    ('velour', 15, 700, 30, 5),
    ('velour', 30, 1250, 30, 5),
    ('myst', 15, 680, 30, 5),
    ('myst', 30, 1200, 30, 5),
    ('venyx', 15, 720, 30, 5),
    ('venyx', 30, 1300, 30, 5),
    ('poseidon', 15, 680, 30, 5),
    ('poseidon', 30, 1200, 30, 5),
    ('lume', 15, 650, 30, 5),
    ('lume', 30, 1150, 30, 5),
    ('zeus', 15, 690, 30, 5),
    ('zeus', 30, 1220, 30, 5)
)
insert into public.product_variants (
  product_id,
  size_ml,
  price,
  stock_quantity,
  low_stock_threshold
)
select product.id,
       seed.size_ml,
       seed.price,
       seed.stock_quantity,
       seed.low_stock_threshold
from variant_seed as seed
join public.products as product on product.slug = seed.slug
on conflict (product_id, size_ml) do update
set price = excluded.price,
    low_stock_threshold = coalesce(public.product_variants.low_stock_threshold, excluded.low_stock_threshold),
    updated_at = now();
