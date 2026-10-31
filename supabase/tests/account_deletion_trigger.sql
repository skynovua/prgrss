-- Лише тимчасові таблиці: перевіряємо роль та гілки тригера без даних акаунтів.
begin;
create temp table deletion_test_parent (id integer primary key) on commit drop;
create temp table deletion_test_child (
  id integer primary key,
  parent_id integer references deletion_test_parent(id) on delete cascade
) on commit drop;
create temp table deletion_test_audit (operation text, caller name) on commit drop;

do $$
begin
  execute format('grant usage on schema %I to authenticated', pg_my_temp_schema()::regnamespace::text);
end;
$$;
grant select, delete on deletion_test_parent, deletion_test_child to authenticated;
grant insert on deletion_test_audit to authenticated;

create function pg_temp.deletion_test_trigger() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'DELETE' and (current_user = 'authenticated' or session_user = 'authenticated') then
    insert into pg_temp.deletion_test_audit values ('skip', current_user);
    return old;
  end if;
  insert into pg_temp.deletion_test_audit values ('sync', current_user);
  return old;
end;
$$;
create trigger deletion_test_after_delete after delete on deletion_test_child
for each row execute function pg_temp.deletion_test_trigger();

insert into deletion_test_parent values (1), (2);
insert into deletion_test_child values (1, 1), (2, 2);
delete from deletion_test_child where id = 1;
set local role authenticated;
delete from deletion_test_parent where id = 2;
reset role;

do $$
begin
  if (select count(*) from deletion_test_audit where operation = 'sync' and caller = current_user) <> 1
     or (select count(*) from deletion_test_audit where operation = 'skip' and caller = 'authenticated') <> 1
     or exists (select 1 from deletion_test_child) then
    raise exception 'Account deletion trigger regression';
  end if;
end;
$$;
select 'trigger_role_checks_passed' as result;
rollback;
