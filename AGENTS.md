# PWA Workout Tracker — Project Instructions

Цей файл описує архітектуру, стек, структуру БД та правила розробки проєкту.
Агент повинен дотримуватись цих інструкцій при будь-яких змінах у коді.

---

## Стек

| Шар             | Технологія                                                     |
| --------------- | -------------------------------------------------------------- |
| Frontend        | Vite + React (SPA)                                             |
| UI Components   | shadcn/ui (Radix UI + Tailwind)                                |
| Styling         | Tailwind CSS                                                   |
| Language        | TypeScript (strict mode)                                       |
| Backend         | Supabase (Auth, PostgreSQL, Edge Functions, Realtime, Storage) |
| PWA             | vite-plugin-pwa (Workbox) + Service Worker                     |
| Charts          | Recharts                                                       |
| Offline storage | Dexie.js (IndexedDB wrapper)                                   |
| Push            | Web Push API (VAPID) через Supabase Edge Functions             |
| Deployment      | Vercel (Vite SPA), Supabase Edge Functions                     |
| Linting         | ESLint + Prettier (автоформатування)                           |
| Language        | Українська (інтерфейс та коментарі)                            |

---

## Автентифікація

Використовується **Supabase Auth** з двома провайдерами:

- Google OAuth (`provider: 'google'`)
- Sign in with Apple (`provider: 'apple'`)

Логіка auth живе в `lib/auth.ts`. Сесія зберігається через Supabase SSR cookies (`@supabase/ssr`). Middleware (`middleware.ts`) захищає всі маршрути крім `/login`.

```ts
// Приклад виклику
const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
```

---

## Структура проєкту

```
/src
  /routes           — сторінки (SPA routing)
    /login          — сторінка входу (Google)
    /dashboard      — головний екран, статистика
    /workout-new    — новий workout logger
    /workout-detail — деталі тренування
    /workout-edit   — редагування тренування
    /exercises      — бібліотека вправ
    /programs       — шаблони програм
    /progress       — графіки, 1RM
    /settings       — профіль, налаштування
    /offline        — offline fallback

  /components
    /ui             — базові UI-компоненти (shadcn/ui)
    /workout        — логер, таймер відпочинку, set row, exercise picker
    /charts         — графіки прогресії
    /notifications  — налаштування push
    /auth           — logout button
    /exercises      — бібліотека вправ
    /settings       — профіль

  /lib
    /supabase       — клієнт Supabase
    /auth.tsx       — auth helpers
    /router.tsx     — SPA router
    /api            — API функції (dashboard, exercises, workouts, stats, profile)
    /db             — типи БД
    /offline        — Dexie schema + sync logic
    /hooks          — React hooks
    /utils          — утиліти (calc, etc.)
    /workout        — reducer, persistence, use-workout hook

/supabase
  /functions        — Edge Functions (reminder-push, cron)
  /migrations       — SQL міграції

/public
  /icons            — PWA іконки
  /splash           — splash screens
```

---

## Схема бази даних

Row Level Security (RLS) увімкнений на всіх таблицях. Кожен користувач бачить тільки свої дані (`auth.uid() = user_id`).

### `users`

Розширює `auth.users`. Зберігається через тригер при реєстрації.

```sql
id          uuid PRIMARY KEY REFERENCES auth.users
name        text
avatar_url  text
created_at  timestamptz DEFAULT now()
```

### `programs`

Шаблон тренувального циклу (наприклад, "12-week Upper/Lower").

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES users NOT NULL
name        text NOT NULL
description text
is_template boolean DEFAULT false
created_at  timestamptz DEFAULT now()
```

### `workouts`

Одне тренування (сесія).

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES users NOT NULL
program_id  uuid REFERENCES programs
name        text
started_at  timestamptz
finished_at timestamptz
notes       text
created_at  timestamptz DEFAULT now()
```

### `exercises`

Глобальна бібліотека вправ (і користувацькі).

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id      uuid REFERENCES users  -- null = системна вправа
name         text NOT NULL
muscle_group text   -- 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'
equipment    text   -- 'barbell', 'dumbbell', 'machine', 'bodyweight', 'cable'
is_custom    boolean DEFAULT false
```

### `sets`

Кожен підхід у тренуванні. Це найважливіша таблиця для аналітики.

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
workout_id  uuid REFERENCES workouts NOT NULL
exercise_id uuid REFERENCES exercises NOT NULL
set_number  int NOT NULL
reps        int
weight      numeric(6,2)  -- кг
rpe         numeric(3,1)  -- 6.0–10.0
duration_s  int           -- для вправ на час
notes       text
created_at  timestamptz DEFAULT now()
```

### `body_measurements`

