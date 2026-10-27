import type { Period } from "@/entities/progress";

import type { fetchTrainingDays } from "../api/training-days";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 днів" },
  { value: "30d", label: "30 днів" },
  { value: "90d", label: "90 днів" },
  { value: "all", label: "Весь час" },
];

export function formatNumber(value: number) {
  return value.toLocaleString("uk-UA", { maximumFractionDigits: 1 });
}

export function formatVolume(value: number) {
  return value >= 1000 ? `${formatNumber(value / 1000)} т` : `${formatNumber(value)} кг`;
}

export function formatCount(value: number, forms: [string, string, string]) {
  const plural = new Intl.PluralRules("uk-UA").select(value);
  return `${formatNumber(value)} ${forms[plural === "one" ? 0 : plural === "few" ? 1 : 2]}`;
}

export function getStatisticsSince(period: Period, now = new Date()) {
  if (period === "all") return null;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - Number.parseInt(period, 10) + 1);
  return start.toISOString();
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type TrainingDays = Awaited<ReturnType<typeof fetchTrainingDays>>;
type BucketUnit = "day" | "week" | "month" | "year";

function bucketStart(date: Date, unit: BucketUnit) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  if (unit === "week") result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  if (unit === "month") result.setDate(1);
  if (unit === "year") result.setMonth(0, 1);
  return result;
}

function nextBucket(date: Date, unit: BucketUnit) {
  const next = new Date(date);
  if (unit === "day" || unit === "week") next.setDate(next.getDate() + (unit === "week" ? 7 : 1));
  if (unit === "month") next.setMonth(next.getMonth() + 1);
  if (unit === "year") next.setFullYear(next.getFullYear() + 1);
  return next;
}

export function buildActivityTimeline(workouts: TrainingDays, period: Period, now = new Date()) {
  const since = getStatisticsSince(period, now);
  const unique = [...new Map(workouts.map((workout) => [workout.id, workout])).values()];
  const dates = unique
    .flatMap((workout) => (workout.started_at ? [new Date(workout.started_at)] : []))
    .filter(
      (date) =>
        Number.isFinite(date.getTime()) && date <= now && (!since || date >= new Date(since))
    )
    .sort((a, b) => a.getTime() - b.getTime());
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() - 29);
  const start = since ? new Date(since) : (dates[0] ?? fallback);
  const months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  const unit: BucketUnit =
    period === "all" ? (months > 23 ? "year" : "month") : period === "90d" ? "week" : "day";
  const points = [];
  const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  for (let cursor = bucketStart(start, unit); cursor <= now; cursor = nextBucket(cursor, unit)) {
    const end = nextBucket(cursor, unit);
    end.setMilliseconds(end.getMilliseconds() - 1);
    const rangeStart = cursor < start ? start : cursor;
    const rangeEnd = end > now ? now : end;
    points.push({
      key: dateKey(cursor),
      label: cursor.toLocaleDateString(
        "uk-UA",
        unit === "year"
          ? { year: "numeric" }
          : unit === "month"
            ? { month: "short", year: "2-digit" }
            : { day: "numeric", month: "short" }
      ),
      range:
        unit === "day"
          ? dateFormatter.format(cursor)
          : dateFormatter.formatRange(rangeStart, rangeEnd),
      count: 0,
    });
  }
  const indexed = new Map(points.map((point) => [point.key, point]));
  for (const date of dates) {
    const point = indexed.get(dateKey(bucketStart(date, unit)));
    if (point) point.count += 1;
  }
  return {
    points,
    unit,
    activeDays: new Set(dates.map(dateKey)).size,
    range: dateFormatter.formatRange(start, now),
  };
}
