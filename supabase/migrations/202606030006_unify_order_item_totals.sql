-- Unify order item pricing with the current checkout payload.
-- The app now writes both line_total and total_price from the same calculated value.
alter table public.order_items
  add column if not exists line_total numeric(12, 2),
  add column if not exists total_price numeric(12, 2);

update public.order_items
set
  line_total = coalesce(line_total, total_price, unit_price * quantity, 0),
  total_price = coalesce(total_price, line_total, unit_price * quantity, 0)
where line_total is null
   or total_price is null;

alter table public.order_items alter column line_total set default 0;
alter table public.order_items alter column total_price set default 0;
alter table public.order_items alter column line_total set not null;
alter table public.order_items alter column total_price set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_line_total_check'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_line_total_check check (line_total >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_total_price_check'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_total_price_check check (total_price >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_totals_match_check'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_totals_match_check check (line_total = total_price);
  end if;
end $$;
