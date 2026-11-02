-- Запускати лише в локальній тестовій базі після міграцій. Усі тестові дані відкочуються.
begin;
create temporary table template_test as
select gen_random_uuid() as id, (select id from public.users limit 1) as owner_id;
grant select on template_test to authenticated;

do $$
begin
  if exists (select 1 from template_test where owner_id is null) then
    raise exception 'Для перевірки потрібен користувач';
  end if;
end;
$$;

insert into public.programs (id, user_id, name, workout_template)
select id, owner_id, 'Тимчасовий шаблон', '[{"value":1}]'::jsonb from template_test;
select set_config('request.jwt.claim.sub', owner_id::text, true) from template_test;
set local role authenticated;

do $$
declare
  ctx record;
begin
  select * into ctx from template_test;
  if not public.update_program_template_if_unchanged(ctx.id, '[{"value":1}]', '[{"value":2}]') then
    raise exception 'Не вдалося оновити власний шаблон';
  end if;
  if not public.update_program_template_if_unchanged(ctx.id, '[{"value":1}]', '[{"value":2}]') then
    raise exception 'Повтор після втраченої відповіді має бути успішним';
  end if;
  if public.update_program_template_if_unchanged(ctx.id, '[{"value":1}]', '[{"value":3}]') then
    raise exception 'Паралельну зміну не виявлено';
  end if;
  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  if public.update_program_template_if_unchanged(ctx.id, '[{"value":2}]', '[{"value":4}]') then
    raise exception 'Доступне оновлення чужого шаблону';
  end if;
end;
$$;
reset role;
rollback;
