import type { Database } from "@/shared/db";
import { addDays, getWeekStart, toDateKey } from "@/shared/lib";

export type CalendarView = "month" | "week";
export interface CalendarSearch {
  date?: string;
  view?: "week";
  day?: true;
}

export type CalendarWorkout = Pick<
  Database["public"]["Tables"]["workouts"]["Row"],
  "id" | "name" | "started_at" | "finished_at"
> & {
  setsCount: number;
  exerciseCount: number;
  muscleGroups: string[];
  durationMinutes: number | null;
};

export const CALENDAR_MIN_YEAR = 1970;
export const CALENDAR_MONTHS = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
];
export const CALENDAR_WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export function parseCalendarDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year < CALENDAR_MIN_YEAR || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  return toDateKey(date) === value ? date : null;
}

export function validateCalendarSearch(
  search: Record<string, unknown>,
  now = new Date()
): CalendarSearch {
  const date = parseCalendarDate(search.date);
  const today = toDateKey(now);
  const weekView = search.view === "week";
  return {
    date: date ? (toDateKey(date) > today ? today : toDateKey(date)) : undefined,
    view: weekView ? "week" : undefined,
    day: weekView && (search.day === true || search.day === "true") ? true : undefined,
  };
}

export function getCalendarPeriod(dateKey: string, view: CalendarView) {
  const date = parseCalendarDate(dateKey)!;
  const start =
    view === "month" ? new Date(date.getFullYear(), date.getMonth(), 1) : getWeekStart(date, 1);
  const end =
    view === "month" ? new Date(date.getFullYear(), date.getMonth() + 1, 1) : addDays(start, 7);
  return {
    start,
    end,
    startKey: toDateKey(start),
    endKey: toDateKey(end),
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export function getCalendarDays(dateKey: string, view: CalendarView): (string | null)[] {
  const { start, end } = getCalendarPeriod(dateKey, view);
  if (view === "week")
    return Array.from({ length: 7 }, (_, index) => {
      const key = toDateKey(addDays(start, index));
      return key < `${CALENDAR_MIN_YEAR}-01-01` ? null : key;
    });
  const offset = (start.getDay() + 6) % 7;
  const daysInMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  const days: (string | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= daysInMonth; day++)
    days.push(toDateKey(new Date(start.getFullYear(), start.getMonth(), day)));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export function moveCalendarDate(
  dateKey: string,
  view: CalendarView,
  direction: -1 | 1,
  todayKey: string
) {
  const date = parseCalendarDate(dateKey)!;
  let target: Date;
  if (view === "week") target = addDays(date, direction * 7);
  else {
    const month = new Date(date.getFullYear(), date.getMonth() + direction, 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    target = new Date(month.getFullYear(), month.getMonth(), Math.min(date.getDate(), lastDay));
  }
  return toDateKey(target) > todayKey
    ? todayKey
    : target.getFullYear() < CALENDAR_MIN_YEAR
      ? `${CALENDAR_MIN_YEAR}-01-01`
      : toDateKey(target);
}

export function getCalendarDayLabel(dateKey: string) {
  const label = parseCalendarDate(dateKey)!.toLocaleDateString("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label[0].toLocaleUpperCase("uk-UA") + label.slice(1);
}

export function getCalendarPeriodLabel(dateKey: string, view: CalendarView) {
  const date = parseCalendarDate(dateKey)!;
  if (view === "month") return `${CALENDAR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  const { start, end } = getCalendarPeriod(dateKey, "week");
  const last = addDays(end, -1);
  const format = (day: Date) => day.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
  return `${format(start)}${start.getFullYear() !== last.getFullYear() ? ` ${start.getFullYear()}` : ""} — ${format(last)} ${last.getFullYear()}`;
}

export function getWorkoutDurationMinutes(startedAt: string | null, finishedAt: string | null) {
  if (!startedAt || !finishedAt) return null;
  const milliseconds = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  return Number.isFinite(milliseconds) && milliseconds >= 0
    ? Math.round(milliseconds / 60000)
    : null;
}

export function formatCalendarDuration(minutes: number | null) {
  if (minutes == null) return "Тривалість не вказана";
  if (minutes === 0) return "<1\u00a0хв";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0
    ? `${hours}\u00a0год${remainder > 0 ? ` ${remainder}\u00a0хв` : ""}`
    : `${minutes}\u00a0хв`;
}

export function groupCalendarWorkouts(workouts: CalendarWorkout[]) {
  const byDate = new Map<string, CalendarWorkout[]>();
  for (const workout of workouts) {
    if (!workout.started_at) continue;
    const date = new Date(workout.started_at);
    if (Number.isNaN(date.getTime())) continue;
    const key = toDateKey(date);
    byDate.set(key, [...(byDate.get(key) ?? []), workout]);
  }
  for (const day of byDate.values())
    day.sort((a, b) => (b.started_at ?? "").localeCompare(a.started_at ?? ""));
  return byDate;
}

export function buildCalendarReturnPath(search: CalendarSearch) {
  const params = new URLSearchParams();
  if (search.date) params.set("date", search.date);
  if (search.view) params.set("view", search.view);
  if (search.day) params.set("day", "true");
  return `/calendar${params.size ? `?${params}` : ""}`;
}
