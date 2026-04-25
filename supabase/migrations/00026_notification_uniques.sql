delete from public.reminders a
using public.reminders b
where a.user_id = b.user_id
  and a.id > b.id;

create unique index if not exists reminders_user_id_unique
  on public.reminders (user_id);

delete from public.push_subscriptions a
using public.push_subscriptions b
where a.user_id = b.user_id
  and a.endpoint = b.endpoint
  and a.id > b.id;

create unique index if not exists push_subscriptions_user_id_endpoint_unique
  on public.push_subscriptions (user_id, endpoint);