-- Phase 5 security hardening:
-- Checkout writes now happen through Next.js API routes using the service role key.
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

drop policy if exists "Allow guest checkout order inserts" on public.orders;
drop policy if exists "Allow guest order confirmation reads" on public.orders;
drop policy if exists "Allow guest checkout item inserts" on public.order_items;
drop policy if exists "Allow guest order item reads" on public.order_items;
drop policy if exists "Allow guest checkout payment inserts" on public.payments;
drop policy if exists "Allow guest payment confirmation reads" on public.payments;
