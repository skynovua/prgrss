import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";

// Node запускає TS без Vite; зберігаємо ті самі alias та імпорти без розширень.
const sourceRoot = new URL("../../../", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.startsWith("@/") ||
      (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier))
    ) {
      const base = specifier.startsWith("@/")
        ? new URL(specifier.slice(2), sourceRoot)
        : new URL(specifier, context.parentURL);
      for (const suffix of [".ts", "/index.ts"]) {
        const candidate = new URL(`${base.href}${suffix}`);
        if (existsSync(candidate)) return nextResolve(candidate.href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

const {
  buildCalendarReturnPath,
  formatCalendarDuration,
  getCalendarDays,
  getCalendarPeriod,
  getCalendarPeriodLabel,
  getWorkoutDurationMinutes,
  groupCalendarWorkouts,
  moveCalendarDate,
  parseCalendarDate,
  validateCalendarSearch,
} = await import("./calendar.ts");

const today = new Date(2026, 9, 28, 15);

test("URL приймає лише реальні дати й не відкриває майбутнє", () => {
  for (const date of [
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-01-00",
    "28.10.2026",
    "1969-12-31",
    123,
    null,
  ]) {
    assert.equal(validateCalendarSearch({ date }, today).date, undefined);
  }
  assert.ok(parseCalendarDate("2024-02-29"));
  assert.equal(validateCalendarSearch({ date: "2027-01-01" }, today).date, "2026-10-28");
  assert.deepEqual(
    validateCalendarSearch({ date: "2026-05-07", view: "week", day: "true" }, today),
    { date: "2026-05-07", view: "week", day: true }
  );
  assert.deepEqual(validateCalendarSearch({ view: "invalid", day: true }, today), {
    date: undefined,
    view: undefined,
    day: undefined,
  });
});

test("місячна сітка починається в понеділок і зберігає високосний день", () => {
  const days = getCalendarDays("2024-02-29", "month");
  assert.deepEqual(days.slice(0, 4), [null, null, null, "2024-02-01"]);
  assert.equal(days.filter(Boolean).length, 29);
  assert.equal(days.length % 7, 0);
  assert.ok(days.includes("2024-02-29"));
});

test("тиждень перетинає межі місяця і року без втрати днів", () => {
  assert.deepEqual(getCalendarDays("2026-01-01", "week"), [
    "2025-12-29",
    "2025-12-30",
    "2025-12-31",
    "2026-01-01",
    "2026-01-02",
    "2026-01-03",
    "2026-01-04",
  ]);
  assert.deepEqual(getCalendarDays("1970-01-01", "week"), [
    null,
    null,
    null,
    "1970-01-01",
    "1970-01-02",
    "1970-01-03",
    "1970-01-04",
  ]);
  assert.match(getCalendarPeriodLabel("2026-01-01", "week"), /2025.*2026/);
});

test("перехід між місяцями обмежує день реальною довжиною місяця", () => {
  assert.equal(moveCalendarDate("2024-01-31", "month", 1, "2026-10-28"), "2024-02-29");
  assert.equal(moveCalendarDate("2026-03-31", "month", -1, "2026-10-28"), "2026-02-28");
  assert.equal(moveCalendarDate("2025-12-15", "month", 1, "2026-10-28"), "2026-01-15");
  assert.equal(moveCalendarDate("2026-09-30", "month", 1, "2026-10-28"), "2026-10-28");
  assert.equal(moveCalendarDate("1970-01-01", "month", -1, "2026-10-28"), "1970-01-01");
});

test("тижнева навігація зберігає день тижня та обмежує майбутні дати", () => {
  assert.equal(moveCalendarDate("2026-05-07", "week", -1, "2026-10-28"), "2026-04-30");
  assert.equal(moveCalendarDate("2026-10-25", "week", 1, "2026-10-28"), "2026-10-28");
});

test("запит місяця охоплює локальні півночі, а не UTC-дати", () => {
  const period = getCalendarPeriod("2026-05-07", "month");
  assert.equal(period.startIso, "2026-04-30T21:00:00.000Z");
  assert.equal(period.endIso, "2026-05-31T21:00:00.000Z");
  assert.equal(period.startKey, "2026-05-01");
  assert.equal(period.endKey, "2026-06-01");
});

test("тижневий запит коректний при переході на літній і зимовий час", () => {
  const spring = getCalendarPeriod("2026-03-29", "week");
  assert.equal(spring.startIso, "2026-03-22T22:00:00.000Z");
  assert.equal(spring.endIso, "2026-03-29T21:00:00.000Z");
  assert.equal((spring.end.getTime() - spring.start.getTime()) / 3600000, 167);
  const autumn = getCalendarPeriod("2026-10-25", "week");
  assert.equal((autumn.end.getTime() - autumn.start.getTime()) / 3600000, 169);
});

test("групування використовує місцевий день і залишає всі сесії одного дня", () => {
  const workout = (id, started_at) => ({
    id,
    started_at,
    name: null,
    finished_at: null,
    setsCount: 0,
    exerciseCount: 0,
    muscleGroups: [],
    durationMinutes: null,
  });
  const groups = groupCalendarWorkouts([
    workout("late", "2026-05-07T20:00:00Z"),
    workout("morning", "2026-05-06T22:30:00Z"),
    workout("previous", "2026-05-06T20:59:59Z"),
    workout("invalid", "invalid"),
    workout("missing", null),
  ]);
  assert.deepEqual(
    groups.get("2026-05-07").map(({ id }) => id),
    ["late", "morning"]
  );
  assert.deepEqual(
    groups.get("2026-05-06").map(({ id }) => id),
    ["previous"]
  );
  assert.equal(groups.size, 2);
});

test("невідома чи помилкова тривалість не перетворюється на нуль", () => {
  for (const [start, end] of [
    [null, null],
    ["2026-05-07T10:00:00Z", null],
    ["invalid", "invalid"],
    ["2026-05-07T11:00:00Z", "2026-05-07T10:00:00Z"],
  ]) {
    assert.equal(getWorkoutDurationMinutes(start, end), null);
  }
  assert.equal(getWorkoutDurationMinutes("2026-05-07T10:00:00Z", "2026-05-07T10:00:10Z"), 0);
  assert.equal(getWorkoutDurationMinutes("2026-05-07T10:00:00Z", "2026-05-07T11:15:00Z"), 75);
  assert.equal(formatCalendarDuration(null), "Тривалість не вказана");
  assert.equal(formatCalendarDuration(0), "<1\u00a0хв");
  assert.equal(formatCalendarDuration(75), "1\u00a0год 15\u00a0хв");
  assert.equal(formatCalendarDuration(1410), "23\u00a0год 30\u00a0хв");
});

test("посилання повернення зберігає дату, режим та фільтр дня", () => {
  const search = { date: "2026-05-07", view: "week", day: true };
  const path = buildCalendarReturnPath(search);
  assert.equal(path, "/calendar?date=2026-05-07&view=week&day=true");
  const params = Object.fromEntries(new URL(path, "https://prgrss.local").searchParams);
  assert.deepEqual(validateCalendarSearch(params, today), search);
  assert.equal(buildCalendarReturnPath({ date: "2026-05-07" }), "/calendar?date=2026-05-07");
});
