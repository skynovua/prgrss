-- Auth видаляє м'язи каскадно разом із вправою; оновлювати видалену вправу не потрібно.
create or replace function public.sync_exercise_muscle_group()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_exercise_id uuid := coalesce(new.exercise_id, old.exercise_id);
begin
  if tg_op = 'DELETE'
    and (current_user = 'supabase_auth_admin' or session_user = 'supabase_auth_admin') then
    return old;
  end if;

  update public.exercises
  set muscle_group = (
    select am.muscle_group
    from public.exercise_muscles em
    join public.anatomical_muscles am on am.key = em.muscle_key
    where em.exercise_id = target_exercise_id
    order by em.activation_score desc, am.sort_order asc
    limit 1
  ),
  updated_at = now()
  where id = target_exercise_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;
