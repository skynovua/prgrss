-- Окрема вправа має показувати записи з першого дня, незалежно від рейтингу.
create or replace function public.get_progress_exercise_progress(
  period_since timestamptz default null,
  client_timezone text default 'UTC'
)
returns public.progress_exercise_progress_entry[]
language sql
stable
security invoker
set search_path = ''
as $$
with filtered_sets as (
  select
    s.exercise_id,
    coalesce(e.name, 'Невідома') as exercise_name,
    e.equipment,
    (w.started_at at time zone client_timezone)::date as local_date,
    s.weight,
    s.reps
  from public.sets s
  join public.workouts w on w.id = s.workout_id
  left join public.exercises e on e.id = s.exercise_id
  where w.user_id = auth.uid()
    and s.weight is not null
    and s.reps is not null
    and w.started_at is not null
    and (period_since is null or w.started_at >= period_since)
),
daily_exercise_stats as (
  select
    fs.exercise_id,
    fs.exercise_name,
    fs.local_date,
    max(fs.weight)::numeric as best_weight,
    round(sum(public.calculate_set_volume(fs.weight, fs.reps, fs.equipment)))::int as total_volume,
    round(
      max(case when fs.reps = 1 then fs.weight else fs.weight * (1 + fs.reps / 30.0) end)::numeric,
      1
    ) as estimated_1rm
  from filtered_sets fs
  group by fs.exercise_id, fs.exercise_name, fs.local_date
),
ranked_exercises as (
  select
    des.exercise_id,
    des.exercise_name,
    count(*)::int as training_days
  from daily_exercise_stats des
  group by des.exercise_id, des.exercise_name
  order by training_days desc, des.exercise_name asc
)
select coalesce(
  array_agg(
    (
      row(
        re.exercise_id,
        re.exercise_name,
        (
          select coalesce(
            array_agg(
              ((des.local_date, des.best_weight, des.total_volume, des.estimated_1rm)::public.progress_exercise_progress_point)
              order by des.local_date asc
            ),
            array[]::public.progress_exercise_progress_point[]
          )
          from daily_exercise_stats des
          where des.exercise_id = re.exercise_id
        )
      )::public.progress_exercise_progress_entry
    )
    order by re.training_days desc, re.exercise_name asc
  ),
  array[]::public.progress_exercise_progress_entry[]
)
from ranked_exercises re;
$$;

