drop index if exists public.exercises_catalog_key_unique;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'exercises_catalog_key_key'
      and conrelid = 'public.exercises'::regclass
  ) then
    alter table public.exercises
      add constraint exercises_catalog_key_key unique (catalog_key);
  end if;
end;
$$;
