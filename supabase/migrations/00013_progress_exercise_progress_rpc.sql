create or replace function public.get_progress_exercise_progress(
  period_since timestamptz default null,
  client_timezone text default 'UTC'
)
returns json
language sql
stable
security invoker
set search_path = ''
as $$
with filtered_sets as (
  select
    s.exercise_id,
    coalesce(e.name, 'Невідома') as exercise_name,
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
    round(sum(fs.weight * fs.reps))::int as total_volume,
    round(max(case when fs.reps = 1 then fs.weight else fs.weight * (1 + fs.reps / 30.0) end)::numeric, 1) as estimated_1rm
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
  having count(*) >= 2
  order by training_days desc, des.exercise_name asc
  limit 10
)
select coalesce(
  json_agg(
    json_build_object(
      'exerciseId', re.exercise_id,
      'exerciseName', re.exercise_name,
      'data', (
        select coalesce(
          json_agg(
            json_build_object(
              'date', des.local_date,
              'bestWeight', des.best_weight,
              'totalVolume', des.total_volume,
              'estimated1RM', des.estimated_1rm
            )
            order by des.local_date asc
          ),
          '[]'::json
        )
        from daily_exercise_stats des
        where des.exercise_id = re.exercise_id
      )
    )
    order by re.training_days desc, re.exercise_name asc
  ),
  '[]'::json
)
from ranked_exercises re;
$$;