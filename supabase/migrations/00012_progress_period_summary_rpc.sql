create or replace function public.get_progress_period_summary(period_since timestamptz default null)
returns json
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
  select json_build_object(
    'totalWorkouts', count(*)::int,
    'avgDuration',
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
      end
  ) as data
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
select json_build_object(
  'stats', (select data from period_stats),
  'muscleTonnage', (
    select coalesce(
      json_agg(
        json_build_object(
          'muscleGroup', mt.muscle_group,
          'label', mt.label,
          'volume', mt.volume
        )
        order by mt.volume desc, mt.label asc
      ),
      '[]'::json
    )
    from muscle_tonnage mt
  ),
  'topExercises', (
    select coalesce(
      json_agg(
        json_build_object(
          'exerciseId', te.exercise_id,
          'exerciseName', te.exercise_name,
          'volume', te.volume,
          'sets', te.sets
        )
        order by te.volume desc, te.sets desc, te.exercise_name asc
      ),
      '[]'::json
    )
    from top_exercises te
  )
);
$$;