# Phase 1: Transactional Workout Flow

## Context

Поточний запис тренування не є атомарним:

- `workouts` і `sets` зберігаються окремими запитами
- offline sync позначає тренування як `synced`, навіть якщо вставка `sets` не завершилась успішно
- редагування тренування працює через `delete all sets -> insert all sets`, що може залишити тренування в напівзламаному стані

Це головний архітектурний ризик у проєкті, бо він прямо впливає на цілісність даних.

## Goal

Перевести всі write-операції над тренуванням на один серверний transaction boundary.

Після завершення фази не повинно залишитися жодного шляху, де клієнт окремо:

1. створює або оновлює `workout`
2. окремо створює або перевставляє `sets`
3. самостійно вирішує, що тренування вже синхронізоване

## Target Architecture

Один серверний entrypoint для запису тренування:

- RPC `save_workout_with_sets(payload jsonb)` для create/update
- RPC `delete_workout_cascade(workout_id uuid)` для безпечного видалення

Клієнт повинен:

- зібрати payload
- викликати RPC
- обробити success/error
- інвалідовувати кеш

Сервер повинен:

- перевірити, що тренування належить `auth.uid()`
- у межах однієї транзакції записати `workout`
- видалити старі `sets`, якщо це update
- вставити нові `sets`
- повернути підтвердження успішного запису

## Scope

У фазу входить:

- online save нового тренування
- offline sync pending тренувань
- update існуючого тренування
- delete тренування
- мінімальні schema changes для каскадного видалення і типобезпеки

У фазу не входить:

- refactor auth
- analytics RPC
- query-key redesign
- програми, пуші, body measurements

## Files To Change

### Database / SQL

- `supabase/migrations/<new>_transactional_workout_rpc.sql`
- `src/lib/db/types.ts`

### Client write paths

- `src/lib/workout/persistence.ts`
- `src/lib/offline/sync.ts`
- `src/lib/api/workouts.ts`
- `src/lib/hooks/use-workouts.ts`
- `src/lib/workout/use-workout.ts`

### Optional follow-up if needed

- `src/lib/types.ts`
- `src/lib/api/dashboard.ts`

## Work Items

### 1. Add transactional RPC for save/update

Створити SQL-функцію `save_workout_with_sets(payload jsonb)`.

Payload має покривати:

- `workout_id uuid`
- `started_at timestamptz`
- `finished_at timestamptz`
- `name text`
- `notes text | null`
- `program_id uuid | null`
- `sets jsonb`
- `enforce_edit_window boolean | null`

Кожен set у `sets`:

- `exercise_id uuid`
- `set_number int`
- `reps int | null`
- `weight numeric | null`
- `rpe numeric | null`
- `duration_s int | null`
- `notes text | null`

Вимоги до RPC:

1. Якщо `workout_id` не існує, створюється новий `workout` для `auth.uid()`.
2. Якщо `workout_id` існує, перевіряється, що він належить `auth.uid()`.
3. Якщо `enforce_edit_window = true`, виконується перевірка 24-годинного вікна.
4. Усі старі `sets` для workout видаляються в тій самій транзакції.
5. Нові `sets` вставляються batch-вставкою.
6. Якщо будь-яка частина падає, у БД не має залишитися частково оновленого стану.

Повернення:

- `workout_id`
- `sets_count`
- `updated_at` або `saved_at`

### 2. Add transactional RPC for delete

Створити SQL-функцію `delete_workout_cascade(target_workout_id uuid)`.

Вимоги:

1. Видаляє тільки тренування користувача `auth.uid()`.
2. Якщо діє 24-годинне вікно на delete, перевірка має жити тут же.
3. Не покладатися на два клієнтські delete-запити.

Додатково:

- якщо можливо, додати `on delete cascade` для `sets.workout_id`
- якщо каскад не додається в цій фазі, delete RPC має вручну видаляти `sets` і `workout` у межах однієї транзакції

### 3. Move online finish flow to RPC

У `src/lib/workout/persistence.ts`:

Замінити логіку:

- `insert workout`
- `insert sets`

на:

- складання payload
- один виклик `supabase.rpc("save_workout_with_sets", ...)`

Вимоги:

1. Якщо RPC не вдався через мережу, workout переходить у offline queue.
2. Якщо RPC повернув помилку валідації, не маскувати її під offline-стан.
3. `clearActiveWorkout()` викликати тільки після підтвердженого online save або після успішного локального fallback.

