import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { toLocalDateKey } from "@/shared/lib";
import { cn } from "@/shared/lib";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { Button } from "@/shared/ui";

interface WorkoutDay {
  id: string;
  name: string | null;
  started_at: string;
  setsCount: number;
}

interface WorkoutCalendarProps {
  workouts: WorkoutDay[];
  variant?: "week" | "month" | "months";
  showCalendarLink?: boolean;
}

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const MONTH_NAMES = [
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

function getMonthDays(year: number, month: number, weekStartsOn: "monday" | "sunday" = "monday") {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay();

  if (weekStartsOn === "monday") {
    startDow -= 1;
    if (startDow < 0) startDow = 6;
  }

  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) {
    days.push(null);
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(d);
  }
  return days;
}

function formatMonthLabel(year: number, month: number) {
  return `${MONTH_NAMES[month].toLowerCase()} ${year} р.`;
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getWeekStart(date: Date) {
  const result = new Date(date);
  const dow = result.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getMonthLabel(year: number, month: number) {
  return `${MONTH_NAMES[month]} ${year}`;
}

function buildWorkoutMap(workouts: WorkoutDay[]) {
  const map = new Map<string, WorkoutDay[]>();
  for (const workout of workouts) {
    const date = toLocalDateKey(workout.started_at);
    const existing = map.get(date) ?? [];
    map.set(date, [...existing, workout]);
  }
  return map;
}

function getScrollableMonths(workouts: WorkoutDay[]) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const futureBoundary = new Date(currentYear, currentMonth + 3, 1);

  const earliestWorkout = workouts.reduce<Date | null>((earliest, workout) => {
    const workoutDate = new Date(workout.started_at);
    if (Number.isNaN(workoutDate.getTime())) return earliest;
    if (!earliest || workoutDate < earliest) return workoutDate;
    return earliest;
  }, null);

  const earliestYear = earliestWorkout ? earliestWorkout.getFullYear() : currentYear;

  const months: Array<{ year: number; month: number }> = [];

  for (let year = earliestYear; year <= futureBoundary.getFullYear(); year += 1) {
    const monthStart = year === earliestYear ? 0 : 0;
    const monthEnd = year === futureBoundary.getFullYear() ? futureBoundary.getMonth() : 11;

    for (let month = monthStart; month <= monthEnd; month += 1) {
      months.push({ year, month });
    }
  }

  return months;
}

function CalendarWorkoutList({ workouts }: { workouts: WorkoutDay[] }) {
  if (workouts.length === 0) {
    return <p className="text-muted-foreground text-center text-xs">Немає тренувань</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {workouts.map((workout) => (
        <Link
          key={workout.id}
          to="/workout/$id"
          params={{ id: workout.id }}
          className="hover:bg-accent flex items-center justify-between rounded-xl px-2 py-2 transition-colors"
        >
          <div>
            <p className="text-sm font-medium">{workout.name ?? "Тренування"}</p>
            <p className="text-muted-foreground text-xs">
              {new Date(workout.started_at).toLocaleTimeString("uk-UA", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · {workout.setsCount} підходів
            </p>
          </div>
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
        </Link>
      ))}
    </div>
  );
}

function MonthCalendarCard({
  year,
  month,
  workoutMap,
  selectedDateKey,
  onSelectDateKey,
  onPrev,
  onNext,
}: {
  year: number;
  month: number;
  workoutMap: Map<string, WorkoutDay[]>;
  selectedDateKey: string | null;
  onSelectDateKey: (dateKey: string | null) => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const now = new Date();
  const days = getMonthDays(year, month);
  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const selectedWorkouts =
    selectedDateKey && selectedDateKey.startsWith(monthPrefix)
      ? (workoutMap.get(selectedDateKey) ?? [])
      : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          {onPrev ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <div className="h-8 w-8" />
          )}

          <CardTitle className="text-sm font-semibold">{getMonthLabel(year, month)}</CardTitle>

          {onNext ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3">
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DAY_NAMES.map((dayName) => (
            <span
              key={dayName}
              className="text-muted-foreground text-center text-[10px] font-medium uppercase"
            >
              {dayName}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${year}-${month}-${index}`} />;
            }

            const dateKey = formatDateKey(year, month, day);
            const workoutCount = workoutMap.get(dateKey)?.length ?? 0;
            const isSelected = selectedDateKey === dateKey;
            const isToday = isCurrentMonth && day === today;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => onSelectDateKey(isSelected ? null : dateKey)}
                className={cn(
                  "relative flex h-9 w-full items-center justify-center rounded-lg text-sm transition-colors",
                  isToday && !isSelected && "ring-primary/50 ring-1",
                  isSelected && "bg-primary text-primary-foreground",
                  !isSelected && workoutCount >= 2 && "bg-primary/30 text-primary font-semibold",
                  !isSelected && workoutCount === 1 && "bg-primary/15 text-primary font-medium",
                  !isSelected && workoutCount === 0 && "hover:bg-accent"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        {selectedDateKey && selectedDateKey.startsWith(monthPrefix) && (
          <div className="mt-3 border-t pt-3">
            <CalendarWorkoutList workouts={selectedWorkouts} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlainMonthCalendarSection({
  year,
  month,
  workoutMap,
  selectedDateKey,
  onSelectDateKey,
}: {
  year: number;
  month: number;
  workoutMap: Map<string, WorkoutDay[]>;
  selectedDateKey: string | null;
  onSelectDateKey: (dateKey: string | null) => void;
}) {
  const now = new Date();
  const days = getMonthDays(year, month, "monday");
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const selectedWorkouts =
    selectedDateKey && selectedDateKey.startsWith(monthPrefix)
      ? (workoutMap.get(selectedDateKey) ?? [])
      : [];

  return (
    <Card className="p-0">
      <CardContent className="px-4 py-4">
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {formatMonthLabel(year, month)}
            </h2>
          </div>

          <div className="grid grid-cols-7 gap-x-1 gap-y-3 text-center">
            {DAY_NAMES.map((dayName) => (
              <span
                key={dayName}
                className="text-muted-foreground text-[11px] font-medium uppercase"
              >
                {dayName}
              </span>
            ))}

            {days.map((day, index) => {
              if (day === null) {
                return <div key={`plain-empty-${year}-${month}-${index}`} className="h-13" />;
              }

              const dateKey = formatDateKey(year, month, day);
              const workoutCount = workoutMap.get(dateKey)?.length ?? 0;
              const isSelected = selectedDateKey === dateKey;
              const isToday =
                year === now.getFullYear() && month === now.getMonth() && day === now.getDate();

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => onSelectDateKey(isSelected ? null : dateKey)}
                  className="relative flex h-13 items-center justify-center"
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold transition-colors",
                      isSelected && "bg-primary text-primary-foreground",
                      !isSelected && workoutCount > 0 && "bg-primary/10 text-primary",
                      !isSelected && workoutCount === 0 && "text-foreground hover:bg-accent",
                      isToday &&
                        !isSelected &&
                        "ring-primary/45 ring-offset-background ring-2 ring-offset-2"
                    )}
                  >
                    {day}
                  </span>

                  {workoutCount > 1 && (
                    <span className="bg-foreground text-background absolute top-0 right-0 inline-flex min-h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-semibold shadow-sm">
                      {workoutCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDateKey && selectedDateKey.startsWith(monthPrefix) && (
            <div className="bg-muted/35 rounded-3xl p-3">
              <CalendarWorkoutList workouts={selectedWorkouts} />
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

export function WorkoutCalendar({
  workouts,
  variant = "month",
  showCalendarLink = false,
}: WorkoutCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const workoutMap = useMemo(() => buildWorkoutMap(workouts), [workouts]);
  const months = useMemo(() => getScrollableMonths(workouts), [workouts]);
  const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const currentMonthRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (variant !== "months") return;

    currentMonthRef.current?.scrollIntoView({ block: "start" });
  }, [variant]);

  function prevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
    setSelectedDateKey(null);
  }

  function nextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
    setSelectedDateKey(null);
  }

  if (variant === "week") {
    const weekStart = getWeekStart(now);
    const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    const weekRangeLabel = `${weekDates[0].getDate()} ${MONTH_NAMES[weekDates[0].getMonth()].slice(0, 3)} - ${weekDates[6].getDate()} ${MONTH_NAMES[weekDates[6].getMonth()].slice(0, 3)}`;
    const selectedWorkouts = selectedDateKey ? (workoutMap.get(selectedDateKey) ?? []) : [];

    return (
      <Card size="sm" className="p-0">
        <CardContent className="px-3 py-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold tracking-tight">Цей тиждень</p>
              <p className="text-muted-foreground mt-0.5 text-xs">{weekRangeLabel}</p>
            </div>

            {showCalendarLink && (
              <Link
                to="/calendar"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-sm transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {weekDates.map((date) => {
              const dateKey = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
              const workoutCount = workoutMap.get(dateKey)?.length ?? 0;
              const isSelected = selectedDateKey === dateKey;
              const isToday =
                date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth() &&
                date.getDate() === now.getDate();

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(isSelected ? null : dateKey)}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center transition-colors",
                    isSelected && "bg-primary text-primary-foreground",
                    isToday && !isSelected && "ring-primary/50 ring-1",
                    !isSelected && workoutCount > 0 && "bg-primary/10 text-primary",
                    !isSelected && workoutCount === 0 && "bg-muted/45 hover:bg-accent"
                  )}
                >
                  <span className="text-[10px] font-medium uppercase">
                    {DAY_NAMES[(date.getDay() + 6) % 7]}
                  </span>
                  <span className="text-sm font-semibold">{date.getDate()}</span>
                  <span className="text-[10px] opacity-70">
                    {workoutCount > 0 ? `${workoutCount}×` : "-"}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedDateKey && (
            <div className="mt-3 border-t pt-3">
              <CalendarWorkoutList workouts={selectedWorkouts} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "months") {
    return (
      <div className="flex flex-col gap-12">
        {months.map(({ year, month }) => {
          const monthKey = `${year}-${month}`;

          return (
            <div key={monthKey} ref={monthKey === currentMonthKey ? currentMonthRef : undefined}>
              <PlainMonthCalendarSection
                year={year}
                month={month}
                workoutMap={workoutMap}
                selectedDateKey={selectedDateKey}
                onSelectDateKey={setSelectedDateKey}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <MonthCalendarCard
      year={year}
      month={month}
      workoutMap={workoutMap}
      selectedDateKey={selectedDateKey}
      onSelectDateKey={setSelectedDateKey}
      onPrev={prevMonth}
      onNext={nextMonth}
    />
  );
}
