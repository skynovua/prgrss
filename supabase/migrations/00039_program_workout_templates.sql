-- Шаблон тренування зберігається окремо від історії виконаних сесій.
alter table public.programs
  add column workout_template jsonb not null default '[]'::jsonb
  check (jsonb_typeof(workout_template) = 'array');

-- Видалення програми не повинно видаляти або блокувати історію тренувань.
alter table public.workouts drop constraint workouts_program_id_fkey;
alter table public.workouts add constraint workouts_program_id_fkey
  foreign key (program_id) references public.programs(id) on delete set null;
