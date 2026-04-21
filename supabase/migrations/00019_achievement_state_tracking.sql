create table if not exists public.user_achievement_states (
  user_id uuid references public.users not null default auth.uid(),
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  seen_at timestamptz,
  primary key (user_id, achievement_id)
);

alter table public.user_achievement_states enable row level security;

create policy "Користувач бачить свої стани ачівок" on public.user_achievement_states
  for select using (auth.uid() = user_id);

create policy "Користувач створює свої стани ачівок" on public.user_achievement_states
  for insert with check (auth.uid() = user_id);

create policy "Користувач оновлює свої стани ачівок" on public.user_achievement_states
  for update using (auth.uid() = user_id);

create index if not exists idx_user_achievement_states_unseen
  on public.user_achievement_states (user_id, seen_at)
  where seen_at is null;

create or replace function public.sync_unlocked_achievement_states(achievement_ids text[])
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.user_achievement_states (user_id, achievement_id)
  select auth.uid(), achievement_id
  from unnest(coalesce(achievement_ids, array[]::text[])) as achievement_id
  on conflict (user_id, achievement_id) do nothing;
$$;

create or replace function public.get_achievement_states(achievement_ids text[] default null)
returns table (
  achievement_id text,
  unlocked_at timestamptz,
  seen_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    uas.achievement_id,
    uas.unlocked_at,
    uas.seen_at
  from public.user_achievement_states uas
  where uas.user_id = auth.uid()
    and (
      achievement_ids is null
      or uas.achievement_id = any(achievement_ids)
    );
$$;

create or replace function public.mark_achievement_states_seen(achievement_ids text[])
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  marked_at timestamptz := now();
begin
  update public.user_achievement_states
  set seen_at = coalesce(seen_at, marked_at)
  where user_id = auth.uid()
    and achievement_id = any(coalesce(achievement_ids, array[]::text[]));

  return marked_at;
end;
$$;