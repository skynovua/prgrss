do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'progress_last_workout_comparison'
  ) then
    create type public.progress_last_workout_comparison as (
      last_date timestamptz,
      last_volume integer,
      last_sets integer,
      last_duration integer,
      prev_volume integer,
      prev_sets integer,
      volume_diff integer,
      sets_diff integer
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'progress_global_stats'
  ) then
    create type public.progress_global_stats as (
      streak integer,
      last_comparison public.progress_last_workout_comparison
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'progress_period_stats'
  ) then
    create type public.progress_period_stats as (
      total_workouts integer,
      avg_duration integer
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'progress_muscle_tonnage'
  ) then
    create type public.progress_muscle_tonnage as (
      muscle_group text,
      label text,
      volume integer
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'progress_top_exercise'
  ) then
    create type public.progress_top_exercise as (
      exercise_id uuid,
      exercise_name text,
      volume integer,
      sets integer
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'progress_period_summary'
  ) then
    create type public.progress_period_summary as (
      stats public.progress_period_stats,
      muscle_tonnage public.progress_muscle_tonnage[],
      top_exercises public.progress_top_exercise[]
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'progress_exercise_progress_point'
  ) then
    create type public.progress_exercise_progress_point as (
      date date,
      best_weight numeric,
      total_volume integer,
      estimated_1rm numeric
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'progress_exercise_progress_entry'
  ) then
    create type public.progress_exercise_progress_entry as (
      exercise_id uuid,
      exercise_name text,
      data public.progress_exercise_progress_point[]
    );
  end if;
end
$$;

drop function if exists public.get_progress_global_stats();

create or replace function public.get_progress_global_stats()
returns public.progress_global_stats
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
  select
    current_workout.started_at as last_date,
    current_workout.volume as last_volume,
    current_workout.set_count as last_sets,
    current_workout.duration as last_duration,
    previous_workout.volume as prev_volume,
    previous_workout.set_count as prev_sets,
    case
      when previous_workout.id is null then null
      else current_workout.volume - previous_workout.volume
    end as volume_diff,
    case
      when previous_workout.id is null then null
      else current_workout.set_count - previous_workout.set_count
    end as sets_diff
  from last_two_stats current_workout
  left join last_two_stats previous_workout on previous_workout.position = 2
  where current_workout.position = 1
)
select (
  row(
    (select value from recursive_streak),
    (
      select row(
        lc.last_date,
        lc.last_volume,
        lc.last_sets,
        lc.last_duration,
        lc.prev_volume,
        lc.prev_sets,
        lc.volume_diff,
        lc.sets_diff
      )::public.progress_last_workout_comparison
      from last_comparison lc
    )
  )::public.progress_global_stats
);
$$;

drop function if exists public.get_progress_period_summary(timestamptz);

create or replace function public.get_progress_period_summary(period_since timestamptz default null)
returns public.progress_period_summary
language sql
stable
security invoker
set search_path = ''
as $$
with filtered_workouts as (
  select w.id, w.started_at, w.finished_at
  from public.workouts w
  where w.user_id = auth.uid()
    and w.finished_at is not null
    and (period_since is null or w.started_at >= period_since)
),
period_stats as (
  select
    count(*)::int as total_workouts,
    case
      when count(*) filter (
        where fw.started_at is not null
          and fw.finished_at is not null
          and extract(epoch from (fw.finished_at - fw.started_at)) / 60.0 > 0
          and extract(epoch from (fw.finished_at - fw.started_at)) / 60.0 < 600
      ) = 0 then null
      else round(avg(extract(epoch from (fw.finished_at - fw.started_at)) / 60.0) filter (
        where fw.started_at is not null
          and fw.finished_at is not null
          and extract(epoch from (fw.finished_at - fw.started_at)) / 60.0 > 0
          and extract(epoch from (fw.finished_at - fw.started_at)) / 60.0 < 600
      ))::int
    end as avg_duration
  from filtered_workouts fw
),
muscle_tonnage as (
  select
    coalesce(e.muscle_group, 'other') as muscle_group,
    case coalesce(e.muscle_group, 'other')
      when 'chest' then 'Груди'
      when 'back' then 'Спина'
      when 'legs' then 'Ноги'
      when 'shoulders' then 'Плечі'
      when 'arms' then 'Руки'
      when 'core' then 'Кор'
      else coalesce(e.muscle_group, 'other')
    end as label,
    round(sum(coalesce(s.weight, 0) * coalesce(s.reps, 0)))::int as volume
  from filtered_workouts fw
  join public.sets s on s.workout_id = fw.id
  left join public.exercises e on e.id = s.exercise_id
  group by coalesce(e.muscle_group, 'other')
  having sum(coalesce(s.weight, 0) * coalesce(s.reps, 0)) > 0
),
top_exercises as (
  select
    s.exercise_id,
    coalesce(e.name, 'Невідома') as exercise_name,
    round(sum(coalesce(s.weight, 0) * coalesce(s.reps, 0)))::int as volume,
    count(*)::int as sets
  from filtered_workouts fw
  join public.sets s on s.workout_id = fw.id
  left join public.exercises e on e.id = s.exercise_id
  group by s.exercise_id, coalesce(e.name, 'Невідома')
  order by volume desc, sets desc, exercise_name asc
  limit 8
)
select (
  row(
    (
      select row(ps.total_workouts, ps.avg_duration)::public.progress_period_stats
      from period_stats ps
    ),
    (
      select coalesce(
        array_agg(
          ((mt.muscle_group, mt.label, mt.volume)::public.progress_muscle_tonnage)
          order by mt.volume desc, mt.label asc
        ),
        array[]::public.progress_muscle_tonnage[]
      )
      from muscle_tonnage mt
    ),
    (
      select coalesce(
        array_agg(
          ((te.exercise_id, te.exercise_name, te.volume, te.sets)::public.progress_top_exercise)
          order by te.volume desc, te.sets desc, te.exercise_name asc
        ),
        array[]::public.progress_top_exercise[]
      )
      from top_exercises te
    )
  )::public.progress_period_summary
);
$$;

drop function if exists public.get_progress_exercise_progress(timestamptz, text);

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
  having count(*) >= 2
  order by training_days desc, des.exercise_name asc
  limit 10
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