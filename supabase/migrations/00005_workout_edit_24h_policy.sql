-- Обмеження: редагування/видалення тренувань тільки протягом 24 годин

-- Замінюємо політику оновлення тренувань
drop policy if exists "Користувач оновлює свої тренування" on public.workouts;
create policy "Користувач оновлює свої тренування (24 год)" on public.workouts
  for update using (
    auth.uid() = user_id
    and started_at > now() - interval '24 hours'
  );

-- Замінюємо політику видалення тренувань
drop policy if exists "Користувач видаляє свої тренування" on public.workouts;
create policy "Користувач видаляє свої тренування (24 год)" on public.workouts
  for delete using (
    auth.uid() = user_id
    and started_at > now() - interval '24 hours'
  );

-- Замінюємо політику видалення сетів (для updateWorkout який робить delete + insert)
drop policy if exists "Користувач видаляє свої підходи" on public.sets;
create policy "Користувач видаляє підходи (24 год)" on public.sets
  for delete using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id
        and w.user_id = auth.uid()
        and w.started_at > now() - interval '24 hours'
    )
  );
