-- Користувач може змінювати й видаляти свої тренування незалежно від дати.
drop policy if exists "Користувач оновлює свої тренування (24 год)" on public.workouts;
create policy "Користувач оновлює свої тренування" on public.workouts
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Користувач видаляє свої тренування (24 год)" on public.workouts;
create policy "Користувач видаляє свої тренування" on public.workouts
  for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Користувач видаляє підходи (24 год)" on public.sets;
create policy "Користувач видаляє свої підходи" on public.sets
  for delete to authenticated
  using (exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = (select auth.uid())
  ));

-- Анатомічна розмітка видалених власних вправ залишається в історії.
drop policy if exists "Users can read available exercise muscles" on public.exercise_muscles;
create policy "Users can read available exercise muscles" on public.exercise_muscles
  for select to authenticated
  using (exists (
    select 1 from public.exercises e
    where e.id = exercise_id
      and (e.user_id = (select auth.uid()) or (e.user_id is null and e.is_active))
  ));

-- Ігноруємо застарілий enforce_edit_window і для вже встановлених клієнтів.
create or replace function public.save_workout_with_sets(payload jsonb)
returns table (
  workout_id uuid,
  sets_count integer,
  saved_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_workout_id uuid;
  existing_workout public.workouts%rowtype;
  target_started_at timestamptz;
  target_finished_at timestamptz;
  target_name text;
  target_notes text;
  target_program_id uuid;
  normalized_sets jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if payload is null then
    raise exception 'Payload is required';
  end if;

  target_workout_id := nullif(payload->>'workout_id', '')::uuid;
  target_started_at := nullif(payload->>'started_at', '')::timestamptz;
  target_finished_at := nullif(payload->>'finished_at', '')::timestamptz;
  target_name := nullif(payload->>'name', '');
  target_notes := payload->>'notes';
  target_program_id := nullif(payload->>'program_id', '')::uuid;
  normalized_sets := coalesce(payload->'sets', '[]'::jsonb);

  if jsonb_typeof(normalized_sets) <> 'array' then
    raise exception 'Payload sets must be an array';
  end if;

  if target_workout_id is null then
    insert into public.workouts (
      id,
      started_at,
      finished_at,
      name,
      notes,
      program_id,
      user_id
    )
    values (
      gen_random_uuid(),
      target_started_at,
      target_finished_at,
      target_name,
      target_notes,
      target_program_id,
      auth.uid()
    )
    returning * into existing_workout;

    target_workout_id := existing_workout.id;
  else
    select *
    into existing_workout
    from public.workouts
    where id = target_workout_id
      and user_id = auth.uid()
    for update;

    if not found then
      insert into public.workouts (
        id,
        started_at,
        finished_at,
        name,
        notes,
        program_id,
        user_id
      )
      values (
        target_workout_id,
        target_started_at,
        target_finished_at,
        target_name,
        target_notes,
        target_program_id,
        auth.uid()
      )
      returning * into existing_workout;
    else
      update public.workouts
      set
        started_at = target_started_at,
        finished_at = target_finished_at,
        name = target_name,
        notes = target_notes,
        program_id = target_program_id
      where id = target_workout_id;
    end if;
  end if;

  delete from public.sets as sets_to_delete
  where sets_to_delete.workout_id = target_workout_id;

  workout_id := target_workout_id;
  sets_count := jsonb_array_length(normalized_sets);
  saved_at := now();

  insert into public.sets (
    workout_id,
    exercise_id,
    set_number,
    reps,
    weight,
    rpe,
    duration_s,
    notes
  )
  select
    target_workout_id,
    record.exercise_id,
    record.set_number,
    record.reps,
    record.weight,
    record.rpe,
    record.duration_s,
    record.notes
  from jsonb_to_recordset(normalized_sets) as record(
    exercise_id uuid,
    set_number integer,
    reps integer,
    weight numeric,
    rpe numeric,
    duration_s integer,
    notes text
  );

  -- Старі клієнти можуть не передавати порядок; їхні запити залишаються сумісними.
  if payload ? 'exercise_order' then
    if jsonb_typeof(payload->'exercise_order') <> 'array' then
      raise exception 'Payload exercise_order must be an array';
    end if;

    update public.workouts
    set exercise_order = array(
      select value::uuid
      from jsonb_array_elements_text(payload->'exercise_order') with ordinality as item(value, position)
      order by position
    )
    where id = target_workout_id and user_id = auth.uid();
  end if;

  return next;
end;
$$;