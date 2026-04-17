-- Таблиця для вподобаних вправ
create table public.favorite_exercises (
  user_id uuid references public.users not null default auth.uid(),
  exercise_id uuid references public.exercises not null,
  created_at timestamptz default now(),
  primary key (user_id, exercise_id)
);

alter table public.favorite_exercises enable row level security;

create policy "Бачити свої вподобані" on public.favorite_exercises
  for select using (auth.uid() = user_id);

create policy "Додавати вподобані" on public.favorite_exercises
  for insert with check (auth.uid() = user_id);

create policy "Видаляти вподобані" on public.favorite_exercises
  for delete using (auth.uid() = user_id);

-- RPC для підрахунку популярних вправ юзера (по кількості використань в sets)
create or replace function public.get_popular_exercises(lim int default 20)
returns table (
  exercise_id uuid,
  usage_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    s.exercise_id,
    count(distinct s.workout_id) as usage_count
  from public.sets s
  join public.workouts w on w.id = s.workout_id
  where w.user_id = auth.uid()
  group by s.exercise_id
  order by usage_count desc
  limit lim;
$$;

-- Індекс для швидкого підрахунку популярних вправ
create index idx_sets_exercise_workout on public.sets (exercise_id, workout_id);
