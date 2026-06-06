# Supabase Admin Authentication

The admin workspace uses Supabase Auth for identity and `public.admin_users`
as an explicit administrator allowlist.

## Create the first administrator

1. Apply all Supabase migrations.
2. Create the administrator in Supabase Dashboard under Authentication > Users.
3. Promote that Auth user with the SQL editor:

```sql
insert into public.admin_users (user_id, role)
select id, 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do update set role = excluded.role;
```

Replace `admin@example.com` with the actual administrator email.

## Security model

- `/admin` redirects unauthenticated visitors to `/admin/login`.
- Supabase stores and refreshes the admin session in secure cookies.
- Every admin API route verifies the Supabase user and the `admin` role.
- The role table is inaccessible to `anon` and `authenticated` database roles.
- Role checks and privileged operations use `SUPABASE_SERVICE_ROLE_KEY` only
  in server code.
- Public storefront and guest checkout behavior are unchanged.
