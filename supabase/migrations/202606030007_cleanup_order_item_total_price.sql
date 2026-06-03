-- Cleanup order item totals after aligning the checkout payload with the live schema.
-- total_price was null because earlier inserts populated line_total but omitted total_price.
alter table public.order_items
  add column if not exists line_total numeric(12, 2),
  add column if not exists total_price numeric(12, 2);

update public.order_items
set
  total_price = coalesce(total_price, line_total, unit_price * quantity, 0),
  line_total = coalesce(line_total, total_price, unit_price * quantity, 0)
where total_price is null
   or line_total is null;

update public.order_items
set
  total_price = unit_price * quantity,
  line_total = unit_price * quantity
where unit_price is not null
  and quantity is not null
  and (total_price <> unit_price * quantity or line_total <> unit_price * quantity);

create or replace function public.sync_order_item_totals()
returns trigger
language plpgsql
as $$
declare
  calculated_total numeric(12, 2);
begin
  calculated_total := coalesce(new.unit_price, 0) * coalesce(new.quantity, 0);
  new.line_total := calculated_total;
  new.total_price := calculated_total;
  return new;
end;
$$;

drop trigger if exists sync_order_item_totals_before_write on public.order_items;
create trigger sync_order_item_totals_before_write
  before insert or update of unit_price, quantity, line_total, total_price
  on public.order_items
  for each row
  execute function public.sync_order_item_totals();

alter table public.order_items alter column line_total set default 0;
alter table public.order_items alter column total_price set default 0;
alter table public.order_items alter column line_total set not null;
alter table public.order_items alter column total_price set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_total_price_not_negative_check'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_total_price_not_negative_check check (total_price >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_line_total_not_negative_check'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_line_total_not_negative_check check (line_total >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_total_price_matches_line_total_check'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_total_price_matches_line_total_check check (total_price = line_total);
  end if;
end $$;
