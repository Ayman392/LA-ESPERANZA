-- Synchronize the live Supabase schema with the current checkout implementation.
-- This migration is intentionally comprehensive: it compares the server insert/select
-- payloads for customers, orders, order_items, and payments and adds every required
-- column in one schema pass for existing databases.
create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid()
);

alter table public.customers
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists delivery_address text,
  add column if not exists district text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.orders
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists order_number text,
  add column if not exists customer_id uuid,
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists customer_email text,
  add column if not exists delivery_address text,
  add column if not exists district text,
  add column if not exists notes text,
  add column if not exists status text not null default 'pending',
  add column if not exists subtotal numeric(12, 2) not null default 0,
  add column if not exists delivery_charge numeric(12, 2) not null default 0,
  add column if not exists grand_total numeric(12, 2) not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.order_items
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists order_id uuid,
  add column if not exists product_id text,
  add column if not exists product_slug text,
  add column if not exists product_name text,
  add column if not exists inspired_by text,
  add column if not exists size text,
  add column if not exists quantity integer not null default 1,
  add column if not exists unit_price numeric(12, 2) not null default 0,
  add column if not exists line_total numeric(12, 2) not null default 0,
  add column if not exists image text,
  add column if not exists created_at timestamptz not null default now();

alter table public.payments
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists order_id uuid,
  add column if not exists method text,
  add column if not exists status text not null default 'pending',
  add column if not exists amount numeric(12, 2) not null default 0,
  add column if not exists sender_number text,
  add column if not exists transaction_id text,
  add column if not exists created_at timestamptz not null default now();

alter table public.customers alter column id set default gen_random_uuid();
alter table public.orders alter column id set default gen_random_uuid();
alter table public.order_items alter column id set default gen_random_uuid();
alter table public.payments alter column id set default gen_random_uuid();
alter table public.orders alter column status set default 'pending';
alter table public.orders alter column subtotal set default 0;
alter table public.orders alter column delivery_charge set default 0;
alter table public.orders alter column grand_total set default 0;
alter table public.order_items alter column quantity set default 1;
alter table public.order_items alter column unit_price set default 0;
alter table public.order_items alter column line_total set default 0;
alter table public.payments alter column status set default 'pending';
alter table public.payments alter column amount set default 0;

update public.customers set id = gen_random_uuid() where id is null;
update public.orders set id = gen_random_uuid() where id is null;
update public.order_items set id = gen_random_uuid() where id is null;
update public.payments set id = gen_random_uuid() where id is null;

alter table public.customers alter column id set not null;
alter table public.orders alter column id set not null;
alter table public.order_items alter column id set not null;
alter table public.payments alter column id set not null;

alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

create unique index if not exists customers_id_idx on public.customers(id);
create unique index if not exists orders_id_idx on public.orders(id);
create unique index if not exists orders_order_number_idx on public.orders(order_number);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create unique index if not exists payments_order_id_idx on public.payments(order_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_customer_id_fkey'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_customer_id_fkey
      foreign key (customer_id) references public.customers(id) on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_order_id_fkey'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_order_id_fkey
      foreign key (order_id) references public.orders(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_order_id_fkey'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_order_id_fkey
      foreign key (order_id) references public.orders(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_status_check check (status in ('pending', 'confirmed', 'processing', 'completed', 'cancelled'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_size_check'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_size_check check (size in ('15ml', '30ml'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_method_check'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_method_check check (method in ('cod', 'bkash', 'nagad'));
  end if;
end $$;
