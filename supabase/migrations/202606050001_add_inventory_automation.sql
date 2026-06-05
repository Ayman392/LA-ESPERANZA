-- Phase 8: automatic inventory management for checkout and admin stock control.
alter table public.products
  add column if not exists stock integer not null default 0,
  add column if not exists stock_quantity integer,
  add column if not exists low_stock_threshold integer not null default 5,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

update public.products
set stock_quantity = coalesce(stock_quantity, stock, 0)
where stock_quantity is null;

update public.products
set stock = coalesce(stock, stock_quantity, 0)
where stock is null;

update public.products
set low_stock_threshold = coalesce(low_stock_threshold, 5)
where low_stock_threshold is null;

alter table public.products
  alter column stock set default 0,
  alter column stock set not null,
  alter column stock_quantity set default 0,
  alter column stock_quantity set not null,
  alter column low_stock_threshold set default 5,
  alter column low_stock_threshold set not null,
  alter column is_active set default true,
  alter column is_active set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.products drop constraint if exists products_stock_check;
alter table public.products drop constraint if exists products_stock_quantity_check;
alter table public.products drop constraint if exists products_low_stock_threshold_check;

alter table public.products
  add constraint products_stock_check check (stock >= 0),
  add constraint products_stock_quantity_check check (stock_quantity >= 0),
  add constraint products_low_stock_threshold_check check (low_stock_threshold >= 0);

create index if not exists products_stock_quantity_idx on public.products(stock_quantity);
create index if not exists products_low_stock_threshold_idx on public.products(low_stock_threshold);

create or replace function public.sync_product_inventory_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.stock_quantity := coalesce(new.stock_quantity, new.stock, 0);
  elsif new.stock_quantity is distinct from old.stock_quantity then
    new.stock_quantity := coalesce(new.stock_quantity, 0);
  elsif new.stock is distinct from old.stock then
    new.stock_quantity := coalesce(new.stock, 0);
  else
    new.stock_quantity := coalesce(new.stock_quantity, new.stock, 0);
  end if;

  if new.stock_quantity < 0 then
    raise exception 'Product stock cannot be negative.';
  end if;

  new.stock := new.stock_quantity;
  new.low_stock_threshold := greatest(0, coalesce(new.low_stock_threshold, 5));
  new.is_active := coalesce(new.is_active, true);
  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists sync_product_inventory_columns_before_write on public.products;
create trigger sync_product_inventory_columns_before_write
  before insert or update on public.products
  for each row
  execute function public.sync_product_inventory_columns();

create or replace function public.decrement_product_stock(
  p_product_slug text,
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

  update public.products
  set stock_quantity = stock_quantity - p_quantity,
      stock = stock_quantity - p_quantity,
      updated_at = now()
  where slug = p_product_slug
    and is_active = true
    and stock_quantity >= p_quantity
  returning stock_quantity into next_stock;

  if next_stock is null then
    raise exception 'Insufficient stock for product %.', p_product_slug;
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
  ('flame', 'Flame', 'Versace Eros', 'Men', 650, 1150, 24, 24, 5, '/products/flame.png', true),
  ('rosee', 'Rosee', 'Miss Dior', 'Women', 620, 1100, 31, 31, 5, '/products/rosee.png', true),
  ('velour', 'Velour', 'Yves Saint Laurent Libre', 'Women', 700, 1250, 18, 18, 5, '/products/velour.png', true),
  ('poseidon', 'Poseidon', 'Acqua di Gio Profumo', 'Men', 680, 1200, 27, 27, 5, '/products/poseidon.png', true),
  ('sera', 'Sera', 'Maison Francis Kurkdjian Baccarat Rouge 540', 'Unisex', 780, 1400, 15, 15, 5, '/products/sera.png', true)
on conflict (slug) do update
set name = excluded.name,
    inspired_by = excluded.inspired_by,
    gender = excluded.gender,
    size_15ml_price = excluded.size_15ml_price,
    size_30ml_price = excluded.size_30ml_price,
    image = excluded.image,
    low_stock_threshold = coalesce(public.products.low_stock_threshold, excluded.low_stock_threshold),
    is_active = coalesce(public.products.is_active, true),
    updated_at = now();
