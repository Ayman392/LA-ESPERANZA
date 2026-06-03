-- Phase 6: manual bKash/Nagad verification layer.
alter table public.payments
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by text,
  add column if not exists rejection_reason text;

alter table public.payments alter column status set default 'pending_cod';

update public.payments
set status = case
  when method = 'cod' then 'pending_cod'
  when method in ('bkash', 'nagad') and status in ('pending', 'submitted') then 'verification_required'
  else status
end;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'payment_verification', 'confirmed', 'processing', 'completed', 'cancelled'));

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments
  add constraint payments_status_check
  check (status in ('pending_cod', 'verification_required', 'verified', 'rejected'));

create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_method_idx on public.payments(method);
create index if not exists payments_transaction_id_idx on public.payments(transaction_id);
