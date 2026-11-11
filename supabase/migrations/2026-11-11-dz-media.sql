-- 사진 · 영상 동기화 저장소 (11-11). 테스트 서버에는 이미 넣었어요. 운영 서버를 만들 때 SQL Editor에서 한 번 실행해요.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dz-media', 'dz-media', false, 20971520, array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'])
on conflict (id) do nothing;
create policy "dz media read own" on storage.objects for select to authenticated
  using (bucket_id = 'dz-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "dz media add own" on storage.objects for insert to authenticated
  with check (bucket_id = 'dz-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "dz media remove own" on storage.objects for delete to authenticated
  using (bucket_id = 'dz-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
