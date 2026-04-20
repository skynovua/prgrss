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
  enforce_edit_window boolean;
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
  enforce_edit_window := coalesce((payload->>'enforce_edit_window')::boolean, false);
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
      if enforce_edit_window and (
        existing_workout.started_at is null
        or existing_workout.started_at <= now() - interval '24 hours'
      ) then
        raise exception 'Edit window expired';
      end if;

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

  return next;
end;
$$;