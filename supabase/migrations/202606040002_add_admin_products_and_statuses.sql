-- Phase 7: admin dashboard persistence shape.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'payment_verification', 'processing', 'shipped', 'delivered', 'cancelled', 'confirmed', 'completed'));

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  inspired_by text not null,
  gender text not null check (gender in ('Men', 'Women', 'Unisex')),
  size_15ml_price numeric(12, 2) not null default 0,
  size_30ml_price numeric(12, 2) not null default 0,
  stock integer not null default 0 check (stock >= 0),
  image text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
create index if not exists products_slug_idx on public.products(slug);
create index if not exists products_stock_idx on public.products(stock);
create index if not exists orders_status_idx on public.orders(status);
