begin;

-- Блокуємо записи до перевірки, щоб таблиці не змінилися до їх видалення.
lock table public.push_subscriptions, public.reminders in access exclusive mode;

-- Не видаляємо дані, які могли з'явитися після останньої перевірки production.
do $$
begin
  if exists (select 1 from public.push_subscriptions)
    or exists (select 1 from public.reminders) then
    raise exception 'Push-таблиці не порожні; перевір дані перед видаленням';
  end if;
end;
$$;

-- Перевірка видалення акаунта має враховувати шість таблиць, що залишилися.
create or replace function public.account_deletion_ready()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) = 6
  from pg_catalog.pg_constraint c
  where c.contype = 'f'
    and c.confrelid = 'public.users'::regclass
    and c.confdeltype = 'c'
    and c.conname in (
      'programs_user_id_fkey', 'workouts_user_id_fkey', 'exercises_user_id_fkey',
      'body_measurements_user_id_fkey', 'favorite_exercises_user_id_fkey',
      'user_achievement_states_user_id_fkey'
    );
$$;

drop table public.push_subscriptions;
drop table public.reminders;

commit;
