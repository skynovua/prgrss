# prgrss

PWA-трекер тренувань з офлайн-підтримкою.

## Стек

- **Frontend**: React 19 + TypeScript + Vite
- **Роутинг**: TanStack Router
- **Стейт**: TanStack React Query
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Офлайн**: Dexie.js (IndexedDB)
- **PWA**: vite-plugin-pwa + Workbox
- **Графіки**: Recharts

## Початок роботи

```bash
pnpm install
pnpm dev
```

Відкрий [http://localhost:5173](http://localhost:5173).

## Скрипти

| Команда             | Опис                     |
| ------------------- | ------------------------ |
| `pnpm dev`          | Запуск dev-сервера       |
| `pnpm build`        | Збірка для продакшену    |
| `pnpm preview`      | Превʼю production-збірки |
| `pnpm lint`         | Перевірка ESLint         |
| `pnpm format`       | Форматування Prettier    |
| `pnpm format:check` | Перевірка форматування   |

## Змінні середовища

Створи `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

## Деплой

Деплоїться на [Vercel](https://vercel.com). Supabase Edge Functions — окремо.
