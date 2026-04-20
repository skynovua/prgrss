-- RPC функція для обчислення метрик ачівок на стороні БД
-- Замість завантаження всіх workouts + sets на клієнт

create or replace function get_achievement_metrics()
returns json
language sql
stable
security invoker
set search_path = ''
as $$
  select json_build_object(
    'total_workouts', (
      select count(*)
      from public.workouts
      where user_id = auth.uid()
        and finished_at is not null
    ),
    'total_sets', (
      select count(*)
      from public.sets s
      join public.workouts w on w.id = s.workout_id
      where w.user_id = auth.uid()
        and w.finished_at is not null
    ),
    'total_volume', (
      select coalesce(sum(s.weight * s.reps), 0)
      from public.sets s
      join public.workouts w on w.id = s.workout_id
      where w.user_id = auth.uid()
        and w.finished_at is not null
        and s.weight is not null
        and s.reps is not null
    ),
    'unique_exercises', (
      select count(distinct s.exercise_id)
      from public.sets s
      join public.workouts w on w.id = s.workout_id
      where w.user_id = auth.uid()
        and w.finished_at is not null
    ),
    'best_1rm', (
      select coalesce(max(
        case
          when s.reps = 1 then s.weight
          else s.weight * (1.0 + s.reps / 30.0)
        end
      ), 0)
      from public.sets s
      join public.workouts w on w.id = s.workout_id
      where w.user_id = auth.uid()
        and w.finished_at is not null
        and s.weight is not null
        and s.weight > 0
        and s.reps is not null
        and s.reps > 0
    ),
    'workout_dates', (
      select coalesce(json_agg(started_at order by started_at desc), '[]'::json)
      from public.workouts
      where user_id = auth.uid()
        and finished_at is not null
    )
  );
$$;
