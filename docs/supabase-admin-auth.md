# Supabase Admin Authentication

The admin workspace uses Supabase Auth for identity and the existing
`public.profiles` table for role-based authorization.

## Create the first administrator

1. Apply all Supabase migrations.
2. Create the administrator in Supabase Dashboard under Authentication > Users.
3. Promote that Auth user with the SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'admin@example.com'
);
```

Replace `admin@example.com` with the actual administrator email.

If the profile row has not been created yet:

```sql
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (id) do update set role = excluded.role;
```

## Security model

- `/admin` redirects unauthenticated visitors to `/admin/login`.
- Supabase stores and refreshes the admin session in secure cookies.
- Every admin API route verifies the Supabase user and requires
  `profiles.role = 'admin'`.
- Missing profile rows are denied admin access.
- Role checks and privileged operations use `SUPABASE_SERVICE_ROLE_KEY` only
  in server code.
- Public storefront and guest checkout behavior are unchanged.
