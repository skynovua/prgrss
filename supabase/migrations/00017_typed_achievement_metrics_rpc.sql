do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'achievement_metrics'
  ) then
    create type public.achievement_metrics as (
      total_workouts integer,
      total_sets integer,
      total_volume numeric,
      unique_exercises integer,
      best_1rm numeric,
      workout_dates timestamptz[]
    );
  end if;
end
$$;

drop function if exists public.get_achievement_metrics();

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
        select coalesce(sum(s.weight * s.reps), 0)::numeric
        from public.sets s
        join public.workouts w on w.id = s.workout_id
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