-- Оновлюємо лише власний шаблон, який не змінився після початку тренування.
create or replace function public.update_program_template_if_unchanged(
  target_program_id uuid,
  original_template jsonb,
  updated_template jsonb
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated';
  end if;
  if jsonb_typeof(updated_template) is distinct from 'array' then
    raise exception 'Template must be an array';
  end if;

  update public.programs
  set workout_template = updated_template
  where id = target_program_id
    and user_id = (select auth.uid())
    and workout_template = original_template;

  if found then
    return true;
  end if;

  -- Повтор після втраченої відповіді вважається успішним, якщо зміни вже застосовані.
  return exists (
    select 1 from public.programs
    where id = target_program_id
      and user_id = (select auth.uid())
      and workout_template = updated_template
  );
end;
$$;

revoke all on function public.update_program_template_if_unchanged(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.update_program_template_if_unchanged(uuid, jsonb, jsonb) to authenticated;
