create or replace function public.get_dashboard_data()
returns json
language sql
stable
security invoker
set search_path = ''
as $$
with recent_workouts as (
  select
    w.id,
    w.name,
    w.started_at,
    w.finished_at,
    count(s.id)::int as sets_count,
    coalesce(sum(coalesce(s.weight, 0) * coalesce(s.reps, 0)), 0)::numeric as volume,
    array_remove(array_agg(distinct e.muscle_group), null) as muscle_groups,
    case
      when w.started_at is not null and w.finished_at is not null then
        round(extract(epoch from (w.finished_at - w.started_at)) / 60.0)::int
      else null
    end as duration
  from public.workouts w
  left join public.sets s on s.workout_id = w.id
  left join public.exercises e on e.id = s.exercise_id
  where w.user_id = auth.uid()
  group by w.id
  order by w.started_at desc nulls last
  limit 5
),
week_stats as (
  select json_build_object(
    'workouts', count(distinct w.id)::int,
    'sets', count(s.id)::int,
    'volume', coalesce(sum(coalesce(s.weight, 0) * coalesce(s.reps, 0)), 0)
  ) as data
  from public.workouts w
  left join public.sets s on s.workout_id = w.id
  where w.user_id = auth.uid()
    and w.started_at >= now() - interval '7 days'
),
prev_week_stats as (
  select json_build_object(
    'workouts', count(distinct w.id)::int,
    'sets', count(s.id)::int,
    'volume', coalesce(sum(coalesce(s.weight, 0) * coalesce(s.reps, 0)), 0)
  ) as data
  from public.workouts w
  left join public.sets s on s.workout_id = w.id
  where w.user_id = auth.uid()
    and w.started_at >= now() - interval '14 days'
    and w.started_at < now() - interval '7 days'
),
calendar_workouts as (
  select
    w.id,
    w.name,
    w.started_at,
    count(s.id)::int as sets_count
  from public.workouts w
  left join public.sets s on s.workout_id = w.id
  where w.user_id = auth.uid()
    and w.started_at >= date_trunc('month', now()) - interval '2 months'
  group by w.id
  order by w.started_at desc nulls last
),
profile as (
  select u.name, u.avatar_url
  from public.users u
  where u.id = auth.uid()
),
workout_weeks as (
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
)
select json_build_object(
  'profile', (
    select json_build_object(
      'avatarUrl', p.avatar_url,
      'displayName', p.name
    )
    from profile p
  ),
  'recentWorkouts', (
    select coalesce(
      json_agg(
        json_build_object(
          'id', rw.id,
          'name', rw.name,
          'started_at', rw.started_at,
          'setsCount', rw.sets_count,
          'volume', rw.volume,
          'muscleGroups', to_json(coalesce(rw.muscle_groups, '{}'::text[])),
          'duration', rw.duration
        )
        order by rw.started_at desc nulls last
      ),
      '[]'::json
    )
    from recent_workouts rw
  ),
  'weekStats', (select data from week_stats),
  'prevWeekStats', (select data from prev_week_stats),
  'calendarWorkouts', (
    select coalesce(
      json_agg(
        json_build_object(
          'id', cw.id,
          'name', cw.name,
          'started_at', cw.started_at,
          'setsCount', cw.sets_count
        )
        order by cw.started_at desc nulls last
      ),
      '[]'::json
    )
    from calendar_workouts cw
  ),
  'streak', (select value from recursive_streak)
);
$$;