-- Phase 12: use the existing profiles table for Supabase Auth admin roles.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.profiles
set role = 'customer'
where role is null;

alter table public.profiles
  alter column role set default 'customer',
  alter column role set not null;

comment on column public.profiles.role is
  'Application role used by server-side admin authorization. Admin users require role = admin.';

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at_before_write
  on public.profiles;
create trigger set_profiles_updated_at_before_write
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

create index if not exists profiles_role_idx
  on public.profiles(role);