Антропометрія (вага тіла, обхвати).

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES users NOT NULL
measured_at date NOT NULL
body_weight numeric(5,2)
body_fat    numeric(4,1)
chest       numeric(5,1)
waist       numeric(5,1)
hips        numeric(5,1)
arms        numeric(5,1)
legs        numeric(5,1)
```

### `push_subscriptions`

Web Push підписки для нагадувань.

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES users NOT NULL
endpoint    text NOT NULL
p256dh      text NOT NULL
auth        text NOT NULL
created_at  timestamptz DEFAULT now()
```

### `reminders`

Налаштування нагадувань користувача.

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES users NOT NULL
days        int[]   -- [1,3,5] = пн, ср, пт (ISO weekday)
time        time    -- '09:00'
enabled     boolean DEFAULT true
message     text
```

---

## Offline-режим

Додаток повинен працювати без інтернету в залі.

- Використовується **Dexie.js** для IndexedDB
- Активне тренування зберігається локально в реальному часі
- Після появи інтернету — синхронізація з Supabase через Background Sync API
- Стратегія: **offline-first** для запису, **network-first** для читання статистики

```ts
// lib/offline/schema.ts — Dexie схема
const db = new Dexie("WorkoutDB");
db.version(1).stores({
  pendingWorkouts: "++id, syncedAt",
  pendingSets: "++id, workoutId, syncedAt",
});
```

---

## Push-нагадування

1. Клієнт підписується на Web Push (VAPID) і зберігає підписку в таблиці `push_subscriptions`
2. Supabase Edge Function `reminder-push` запускається через `pg_cron` щогодини
3. Функція знаходить нагадування на поточний час і відправляє push через Web Push Protocol

```ts
// supabase/functions/reminder-push/index.ts
// Запускається cron-ом: '0 * * * *'
```

VAPID ключі зберігаються в Supabase Secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).

---

## 1RM та прогресія

Обрахунок 1RM (Epley formula):

```ts
export const calc1RM = (weight: number, reps: number) =>
  reps === 1 ? weight : weight * (1 + reps / 30);
```

Для кожного тренування показувати:

- Порівняння з попереднім (`weight_diff`, `volume_diff`)
- Best set за сесію
- Графік 1RM по часу

---

## Правила розробки

**Компоненти**

- Це Vite SPA — всі компоненти клієнтські
- Supabase запити через `createClient` з `@supabase/supabase-js`
- Роутинг — кастомний SPA router (`lib/router.tsx`)

**Типи**

- Генерувати типи БД командою: `supabase gen types typescript --local > lib/db/types.ts`
- Не писати типи вручну — тільки з генератора

**Стилі**

- Тільки Tailwind utility classes, без кастомного CSS
- Темна тема підтримується через `dark:` префікс
- Мобайл-фьорст: спочатку мобільний layout, потім `md:` / `lg:`

**Запити до БД**

- Всі запити через Supabase JS client (`@supabase/supabase-js`)
- Складні аналітичні запити виносити в SQL Views або RPC функції
- Не робити N+1 — використовувати join через Supabase `.select('*, sets(*)')`

**PWA**

- `manifest.json` з усіма необхідними іконками
- Service Worker через `vite-plugin-pwa` (автоматична генерація)
- Offline fallback сторінка `/offline`

---

## Змінні середовища

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=

# Тільки на сервері
SUPABASE_SERVICE_ROLE_KEY=
VAPID_PRIVATE_KEY=
```

---

## Roadmap

### MVP (Phase 1)

- [x] Auth (Google) — PKCE flow, захищені роути, сесія через Supabase
- [ ] Auth (Apple) — не реалізовано
- [x] Workout logger (offline-first) — Dexie.js, auto-save, sync on reconnect
- [x] Exercise library — 60+ вправ (UA), пошук, фільтри, кастомні вправи
- [x] Базова статистика (обсяг, підходи) — dashboard з тижневою статистикою
- [ ] Push-нагадування — не розпочато (Edge Functions, VAPID, Web Push)

### Phase 2

- [ ] Шаблони програм — DB таблиця є, UI не реалізовано
- [x] Графіки прогресії та 1RM — Recharts, Epley formula, 4 періоди фільтрації
- [ ] Антропометрія (вага, обхвати) — DB таблиця є, UI не реалізовано
- [x] Таймер відпочинку між підходами — діалог, пресети, вібрація, auto-toggle

### Додатково реалізовано (поза початковим roadmap)

- [x] Workout details + editing (24h window, RLS policy)
- [x] Dashboard — привітання, аватар, календар тренувань (3 міс), recent workouts
- [x] Profile settings — ім'я, аватар (Supabase Storage), auto-rest timer toggle
- [x] Active workout banner
- [x] Muscle distribution chart (pie/bar)
- [x] PWA — Vite PWA plugin, manifest, service worker, offline fallback

### Phase 3

- [ ] Фото прогресу (Supabase Storage)
- [ ] Експорт (CSV, PDF)
- [ ] Apple Health / Google Fit sync
- [ ] AI-рекомендації (зміна навантаження, deload)
