create or replace function public.get_achievements()
returns table (
  id text,
  family_key text,
  slug text,
  title text,
  description text,
  tier text,
  progress double precision,
  current double precision,
  target integer,
  unlocked boolean,
  unlocked_at timestamptz,
  seen_at timestamptz
)
language sql
volatile
security invoker
set search_path = ''
as $$
  with recursive
  metrics as (
    select (public.get_achievement_metrics()).*
  ),
  workout_weeks as (
    select distinct date_trunc('week', workout_date at time zone 'UTC')::date as week_start
    from metrics m
    cross join unnest(coalesce(m.workout_dates, array[]::timestamptz[])) as workout_date
  ),
  reference_week as (
    select case
      when exists (
        select 1
        from workout_weeks
        where week_start = date_trunc('week', timezone('UTC', now()))::date
      )
        then date_trunc('week', timezone('UTC', now()))::date
      else (date_trunc('week', timezone('UTC', now())) - interval '1 week')::date
    end as week_start
  ),
  streak_weeks as (
    select rw.week_start, 1 as streak_count
    from reference_week rw
    where exists (
      select 1
      from workout_weeks ww
      where ww.week_start = rw.week_start
    )

    union all

    select (sw.week_start - interval '1 week')::date, sw.streak_count + 1
    from streak_weeks sw
    where exists (
      select 1
      from workout_weeks ww
      where ww.week_start = (sw.week_start - interval '1 week')::date
    )
  ),
  streak as (
    select coalesce(max(streak_count), 0)::int as total
    from streak_weeks
  ),
  values_map as (
    select 'workouts'::text as metric_key, coalesce(m.total_workouts, 0)::double precision as current
    from metrics m

    union all

    select 'streak', coalesce(s.total, 0)::double precision
    from streak s

    union all

    select 'volume', coalesce(m.total_volume, 0)::double precision
    from metrics m

    union all

    select 'sets', coalesce(m.total_sets, 0)::double precision
    from metrics m

    union all

    select 'exercises', coalesce(m.unique_exercises, 0)::double precision
    from metrics m

    union all

    select '1rm', coalesce(round(m.best_1rm), 0)::double precision
    from metrics m

    union all

    select 'reps', coalesce(m.total_reps, 0)::double precision
    from metrics m

    union all

    select 'duration', coalesce(floor(m.total_duration_hours), 0)::double precision
    from metrics m

    union all

    select 'balance', coalesce(m.distinct_muscle_groups, 0)::double precision
    from metrics m
  ),
  defs as (
    select
      d.id,
      d.family_key,
      f.slug,
      f.title,
      f.sort_order,
      d.metric_key,
      d.description_template,
      d.tier,
      d.target,
      d.tier_order
    from public.achievement_definitions d
    join public.achievement_families f on f.key = d.family_key
    where d.is_active
      and f.is_active
  ),
  resolved as (
    select
      d.id,
      d.family_key,
      d.slug,
      d.title,
      replace(
        d.description_template,
        '{target}',
        case
          when d.target >= 1000 then concat(round(d.target::numeric / 1000, 0)::int, 'k')
          else d.target::text
        end
      ) as description,
      d.tier,
      least(vm.current / nullif(d.target::double precision, 0), 1) as progress,
      vm.current,
      d.target,
      vm.current >= d.target as unlocked,
      d.sort_order,
      d.tier_order
    from defs d
    join values_map vm on vm.metric_key = d.metric_key
  ),
  inserted_states as (
    insert into public.user_achievement_states (user_id, achievement_id)
    select auth.uid(), r.id
    from resolved r
    where auth.uid() is not null
      and r.unlocked
    on conflict (user_id, achievement_id) do nothing
    returning achievement_id, unlocked_at, seen_at
  ),
  state_rows as (
    select
      uas.achievement_id,
      uas.unlocked_at,
      uas.seen_at
    from public.user_achievement_states uas
    where uas.user_id = auth.uid()

    union all

    select
      inserted_states.achievement_id,
      inserted_states.unlocked_at,
      inserted_states.seen_at
    from inserted_states
  )
  select
    r.id,
    r.family_key,
    r.slug,
    r.title,
    r.description,
    r.tier,
    r.progress,
    r.current,
    r.target,
    r.unlocked,
    state_rows.unlocked_at,
    state_rows.seen_at
  from resolved r
  left join state_rows
    on state_rows.achievement_id = r.id
  order by r.sort_order, r.tier_order;
$$;