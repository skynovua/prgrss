# prgrss

An offline-first PWA workout tracker for the gym: set logging, exercise library, dashboard, progress analytics, completed workout editing, and unfinished session restore after reload.

## Implemented Features

- Google sign-in via Supabase Auth
- Active workout creation and restore via IndexedDB
- Workout logger with exercises, sets, RPE, rest timer, and auto-save
- Collapse/expand exercise cards in the logger and editor
- Dumbbell `x2` support in weight display and volume calculation
- Dashboard with streak, weekly stats, recent workouts, and calendar
- Fixed unfinished workout banner on the home screen
- Workout detail + workout edit for completed workouts
- Exercise library with search, filters, and custom exercises
- Progress screen with global stats, charts, and estimated 1RM
- Achievements with a configurable catalog
- PWA support + offline sync when the network comes back

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: TanStack Router
- **Server state**: TanStack Query
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase Auth + PostgreSQL + Storage
- **Offline**: Dexie.js (IndexedDB)
- **PWA**: vite-plugin-pwa + Workbox
- **Charts**: Recharts

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env.local`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

3. Start the dev server:

```bash
pnpm dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

## Scripts

| Command                     | Description                                |
| --------------------------- | ------------------------------------------ |
| `pnpm dev`                  | Run the local dev server                   |
| `pnpm build`                | Run TypeScript checks and production build |
| `pnpm preview`              | Preview the production build locally       |
| `pnpm lint`                 | Run ESLint                                 |
| `pnpm format`               | Format the project with Prettier           |
| `pnpm format:check`         | Check formatting                           |
| `pnpm db:types`             | Generate Supabase TypeScript types         |
| `pnpm db:sync-achievements` | Sync the achievements catalog to Supabase  |

## Project Structure

```text
src/
	components/
		workout/       logger UI, detail/edit, timer, active workout banner
		charts/        progress and analytics charts
		exercises/     exercise library
		settings/      profile and user settings
		ui/            base UI primitives
	lib/
		api/           Supabase queries and RPC calls
		hooks/         React hooks for features and data
		offline/       Dexie schema + sync logic
		supabase/      Supabase client
		workout/       reducer, metrics, persistence, use-workout
	routes/          application pages
supabase/
	migrations/      SQL migrations and RPC functions
docs/
	achievement-config.md
```

## Feature Status

- **Done**: auth, workout logger, offline restore/save, dashboard, progress, achievements, workout detail/edit, exercise library, profile settings, rest timer, PWA
- **Partial / skeleton**: programs/templates
- **Not implemented yet**: push reminders, body measurements, Apple sign-in, photo progress, export

## Deployment

The frontend is deployed on [Vercel](https://vercel.com). Supabase schema, storage, and RPCs are managed through Supabase migrations.

## Achievement Catalog

The achievements catalog is maintained through [docs/achievement-config.md](/Users/skynov/projects/prgrss/docs/achievement-config.md), not through new migration files for every content change.
