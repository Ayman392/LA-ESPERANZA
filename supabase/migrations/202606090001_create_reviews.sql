-- Phase 13: product reviews, verified purchase checks, and moderation.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text,
  rating integer not null check (rating between 1 and 5),
  review_text text not null,
  verified_purchase boolean not null default false,
  is_approved boolean not null default false,
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reviews_product_approved_created_idx
  on public.reviews(product_id, is_approved, created_at desc);
create index if not exists reviews_moderation_status_created_idx
  on public.reviews(moderation_status, created_at desc);
create index if not exists reviews_user_id_idx
  on public.reviews(user_id);

create or replace function public.set_reviews_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.is_approved := new.moderation_status = 'approved';
  return new;
end;
$$;

drop trigger if exists set_reviews_updated_at_before_write
  on public.reviews;
create trigger set_reviews_updated_at_before_write
before insert or update on public.reviews
for each row
execute function public.set_reviews_updated_at();

alter table public.reviews enable row level security;

revoke all on table public.reviews from anon, authenticated;
grant select (
  id,
  product_id,
  customer_name,
  rating,
  review_text,
  verified_purchase,
  is_approved,
  moderation_status,
  created_at,
  updated_at
) on public.reviews to anon, authenticated;
grant insert (
  product_id,
  user_id,
  customer_name,
  customer_email,
  rating,
  review_text,
  verified_purchase,
  is_approved,
  moderation_status
) on public.reviews to authenticated;
grant update (
  is_approved,
  moderation_status,
  updated_at
) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

grant execute on function public.is_admin()
  to authenticated, service_role;

drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews"
on public.reviews
for select
to anon, authenticated
using (is_approved = true and moderation_status = 'approved');

drop policy if exists "Authenticated users can create reviews" on public.reviews;
create policy "Authenticated users can create reviews"
on public.reviews
for insert
to authenticated
with check (
  user_id = auth.uid()
  and verified_purchase = false
  and is_approved = false
  and moderation_status = 'pending'
);

drop policy if exists "Admins can moderate reviews" on public.reviews;
create policy "Admins can moderate reviews"
on public.reviews
for all
to authenticated
using (
  (select public.is_admin())
)
with check (
  (select public.is_admin())
);

create or replace function public.get_product_review_summary(
  p_product_id uuid
)
returns table (
  average_rating numeric,
  total_reviews bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(round(avg(reviews.rating)::numeric, 1), 0) as average_rating,
    count(*) as total_reviews
  from public.reviews
  where reviews.product_id = p_product_id
    and reviews.is_approved = true
    and reviews.moderation_status = 'approved';
$$;

grant execute on function public.get_product_review_summary(uuid)
  to anon, authenticated, service_role;
