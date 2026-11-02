create policy "avatar_insert_propio" on storage.objects
for insert with check (
  bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "avatar_select_publico" on storage.objects
for select using (bucket_id = 'avatares');