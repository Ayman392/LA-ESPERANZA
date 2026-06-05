-- Phase 9: product variant inventory by bottle size.
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_ml integer not null,
  stock_quantity integer not null default 30,
  low_stock_threshold integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size_ml)
);

alter table public.product_variants
  drop constraint if exists product_variants_size_ml_check,
  drop constraint if exists product_variants_stock_quantity_check,
  drop constraint if exists product_variants_low_stock_threshold_check;

alter table public.product_variants
  add constraint product_variants_size_ml_check check (size_ml in (15, 30)),
  add constraint product_variants_stock_quantity_check check (stock_quantity >= 0),
  add constraint product_variants_low_stock_threshold_check check (low_stock_threshold >= 0);

alter table public.product_variants enable row level security;

create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists product_variants_stock_quantity_idx on public.product_variants(stock_quantity);
create index if not exists product_variants_low_stock_threshold_idx on public.product_variants(low_stock_threshold);

create or replace function public.set_product_variants_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.stock_quantity := greatest(0, coalesce(new.stock_quantity, 0));
  new.low_stock_threshold := greatest(0, coalesce(new.low_stock_threshold, 5));
  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists set_product_variants_updated_at_before_write on public.product_variants;
create trigger set_product_variants_updated_at_before_write
  before insert or update on public.product_variants
  for each row
  execute function public.set_product_variants_updated_at();

create or replace function public.sync_product_stock_from_variants()
returns trigger
language plpgsql
as $$
declare
  target_product_id uuid;
  total_stock integer;
begin
  target_product_id := case
    when tg_op = 'DELETE' then old.product_id
    else new.product_id
  end;

  select coalesce(sum(stock_quantity), 0)::integer
  into total_stock
  from public.product_variants
  where product_id = target_product_id;

  update public.products
  set stock_quantity = total_stock,
      stock = total_stock,
      updated_at = now()
  where id = target_product_id;

  return null;
end;
$$;

drop trigger if exists sync_product_stock_from_variants_after_write on public.product_variants;
create trigger sync_product_stock_from_variants_after_write
  after insert or update or delete on public.product_variants
  for each row
  execute function public.sync_product_stock_from_variants();

alter table public.order_items
  add column if not exists product_variant_id uuid references public.product_variants(id),
  add column if not exists size_ml integer;

update public.order_items
set size_ml = replace(size, 'ml', '')::integer
where size_ml is null
  and size in ('15ml', '30ml');

alter table public.order_items
  drop constraint if exists order_items_size_ml_check;

alter table public.order_items
  add constraint order_items_size_ml_check check (size_ml is null or size_ml in (15, 30));

create index if not exists order_items_product_variant_id_idx on public.order_items(product_variant_id);

create or replace function public.decrement_product_variant_stock(
  p_product_slug text,
  p_size_ml integer,
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
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Stock deduction quantity must be greater than zero.';
  end if;

  if p_size_ml not in (15, 30) then
    raise exception 'Invalid product size %. Size must be 15ml or 30ml.', p_size_ml;
  end if;

  update public.product_variants as variant
  set stock_quantity = variant.stock_quantity - p_quantity,
      updated_at = now()
  from public.products as product
  where variant.product_id = product.id
    and product.slug = p_product_slug
    and product.is_active = true
    and variant.size_ml = p_size_ml
    and variant.stock_quantity >= p_quantity
  returning variant.stock_quantity into next_stock;

  if next_stock is null then
    raise exception 'Insufficient stock for % %ml.', p_product_slug, p_size_ml;
  end if;

  return next_stock;
end;
$$;

insert into public.products (
  slug,
  name,
  inspired_by,
  gender,
  size_15ml_price,
  size_30ml_price,
  stock,
  stock_quantity,
  low_stock_threshold,
  image,
  is_active
)
values
  ('velour', 'Velour', 'Yves Saint Laurent Libre', 'Women', 700, 1250, 60, 60, 5, '/products/velour.png', true),
  ('myst', 'Myst', 'Dior Sauvage', 'Men', 680, 1200, 60, 60, 5, '/products/flame.png', true),
  ('venyx', 'Venyx', 'Creed Aventus', 'Men', 720, 1300, 60, 60, 5, '/products/sera.png', true),
  ('poseidon', 'Poseidon', 'Acqua di Gio Profumo', 'Men', 680, 1200, 60, 60, 5, '/products/poseidon.png', true),
  ('lume', 'Lume', 'Chanel Chance Eau Tendre', 'Women', 650, 1150, 60, 60, 5, '/products/rosee.png', true),
  ('zeus', 'Zeus', 'Paco Rabanne Invictus', 'Men', 690, 1220, 60, 60, 5, '/products/flame.png', true)
on conflict (slug) do update
set name = excluded.name,
    inspired_by = excluded.inspired_by,
    gender = excluded.gender,
    size_15ml_price = excluded.size_15ml_price,
    size_30ml_price = excluded.size_30ml_price,
    image = excluded.image,
    is_active = true,
    updated_at = now();

update public.products
set is_active = false,
    updated_at = now()
where slug not in ('velour', 'myst', 'venyx', 'poseidon', 'lume', 'zeus');

insert into public.product_variants (
  product_id,
  size_ml,
  stock_quantity,
  low_stock_threshold
)
select product.id, size_option.size_ml, 30, 5
from public.products as product
cross join (values (15), (30)) as size_option(size_ml)
where product.slug in ('velour', 'myst', 'venyx', 'poseidon', 'lume', 'zeus')
on conflict (product_id, size_ml) do update
set stock_quantity = 30,
    low_stock_threshold = coalesce(public.product_variants.low_stock_threshold, 5),
    updated_at = now();
