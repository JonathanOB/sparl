-- Documents storage (migration 006). Private bucket + RLS on storage.objects.
-- Path convention: documents/{household_id}/{document_id}. Household members can
-- read their own household's objects; writes happen server-side via the secret
-- key (bypasses RLS). D10 §11 — private bucket, signed-URL access only.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents', 'documents', false, 10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- Household-scoped read (for signed URLs / direct access). First path segment = household_id.
drop policy if exists documents_obj_select on storage.objects;
create policy documents_obj_select on storage.objects
  for select
  using (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1])::uuid in (select public.current_household_ids())
  );

-- Belt-and-braces write policies (server uses the secret key which bypasses these).
drop policy if exists documents_obj_insert on storage.objects;
create policy documents_obj_insert on storage.objects
  for insert
  with check (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1])::uuid in (select public.current_household_ids())
  );

drop policy if exists documents_obj_delete on storage.objects;
create policy documents_obj_delete on storage.objects
  for delete
  using (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1])::uuid in (select public.current_household_ids())
  );

commit;
