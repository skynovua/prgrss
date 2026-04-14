-- Додає налаштування автотаймера відпочинку до таблиці users
alter table public.users
  add column auto_rest_timer boolean not null default true;
