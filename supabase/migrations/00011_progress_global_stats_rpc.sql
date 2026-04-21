create or replace function public.get_progress_global_stats()
returns json
language sql
stable
security invoker
set search_path = ''
as $$
with workout_weeks as (
  select distinct date_trunc('week', w.started_at)::date as week_start
  from public.workouts w
  where w.user_id = auth.uid()
    and w.finished_at is not null
    and w.started_at is not null
),
anchor_week as (
  select case
    when exists (
      select 1
      from workout_weeks ww
      where ww.week_start = date_trunc('week', now())::date
    ) then date_trunc('week', now())::date
    else (date_trunc('week', now()) - interval '1 week')::date
  end as week_start
),
recursive_streak as (
  with recursive streak_chain as (
    select aw.week_start, 1 as streak
    from anchor_week aw
    where exists (
      select 1
      from workout_weeks ww
      where ww.week_start = aw.week_start
    )

    union all

    select (sc.week_start - interval '1 week')::date, sc.streak + 1
    from streak_chain sc
    where exists (
      select 1
      from workout_weeks ww
      where ww.week_start = (sc.week_start - interval '1 week')::date
    )
  )
  select coalesce(max(streak), 0)::int as value
  from streak_chain
),
last_two_workouts as (
  select w.id, w.started_at, w.finished_at
  from public.workouts w
  where w.user_id = auth.uid()
    and w.finished_at is not null
  order by w.started_at desc nulls last
  limit 2
),
last_two_stats as (
  select
    ltw.id,
    ltw.started_at,
    count(s.id)::int as set_count,
    coalesce(sum(coalesce(s.weight, 0) * coalesce(s.reps, 0)), 0)::int as volume,
    case
      when ltw.started_at is not null and ltw.finished_at is not null then
        round(extract(epoch from (ltw.finished_at - ltw.started_at)) / 60.0)::int
      else null
    end as duration,
    row_number() over (order by ltw.started_at desc nulls last) as position
  from last_two_workouts ltw
  left join public.sets s on s.workout_id = ltw.id
  group by ltw.id, ltw.started_at, ltw.finished_at
),
last_comparison as (
  select json_build_object(
    'lastDate', current_workout.started_at,
    'lastVolume', current_workout.volume,
    'lastSets', current_workout.set_count,
    'lastDuration', current_workout.duration,
    'prevVolume', previous_workout.volume,
    'prevSets', previous_workout.set_count,
    'volumeDiff', case
      when previous_workout.id is null then null
      else current_workout.volume - previous_workout.volume
    end,
    'setsDiff', case
      when previous_workout.id is null then null
      else current_workout.set_count - previous_workout.set_count
    end
  ) as data
  from last_two_stats current_workout
  left join last_two_stats previous_workout on previous_workout.position = 2
  where current_workout.position = 1
)
select json_build_object(
  'streak', (select value from recursive_streak),
  'lastComparison', (select data from last_comparison)
);
$$;