-- Phase 5: persist guest checkout orders in Supabase.
create extension if not exists pgcrypto;

-- The customers table already exists; these columns support the checkout form.
alter table public.customers
  add column if not exists name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists delivery_address text,
  add column if not exists district text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_address text not null,
  district text not null,
  notes text,
  status text not null default 'pending',
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  delivery_charge numeric(12, 2) not null check (delivery_charge >= 0),
  grand_total numeric(12, 2) not null check (grand_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Allow guest checkout order inserts" on public.orders;
drop policy if exists "Allow guest order confirmation reads" on public.orders;

create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_order_number_idx on public.orders(order_number);
