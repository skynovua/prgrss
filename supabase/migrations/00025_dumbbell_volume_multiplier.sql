create or replace function public.calculate_set_volume(
  weight numeric,
  reps integer,
  equipment text default null
)
returns numeric
language sql
immutable
security invoker
set search_path = ''
as $$
  select coalesce(weight, 0)
    * coalesce(reps, 0)
    * case when equipment = 'dumbbell' then 2 else 1 end;
$$;

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
    coalesce(sum(public.calculate_set_volume(s.weight, s.reps, e.equipment)), 0)::numeric as volume,
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
    coalesce(sum(public.calculate_set_volume(s.weight, s.reps, e.equipment)), 0)::numeric as volume
  from public.workouts w
  left join public.sets s on s.workout_id = w.id
  left join public.exercises e on e.id = s.exercise_id
  where w.user_id = auth.uid()
    and w.started_at >= now() - interval '7 days'
),
prev_week_stats as (
  select
    count(distinct w.id)::int as workouts,
    count(s.id)::int as sets,
    coalesce(sum(public.calculate_set_volume(s.weight, s.reps, e.equipment)), 0)::numeric as volume
  from public.workouts w
  left join public.sets s on s.workout_id = w.id
  left join public.exercises e on e.id = s.exercise_id
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
    coalesce(sum(public.calculate_set_volume(s.weight, s.reps, e.equipment)), 0)::int as volume,
    case
      when ltw.started_at is not null and ltw.finished_at is not null then
        round(extract(epoch from (ltw.finished_at - ltw.started_at)) / 60.0)::int
      else null
    end as duration,
    row_number() over (order by ltw.started_at desc nulls last) as position
  from last_two_workouts ltw
  left join public.sets s on s.workout_id = ltw.id
  left join public.exercises e on e.id = s.exercise_id
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
    round(sum(public.calculate_set_volume(s.weight, s.reps, e.equipment)))::int as volume
  from filtered_workouts fw
  join public.sets s on s.workout_id = fw.id
  left join public.exercises e on e.id = s.exercise_id
  group by coalesce(e.muscle_group, 'other')
  having sum(public.calculate_set_volume(s.weight, s.reps, e.equipment)) > 0
),
top_exercises as (
  select
    s.exercise_id,
    coalesce(e.name, 'Невідома') as exercise_name,
    round(sum(public.calculate_set_volume(s.weight, s.reps, e.equipment)))::int as volume,
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

create or replace function public.get_achievement_metrics()
returns public.achievement_metrics
language sql
stable
security invoker
set search_path = ''
as $$
  select (
    row(
      (
        select count(*)::int
        from public.workouts
        where user_id = auth.uid()
          and finished_at is not null
      ),
      (
        select count(*)::int
        from public.sets s
        join public.workouts w on w.id = s.workout_id
        where w.user_id = auth.uid()
          and w.finished_at is not null
      ),
      (
        select coalesce(sum(s.reps), 0)::int
        from public.sets s
        join public.workouts w on w.id = s.workout_id
        where w.user_id = auth.uid()
          and w.finished_at is not null
          and s.reps is not null
          and s.reps > 0
      ),
      (
        select coalesce(sum(public.calculate_set_volume(s.weight, s.reps, e.equipment)), 0)::numeric
        from public.sets s
        join public.workouts w on w.id = s.workout_id
        left join public.exercises e on e.id = s.exercise_id
        where w.user_id = auth.uid()
          and w.finished_at is not null
          and s.weight is not null
          and s.reps is not null
      ),
      (
        select count(distinct s.exercise_id)::int
        from public.sets s
        join public.workouts w on w.id = s.workout_id
        where w.user_id = auth.uid()
          and w.finished_at is not null
      ),
      (
        select count(distinct e.muscle_group)::int
        from public.sets s
        join public.workouts w on w.id = s.workout_id
        join public.exercises e on e.id = s.exercise_id
        where w.user_id = auth.uid()
          and w.finished_at is not null
          and e.muscle_group is not null
      ),
      (
        select coalesce(
          max(
            case
              when s.reps = 1 then s.weight
              else s.weight * (1.0 + s.reps / 30.0)
            end
          ),
          0
        )::numeric
        from public.sets s
        join public.workouts w on w.id = s.workout_id
        where w.user_id = auth.uid()
          and w.finished_at is not null
          and s.weight is not null
          and s.weight > 0
          and s.reps is not null
          and s.reps > 0
      ),
      (
        select coalesce(
          sum(
            greatest(
              extract(epoch from (w.finished_at - w.started_at)) / 3600.0,
              0
            )
          ),
          0
        )::numeric
        from public.workouts w
        where w.user_id = auth.uid()
          and w.finished_at is not null
          and w.started_at is not null
      ),
      (
        select coalesce(
          array_agg(started_at order by started_at desc),
          array[]::timestamptz[]
        )
        from public.workouts
        where user_id = auth.uid()
          and finished_at is not null
      )
    )::public.achievement_metrics
  );
$$;