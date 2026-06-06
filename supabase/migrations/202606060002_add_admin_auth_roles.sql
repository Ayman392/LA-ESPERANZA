-- Phase 12: explicit Supabase Auth roles for administrator access.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Explicit allowlist of Supabase Auth users permitted to access administration.';

alter table public.admin_users enable row level security;
alter table public.admin_users force row level security;

-- Role checks run only through the server-side service client.
revoke all on table public.admin_users from anon, authenticated;
grant all on table public.admin_users to service_role;

create or replace function public.set_admin_users_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_admin_users_updated_at_before_write
  on public.admin_users;
create trigger set_admin_users_updated_at_before_write
before update on public.admin_users
for each row
execute function public.set_admin_users_updated_at();

create index if not exists admin_users_role_idx
  on public.admin_users(role);
