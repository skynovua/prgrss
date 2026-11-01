-- Запускати після міграцій; усі тестові дані відкочуються.
begin;

create temporary table test_workout_context as
select gen_random_uuid() as workout_id,
       gen_random_uuid() as exercise_id,
       (select id from public.users limit 1) as owner_id,
       (select key from public.anatomical_muscles where is_active limit 1) as muscle_key;
grant select on test_workout_context to authenticated;

do $$
begin
  if exists (select 1 from test_workout_context where owner_id is null or muscle_key is null) then
    raise exception 'Для перевірки потрібні користувач і м’яз';
  end if;
end;
$$;

insert into public.exercises (id, user_id, name, is_custom, is_active)
select exercise_id, owner_id, 'Тимчасова вправа', true, true from test_workout_context;
insert into public.exercise_muscles (exercise_id, muscle_key, activation_score)
select exercise_id, muscle_key, 10 from test_workout_context;
insert into public.workouts (id, user_id, started_at, finished_at, name)
select workout_id, owner_id, now() - interval '10 days',
       now() - interval '10 days' + interval '1 hour', 'Тимчасове тренування'
from test_workout_context;
insert into public.sets (workout_id, exercise_id, set_number, reps, weight)
select workout_id, exercise_id, 1, 8, 40 from test_workout_context;

select set_config('request.jwt.claim.sub', owner_id::text, true) from test_workout_context;
set local role authenticated;

do $$
declare
  ctx record;
  affected integer;
begin
  select * into ctx from test_workout_context;
  update public.exercises set is_active = false where id = ctx.exercise_id;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Не вдалося видалити свою вправу'; end if;
  if not exists (select 1 from public.exercise_muscles where exercise_id = ctx.exercise_id) then
    raise exception 'Втрачено анатомію видаленої вправи';
  end if;

  perform public.save_workout_with_sets(jsonb_build_object(
    'workout_id', ctx.workout_id,
    'started_at', now() - interval '10 days',
    'finished_at', now() - interval '10 days' + interval '1 hour',
    'name', 'Оновлено',
    'enforce_edit_window', true,
    'sets', jsonb_build_array(jsonb_build_object(
      'exercise_id', ctx.exercise_id, 'set_number', 1, 'reps', 9, 'weight', 45
    )),
    'exercise_order', jsonb_build_array(ctx.exercise_id)
  ));
  if not exists (
    select 1 from public.sets
    where workout_id = ctx.workout_id and exercise_id = ctx.exercise_id and reps = 9
  ) then raise exception 'Старе тренування не оновилося'; end if;

  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  update public.workouts set name = 'Чужий запис' where id = ctx.workout_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Доступне чуже тренування'; end if;
  delete from public.sets where workout_id = ctx.workout_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Доступні чужі підходи'; end if;
  if exists (select 1 from public.exercise_muscles where exercise_id = ctx.exercise_id) then
    raise exception 'Доступна анатомія чужої вправи';
  end if;

  perform set_config('request.jwt.claim.sub', ctx.owner_id::text, true);
  perform public.delete_workout_cascade(ctx.workout_id);
  if exists (select 1 from public.workouts where id = ctx.workout_id)
     or exists (select 1 from public.sets where workout_id = ctx.workout_id) then
    raise exception 'Не вдалося видалити старе тренування';
  end if;
end;
$$;

reset role;
rollback;
