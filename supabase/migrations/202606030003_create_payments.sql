create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null check (method in ('cod', 'bkash', 'nagad')),
  status text not null default 'pending',
  amount numeric(12, 2) not null check (amount >= 0),
  sender_number text,
  transaction_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists payments_order_id_idx on public.payments(order_id);

alter table public.payments enable row level security;

drop policy if exists "Allow guest checkout payment inserts" on public.payments;
create policy "Allow guest checkout payment inserts"
  on public.payments
  for insert
  to anon
  with check (true);

drop policy if exists "Allow guest payment confirmation reads" on public.payments;
create policy "Allow guest payment confirmation reads"
  on public.payments
  for select
  to anon
  using (true);
