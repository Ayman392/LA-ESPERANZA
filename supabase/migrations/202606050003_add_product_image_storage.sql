-- Phase 10: product image storage with public reads and admin-only server uploads.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.products
  add column if not exists image_url text,
  add column if not exists image_path text;

update public.products
set image_url = coalesce(image_url, image)
where image_url is null;

create index if not exists products_image_path_idx on public.products(image_path);

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
on storage.objects
for select
to public
using (bucket_id = 'product-images');
