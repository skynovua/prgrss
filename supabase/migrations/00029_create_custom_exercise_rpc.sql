create or replace function public.create_custom_exercise(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_exercise_id uuid;
  target_name text;
  target_equipment text;
  target_muscles jsonb;
  targets_count integer;
  unique_targets_count integer;
  has_primary_target boolean;
begin
  if auth.uid() is null then
    raise exception 'Не авторизовано';
  end if;

  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Некоректні дані вправи';
  end if;

  if coalesce(jsonb_typeof(payload->'name'), '') <> 'string' then
    raise exception 'Вкажіть назву вправи';
  end if;

  if coalesce(jsonb_typeof(payload->'equipment'), '') <> 'string' then
    raise exception 'Оберіть коректне обладнання';
  end if;

  target_name := btrim(payload->>'name');
  target_equipment := payload->>'equipment';
  target_muscles := payload->'muscles';

  if target_name is null or target_name = '' then
    raise exception 'Вкажіть назву вправи';
  end if;

  if target_equipment not in ('barbell', 'dumbbell', 'machine', 'bodyweight', 'cable') then
    raise exception 'Оберіть коректне обладнання';
  end if;

  if target_muscles is null or jsonb_typeof(target_muscles) <> 'array' then
    raise exception 'М''язи вправи мають бути масивом';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(target_muscles) as target(item)
    where jsonb_typeof(target.item) <> 'object'
      or coalesce(jsonb_typeof(target.item->'muscle_key'), '') <> 'string'
      or coalesce(jsonb_typeof(target.item->'activation_score'), '') <> 'number'
  ) then
    raise exception 'Некоректні дані м''яза';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(target_muscles) as target(item)
    where (target.item->>'activation_score')::numeric not between 1 and 10
      or (target.item->>'activation_score')::numeric <> trunc((target.item->>'activation_score')::numeric)
  ) then
    raise exception 'Оцінка залучення має бути цілим числом від 1 до 10';
  end if;

  select
    count(*)::integer,
    count(distinct target.muscle_key)::integer,
    coalesce(bool_or(target.activation_score >= 8), false)
  into
    targets_count,
    unique_targets_count,
    has_primary_target
  from jsonb_to_recordset(target_muscles) as target(
    muscle_key text,
    activation_score numeric
  );

  if targets_count = 0 then
    raise exception 'Оберіть хоча б один м''яз';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(target_muscles) as target(
      muscle_key text,
      activation_score numeric
    )
    where btrim(target.muscle_key) = ''
  ) then
    raise exception 'Некоректні дані м''яза';
  end if;

  if targets_count <> unique_targets_count then
    raise exception 'М''язи у вправі не мають повторюватися';
  end if;

  if not has_primary_target then
    raise exception 'Основний м''яз повинен мати оцінку щонайменше 8';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(target_muscles) as target(
      muscle_key text,
      activation_score numeric
    )
    left join public.anatomical_muscles as muscle
      on muscle.key = target.muscle_key
      and muscle.is_active
    where muscle.key is null
  ) then
    raise exception 'Один або кілька м''язів недоступні';
  end if;

  insert into public.exercises (user_id, name, equipment, is_custom, is_active)
  values (auth.uid(), target_name, target_equipment, true, true)
  returning id into created_exercise_id;

  insert into public.exercise_muscles (exercise_id, muscle_key, activation_score)
  select
    created_exercise_id,
    target.muscle_key,
    target.activation_score::smallint
  from jsonb_to_recordset(target_muscles) as target(
    muscle_key text,
    activation_score numeric
  );

  return created_exercise_id;
end;
$$;

revoke all on function public.create_custom_exercise(jsonb)
from public, anon, authenticated, service_role;

grant execute on function public.create_custom_exercise(jsonb)
to authenticated;
