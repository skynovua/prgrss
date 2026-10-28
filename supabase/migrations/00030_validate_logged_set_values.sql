-- Стару історію не переписуємо; перевірка діє для нових записів та оновлень.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sets_logged_values_check'
      and conrelid = 'public.sets'::regclass
  ) then
    alter table public.sets
      add constraint sets_logged_values_check check (
        (weight is null or weight between 0 and 9999.99)
        and (reps is null or reps between 1 and 999)
        and (duration_s is null or duration_s between 1 and 86400)
        and (reps is not null or duration_s is not null)
        and (rpe is null or (rpe between 6 and 10 and mod(rpe, 0.5) = 0))
      ) not valid;
  end if;
end;
$$;