### 4. Move offline sync to the same RPC

У `src/lib/offline/sync.ts`:

Замінити поточний flow на:

1. прочитати pending workout
2. прочитати всі pending sets для цього workout
3. зібрати RPC payload
4. викликати `save_workout_with_sets`
5. тільки після успіху позначити:
   - workout як synced
   - sets як synced

Вимоги:

1. Якщо RPC впав, жоден запис не позначається synced.
2. Якщо sync одного workout впав, наступні не повинні губитися.
3. Помилки треба логічно розділити на:
   - auth/session missing
   - network error
   - validation / RLS / business rule error

Мінімально допустима поведінка:

- network error: лишаємо pending як є
- validation error: не позначаємо synced, логгуємо для подальшого UI-handling

### 5. Move workout update to RPC

У `src/lib/api/workouts.ts`:

Замість:

- перевірити started_at
- delete old sets
- insert new sets
- update workout

треба:

- зібрати payload
- викликати `save_workout_with_sets({ enforce_edit_window: true })`

Валідація 24h може лишитися в UI для швидкого early feedback, але server-side перевірка має бути обов'язковою.

### 6. Move delete workout to RPC

У `src/lib/api/workouts.ts`:

Замість двох delete-запитів використовувати `delete_workout_cascade`.

Також треба:

- коректно кидати помилки наверх
- не ігнорувати невдалі delete

### 7. Regenerate DB types

Після міграції оновити `src/lib/db/types.ts`.

Очікуваний результат:

- RPC відображаються в generated types
- client-side виклики RPC типізовані

## SQL Design Notes

### Preferred RPC shape

Краще один `jsonb` payload, а не багато positional arguments, бо:

- легше еволюціонувати контракт
- простіше версіонувати поля
- менше ризику зламати клієнт при додаванні нового параметра

### Security

Функції мають виконуватись так, щоб не обійти ownership checks.

Мінімум:

- звірка `workout.user_id = auth.uid()` на update/delete
- нові workouts завжди створюються з `user_id = auth.uid()`
- не довіряти `user_id` з payload

### Constraints worth adding in same migration

Якщо не зламає наявні дані, варто додати:

- `set_number > 0`
- `reps is null or reps >= 0`
- `weight is null or weight >= 0`
- `duration_s is null or duration_s >= 0`

## Suggested Implementation Order

1. Додати SQL migration з RPC і потрібними schema changes.
2. Згенерувати Supabase types.
3. Переключити `persistence.ts` на новий RPC.
4. Переключити `offline/sync.ts` на той самий RPC.
5. Переключити `api/workouts.ts` update/delete на RPC.
6. Прогнати точкову перевірку сценаріїв.

## Validation Checklist

### Manual scenarios

1. Online create workout:
   - workout з'являється
   - всі sets з'являються
   - dashboard/progress оновлюються

2. Offline create workout:
   - workout і sets йдуть у Dexie pending
   - після reconnect sync записує все разом
   - немає стану, де workout є без sets

3. Update workout within 24h:
   - старі sets замінені новими атомарно
   - при помилці старі sets не губляться частково

4. Update workout after 24h:
   - RPC повертає помилку
   - UI показує зрозуміле повідомлення

5. Delete workout within 24h:
   - workout видаляється цілком
   - orphaned sets не залишаються

6. Failed sync:
   - `syncedAt` не проставляється частково
   - pending дані лишаються доступними для повторної спроби

### Code-level checks

1. У коді більше немає окремого `insert workouts` + `insert sets` для основного flow.
2. У коді більше немає `delete sets` + `delete workout` як основного delete flow.
3. `syncPendingWorkouts()` не маркує workout synced раніше, ніж успішно завершився RPC.

## Risks

1. Міграція `on delete cascade` потребує акуратної перевірки, щоб не зламати існуючі foreign keys.
2. JSON payload у RPC потребує явної валідації типів, інакше SQL-функція стане крихкою.
3. Offline queue вже містить дані старого формату, тому треба не зламати backward compatibility на рівні client payload builder.

## Nice-to-have After Phase 1

Після завершення цієї фази логічним продовженням буде:

1. винести shared payload builder для create/update/sync
2. централізувати error mapping для Supabase RPC
3. додати lightweight audit logging на failed sync attempts
