create index if not exists idx_workouts_user_started_finished
on public.workouts (user_id, started_at desc)
where finished_at is not null;

create index if not exists idx_sets_workout_exercise
on public.sets (workout_id, exercise_id);