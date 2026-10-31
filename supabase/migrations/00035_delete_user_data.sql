-- Дані профілю видаляються разом із записом auth.users в одній транзакції.
alter table public.programs drop constraint programs_user_id_fkey;
alter table public.programs add constraint programs_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.workouts drop constraint workouts_user_id_fkey;
alter table public.workouts add constraint workouts_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.exercises drop constraint exercises_user_id_fkey;
alter table public.exercises add constraint exercises_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.body_measurements drop constraint body_measurements_user_id_fkey;
alter table public.body_measurements add constraint body_measurements_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.push_subscriptions drop constraint push_subscriptions_user_id_fkey;
alter table public.push_subscriptions add constraint push_subscriptions_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.reminders drop constraint reminders_user_id_fkey;
alter table public.reminders add constraint reminders_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.favorite_exercises drop constraint favorite_exercises_user_id_fkey;
alter table public.favorite_exercises add constraint favorite_exercises_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.user_achievement_states drop constraint user_achievement_states_user_id_fkey;
alter table public.user_achievement_states add constraint user_achievement_states_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

-- Уже виданий JWT може діяти до завершення строку, але видалений акаунт
-- більше не повинен створювати або змінювати файли.
alter policy "Користувач завантажує свій аватар" on storage.objects
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.users where id = auth.uid())
  );

alter policy "Користувач оновлює свій аватар" on storage.objects
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.users where id = auth.uid())
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.users where id = auth.uid())
  );

-- Функція доступна лише серверній Edge Function і захищає від запуску до міграції.
create or replace function public.account_deletion_ready()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) = 8
  from pg_catalog.pg_constraint c
  where c.contype = 'f'
    and c.confrelid = 'public.users'::regclass
    and c.confdeltype = 'c'
    and c.conname in (
      'programs_user_id_fkey', 'workouts_user_id_fkey', 'exercises_user_id_fkey',
      'body_measurements_user_id_fkey', 'push_subscriptions_user_id_fkey',
      'reminders_user_id_fkey', 'favorite_exercises_user_id_fkey',
      'user_achievement_states_user_id_fkey'
    );
$$;

revoke all on function public.account_deletion_ready() from public, anon, authenticated;
grant execute on function public.account_deletion_ready() to service_role;
