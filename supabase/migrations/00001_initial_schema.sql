-- Таблиця users (розширює auth.users)
create table public.users (
  id uuid primary key references auth.users on delete cascade,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Користувач бачить тільки себе" on public.users
  for select using (auth.uid() = id);

create policy "Користувач оновлює тільки себе" on public.users
  for update using (auth.uid() = id);

-- Тригер: створює запис в users при реєстрації
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Таблиця programs
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  name text not null,
  description text,
  is_template boolean default false,
  created_at timestamptz default now()
);

alter table public.programs enable row level security;

create policy "Користувач бачить свої програми" on public.programs
  for select using (auth.uid() = user_id);

create policy "Користувач створює свої програми" on public.programs
  for insert with check (auth.uid() = user_id);

create policy "Користувач оновлює свої програми" on public.programs
  for update using (auth.uid() = user_id);

create policy "Користувач видаляє свої програми" on public.programs
  for delete using (auth.uid() = user_id);

-- Таблиця workouts
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  program_id uuid references public.programs,
  name text,
  started_at timestamptz,
  finished_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

alter table public.workouts enable row level security;

create policy "Користувач бачить свої тренування" on public.workouts
  for select using (auth.uid() = user_id);

create policy "Користувач створює свої тренування" on public.workouts
  for insert with check (auth.uid() = user_id);

create policy "Користувач оновлює свої тренування" on public.workouts
  for update using (auth.uid() = user_id);

create policy "Користувач видаляє свої тренування" on public.workouts
  for delete using (auth.uid() = user_id);

-- Таблиця exercises
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users,
  name text not null,
  muscle_group text,
  equipment text,
  is_custom boolean default false
);

alter table public.exercises enable row level security;

create policy "Бачити системні + свої вправи" on public.exercises
  for select using (user_id is null or auth.uid() = user_id);

create policy "Створювати свої вправи" on public.exercises
  for insert with check (auth.uid() = user_id and is_custom = true);

create policy "Оновлювати свої вправи" on public.exercises
  for update using (auth.uid() = user_id and is_custom = true);

create policy "Видаляти свої вправи" on public.exercises
  for delete using (auth.uid() = user_id and is_custom = true);

-- Таблиця sets
create table public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references public.workouts not null,
  exercise_id uuid references public.exercises not null,
  set_number int not null,
  reps int,
  weight numeric(6, 2),
  rpe numeric(3, 1),
  duration_s int,
  notes text,
  created_at timestamptz default now()
);

alter table public.sets enable row level security;

create policy "Користувач бачить свої підходи" on public.sets
  for select using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

create policy "Користувач створює підходи у своїх тренуваннях" on public.sets
  for insert with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

create policy "Користувач оновлює свої підходи" on public.sets
  for update using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

create policy "Користувач видаляє свої підходи" on public.sets
  for delete using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

-- Таблиця body_measurements
create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  measured_at date not null,
  body_weight numeric(5, 2),
  body_fat numeric(4, 1),
  chest numeric(5, 1),
  waist numeric(5, 1),
  hips numeric(5, 1),
  arms numeric(5, 1),
  legs numeric(5, 1)
);

alter table public.body_measurements enable row level security;

create policy "Користувач бачить свої заміри" on public.body_measurements
  for select using (auth.uid() = user_id);

create policy "Користувач створює свої заміри" on public.body_measurements
  for insert with check (auth.uid() = user_id);

create policy "Користувач оновлює свої заміри" on public.body_measurements
  for update using (auth.uid() = user_id);

create policy "Користувач видаляє свої заміри" on public.body_measurements
  for delete using (auth.uid() = user_id);

-- Таблиця push_subscriptions
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Користувач бачить свої підписки" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "Користувач створює свої підписки" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "Користувач видаляє свої підписки" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- Таблиця reminders
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  days int[],
  time time,
  enabled boolean default true,
  message text
);

alter table public.reminders enable row level security;

create policy "Користувач бачить свої нагадування" on public.reminders
  for select using (auth.uid() = user_id);

create policy "Користувач створює свої нагадування" on public.reminders
  for insert with check (auth.uid() = user_id);

create policy "Користувач оновлює свої нагадування" on public.reminders
  for update using (auth.uid() = user_id);

create policy "Користувач видаляє свої нагадування" on public.reminders
  for delete using (auth.uid() = user_id);
