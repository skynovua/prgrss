export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WeekDayInfo {
  date: Date;
  key: string;
  dayNumber: number;
  label: string;
}

const SUNDAY_BASE_DATE = new Date(2026, 0, 4);
const SUNDAY_START_REGIONS = new Set(["AS", "CA", "GU", "IL", "JP", "PH", "PR", "TW", "UM", "US"]);
const SATURDAY_START_REGIONS = new Set([
  "AE",
  "AF",
  "BH",
  "DJ",
  "DZ",
  "EG",
  "IQ",
  "IR",
  "JO",
  "KW",
  "LY",
  "OM",
  "QA",
  "SD",
  "SY",
  "YE",
]);

function getLocaleRegion(locale: string) {
  try {
    const localeWithRegion = new Intl.Locale(locale);
    return localeWithRegion.region?.toUpperCase() ?? null;
  } catch {
    const match = locale.match(/[-_]([A-Za-z]{2}|\d{3})(?:[-_]|$)/);
    return match?.[1]?.toUpperCase() ?? null;
  }
}

function getIntlWeekStart(locale: string): WeekStartsOn | null {
  try {
    const localeWithWeekInfo = new Intl.Locale(locale) as Intl.Locale & {
      weekInfo?: { firstDay?: number };
    };
    const firstDay = localeWithWeekInfo.weekInfo?.firstDay;
    if (!firstDay) return null;
    return (firstDay % 7) as WeekStartsOn;
  } catch {
    return null;
  }
}

export function getWeekStartsOn(locale: string, fallback: WeekStartsOn = 1): WeekStartsOn {
  const intlWeekStart = getIntlWeekStart(locale);
  if (intlWeekStart !== null) return intlWeekStart;

  const region = getLocaleRegion(locale);
  if (!region) return fallback;
  if (SUNDAY_START_REGIONS.has(region)) return 0;
  if (SATURDAY_START_REGIONS.has(region)) return 6;
  return fallback;
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function getWeekStart(date: Date, weekStartsOn: WeekStartsOn = 1) {
  const result = new Date(date);
  const diff = (result.getDay() - weekStartsOn + 7) % 7;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getWeekdayLabels(
  locale: string,
  weekStartsOn: WeekStartsOn = getWeekStartsOn(locale),
  format: "narrow" | "short" | "long" = "short"
) {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: format });

  return Array.from({ length: 7 }, (_, index) => {
    const weekdayIndex = (weekStartsOn + index) % 7;
    const date = addDays(SUNDAY_BASE_DATE, weekdayIndex);
    return formatter.format(date).toLocaleUpperCase(locale);
  });
}

export function getWeekDays(
  date: Date,
  {
    locale,
    weekStartsOn = getWeekStartsOn(locale),
    weekdayFormat = "short",
  }: {
    locale: string;
    weekStartsOn?: WeekStartsOn;
    weekdayFormat?: "narrow" | "short" | "long";
  }
): WeekDayInfo[] {
  const weekStart = getWeekStart(date, weekStartsOn);
  const labels = getWeekdayLabels(locale, weekStartsOn, weekdayFormat);

  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart, index);
    return {
      date: day,
      key: toDateKey(day),
      dayNumber: day.getDate(),
      label: labels[index],
    };
  });
}
