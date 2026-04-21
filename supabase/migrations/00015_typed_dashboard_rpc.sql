do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'dashboard_profile'
  ) then
    create type public.dashboard_profile as (
      avatar_url text,
      display_name text
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'dashboard_week_stats'
  ) then
    create type public.dashboard_week_stats as (
      workouts integer,
      sets integer,
      volume numeric
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'dashboard_recent_workout'
  ) then
    create type public.dashboard_recent_workout as (
      id uuid,
      name text,
      started_at timestamptz,
      sets_count integer,
      volume numeric,
      muscle_groups text[],
      duration integer
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'dashboard_calendar_workout'
  ) then
    create type public.dashboard_calendar_workout as (
      id uuid,
      name text,
      started_at timestamptz,
      sets_count integer
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'dashboard_data'
  ) then
    create type public.dashboard_data as (
      profile public.dashboard_profile,
      recent_workouts public.dashboard_recent_workout[],
      week_stats public.dashboard_week_stats,
      prev_week_stats public.dashboard_week_stats,
      calendar_workouts public.dashboard_calendar_workout[],
      streak integer
    );
  end if;
end
$$;

drop function if exists public.get_dashboard_data();

create or replace function public.get_dashboard_data()
returns public.dashboard_data
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
  select
    count(distinct w.id)::int as workouts,
    count(s.id)::int as sets,
    coalesce(sum(coalesce(s.weight, 0) * coalesce(s.reps, 0)), 0)::numeric as volume
  from public.workouts w
  left join public.sets s on s.workout_id = w.id
  where w.user_id = auth.uid()
    and w.started_at >= now() - interval '7 days'
),
prev_week_stats as (
  select
    count(distinct w.id)::int as workouts,
    count(s.id)::int as sets,
    coalesce(sum(coalesce(s.weight, 0) * coalesce(s.reps, 0)), 0)::numeric as volume
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
select (
  row(
    (
      select row(p.avatar_url, p.name)::public.dashboard_profile
      from profile p
    ),
    (
      select coalesce(
        array_agg(
          ((rw.id, rw.name, rw.started_at, rw.sets_count, rw.volume, coalesce(rw.muscle_groups, '{}'::text[]), rw.duration)::public.dashboard_recent_workout)
          order by rw.started_at desc nulls last
        ),
        array[]::public.dashboard_recent_workout[]
      )
      from recent_workouts rw
    ),
    (
      select row(ws.workouts, ws.sets, ws.volume)::public.dashboard_week_stats
      from week_stats ws
    ),
    (
      select row(pws.workouts, pws.sets, pws.volume)::public.dashboard_week_stats
      from prev_week_stats pws
    ),
    (
      select coalesce(
        array_agg(
          ((cw.id, cw.name, cw.started_at, cw.sets_count)::public.dashboard_calendar_workout)
          order by cw.started_at desc nulls last
        ),
        array[]::public.dashboard_calendar_workout[]
      )
      from calendar_workouts cw
    ),
    (select value from recursive_streak)
  )::public.dashboard_data
);
$$;