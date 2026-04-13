-- Створюємо Storage bucket для аватарок
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  array['image/jpeg', 'image/png', 'image/webp']
);

-- RLS для Storage: користувач може завантажувати тільки у свою папку
create policy "Користувач завантажує свій аватар"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Користувач оновлює свій аватар"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Користувач видаляє свій аватар"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Публічний доступ для читання аватарок
create policy "Аватари публічні для читання"
  on storage.objects for select
  using (bucket_id = 'avatars');
