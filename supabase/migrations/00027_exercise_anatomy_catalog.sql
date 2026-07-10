alter table public.exercises
  add column if not exists catalog_key text,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists exercises_catalog_key_unique
  on public.exercises (catalog_key)
  where catalog_key is not null;

create table if not exists public.anatomical_muscles (
  key text primary key,
  name text not null,
  muscle_group text not null check (muscle_group in ('chest', 'back', 'legs', 'shoulders', 'arms', 'core')),
  sort_order smallint not null check (sort_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anatomical_muscles enable row level security;

drop policy if exists "Authenticated users can read anatomical muscles" on public.anatomical_muscles;

create policy "Authenticated users can read anatomical muscles"
on public.anatomical_muscles
for select
to authenticated
using (is_active);

create table if not exists public.exercise_muscles (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  muscle_key text not null references public.anatomical_muscles(key),
  activation_score smallint not null check (activation_score between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (exercise_id, muscle_key)
);

create index if not exists exercise_muscles_muscle_key_idx
  on public.exercise_muscles (muscle_key, activation_score desc);

create index if not exists exercise_muscles_exercise_id_idx
  on public.exercise_muscles (exercise_id);

alter table public.exercise_muscles enable row level security;

drop policy if exists "Users can read available exercise muscles" on public.exercise_muscles;
drop policy if exists "Users can create own exercise muscles" on public.exercise_muscles;
drop policy if exists "Users can update own exercise muscles" on public.exercise_muscles;
drop policy if exists "Users can delete own exercise muscles" on public.exercise_muscles;

create policy "Users can read available exercise muscles"
on public.exercise_muscles
for select
to authenticated
using (
  exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and e.is_active
      and (e.user_id is null or e.user_id = (select auth.uid()))
  )
);

create policy "Users can create own exercise muscles"
on public.exercise_muscles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and e.user_id = (select auth.uid())
      and e.is_custom
  )
);

create policy "Users can update own exercise muscles"
on public.exercise_muscles
for update
to authenticated
using (
  exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and e.user_id = (select auth.uid())
      and e.is_custom
  )
)
with check (
  exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and e.user_id = (select auth.uid())
      and e.is_custom
  )
);

create policy "Users can delete own exercise muscles"
on public.exercise_muscles
for delete
to authenticated
using (
  exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and e.user_id = (select auth.uid())
      and e.is_custom
  )
);

create or replace function public.sync_exercise_muscle_group()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_exercise_id uuid := coalesce(new.exercise_id, old.exercise_id);
begin
  update public.exercises
  set muscle_group = (
    select am.muscle_group
    from public.exercise_muscles em
    join public.anatomical_muscles am on am.key = em.muscle_key
    where em.exercise_id = target_exercise_id
    order by em.activation_score desc, am.sort_order asc
    limit 1
  ),
  updated_at = now()
  where id = target_exercise_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists exercise_muscles_sync_group on public.exercise_muscles;

create trigger exercise_muscles_sync_group
after insert or update or delete on public.exercise_muscles
for each row execute function public.sync_exercise_muscle_group();
