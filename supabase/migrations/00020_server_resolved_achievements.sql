drop function if exists public.get_achievements();

create or replace function public.get_achievements()
returns table (
  id text,
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
  defs as (
    select *
    from (
      values
        ('workouts_bronze', 'workouts', 'Ритм', 'Завершіть {target} тренувань', 'bronze', 15, 1, 1),
        ('workouts_silver', 'workouts', 'Ритм', 'Завершіть {target} тренувань', 'silver', 40, 1, 2),
        ('workouts_gold', 'workouts', 'Ритм', 'Завершіть {target} тренувань', 'gold', 140, 1, 3),
        ('streak_bronze', 'streak', 'Без пауз', 'Тримайте ритм {target} тижнів поспіль', 'bronze', 5, 2, 1),
        ('streak_silver', 'streak', 'Без пауз', 'Тримайте ритм {target} тижнів поспіль', 'silver', 10, 2, 2),
        ('streak_gold', 'streak', 'Без пауз', 'Тримайте ритм {target} тижнів поспіль', 'gold', 20, 2, 3),
        ('volume_bronze', 'volume', 'Тонаж', 'Накопичте {target} кг загального тоннажу', 'bronze', 20000, 3, 1),
        ('volume_silver', 'volume', 'Тонаж', 'Накопичте {target} кг загального тоннажу', 'silver', 50000, 3, 2),
        ('volume_gold', 'volume', 'Тонаж', 'Накопичте {target} кг загального тоннажу', 'gold', 180000, 3, 3),
        ('sets_bronze', 'sets', 'Серії', 'Закрийте {target} підходів', 'bronze', 125, 4, 1),
        ('sets_silver', 'sets', 'Серії', 'Закрийте {target} підходів', 'silver', 320, 4, 2),
        ('sets_gold', 'sets', 'Серії', 'Закрийте {target} підходів', 'gold', 1200, 4, 3),
        ('exercises_bronze', 'exercises', 'Арсенал', 'Освойте {target} різних вправ', 'bronze', 15, 5, 1),
        ('exercises_silver', 'exercises', 'Арсенал', 'Освойте {target} різних вправ', 'silver', 28, 5, 2),
        ('exercises_gold', 'exercises', 'Арсенал', 'Освойте {target} різних вправ', 'gold', 45, 5, 3),
        ('1rm_bronze', '1rm', 'Пік сили', 'Досягніть 1RM у {target} кг в будь-якій вправі', 'bronze', 100, 6, 1),
        ('1rm_silver', '1rm', 'Пік сили', 'Досягніть 1RM у {target} кг в будь-якій вправі', 'silver', 130, 6, 2),
        ('1rm_gold', '1rm', 'Пік сили', 'Досягніть 1RM у {target} кг в будь-якій вправі', 'gold', 180, 6, 3),
        ('reps_bronze', 'reps', 'Повтори', 'Зробіть {target} повторень загалом', 'bronze', 1500, 7, 1),
        ('reps_silver', 'reps', 'Повтори', 'Зробіть {target} повторень загалом', 'silver', 4500, 7, 2),
        ('reps_gold', 'reps', 'Повтори', 'Зробіть {target} повторень загалом', 'gold', 16000, 7, 3),
        ('duration_bronze', 'duration', 'Години в залі', 'Проведіть {target} годин у тренуваннях', 'bronze', 12, 8, 1),
        ('duration_silver', 'duration', 'Години в залі', 'Проведіть {target} годин у тренуваннях', 'silver', 32, 8, 2),
        ('duration_gold', 'duration', 'Години в залі', 'Проведіть {target} годин у тренуваннях', 'gold', 110, 8, 3),
        ('balance_bronze', 'balance', 'Баланс', 'Охопіть {target} груп м''язів у своєму арсеналі', 'bronze', 4, 9, 1),
        ('balance_silver', 'balance', 'Баланс', 'Охопіть {target} груп м''язів у своєму арсеналі', 'silver', 5, 9, 2),
        ('balance_gold', 'balance', 'Баланс', 'Охопіть {target} груп м''язів у своєму арсеналі', 'gold', 6, 9, 3)
      ) as defs(id, metric_key, title, description_template, tier, target, family_order, tier_order)
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
  resolved as (
    select
      d.id,
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
      d.family_order,
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
    returning achievement_id
  )
  select
    r.id,
    r.title,
    r.description,
    r.tier,
    r.progress,
    r.current,
    r.target,
    r.unlocked,
    uas.unlocked_at,
    uas.seen_at
  from resolved r
  left join public.user_achievement_states uas
    on uas.user_id = auth.uid()
   and uas.achievement_id = r.id
  order by r.family_order, r.tier_order;
$$;