"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkoutDay {
  id: string;
  name: string | null;
  started_at: string;
  setsCount: number;
}

interface WorkoutCalendarProps {
  workouts: WorkoutDay[];
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

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Понеділок = 0, Неділя = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: (number | null)[] = [];
  // Порожні клітинки до першого дня
  for (let i = 0; i < startDow; i++) {
    days.push(null);
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(d);
  }
  return days;
}

export function WorkoutCalendar({ workouts }: WorkoutCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Мапа: "YYYY-MM-DD" → WorkoutDay[]
  const workoutMap = useMemo(() => {
    const map = new Map<string, WorkoutDay[]>();
    for (const w of workouts) {
      const date = w.started_at.slice(0, 10);
      const existing = map.get(date) ?? [];
      existing.push(w);
      map.set(date, existing);
    }
    return map;
  }, [workouts]);

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  function prevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
    setSelectedDay(null);
  }

  function dateKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const selectedWorkouts = selectedDay ? (workoutMap.get(dateKey(selectedDay)) ?? []) : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-sm font-semibold">
            {MONTH_NAMES[month]} {year}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {/* Дні тижня */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DAY_NAMES.map((d) => (
            <span
              key={d}
              className="text-muted-foreground text-center text-[10px] font-medium uppercase"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Клітинки днів */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} />;
            }

            const key = dateKey(day);
            const hasWorkout = workoutMap.has(key);
            const workoutCount = workoutMap.get(key)?.length ?? 0;
            const isToday = isCurrentMonth && day === today;
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={cn(
                  "relative flex h-9 w-full items-center justify-center rounded-lg text-sm transition-colors",
                  isToday && !isSelected && "ring-primary/50 ring-1",
                  isSelected && "bg-primary text-primary-foreground",
                  !isSelected && hasWorkout && "bg-primary/15 font-medium",
                  !isSelected && !hasWorkout && "hover:bg-accent"
                )}
              >
                {day}
                {hasWorkout && !isSelected && (
                  <span className="bg-primary absolute bottom-1 h-1 w-1 rounded-full" />
                )}
                {hasWorkout && workoutCount > 1 && !isSelected && (
                  <span className="bg-primary absolute right-0.5 bottom-1 h-1 w-1 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Тренування вибраного дня */}
        {selectedDay !== null && selectedWorkouts.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 border-t pt-3">
            {selectedWorkouts.map((w) => (
              <Link
                key={w.id}
                href={`/workout/${w.id}`}
                className="hover:bg-accent flex items-center justify-between rounded-lg px-2 py-2 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{w.name ?? "Тренування"}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(w.started_at).toLocaleTimeString("uk-UA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {w.setsCount} підходів
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground h-4 w-4" />
              </Link>
            ))}
          </div>
        )}

        {selectedDay !== null && selectedWorkouts.length === 0 && (
          <p className="text-muted-foreground mt-3 border-t pt-3 text-center text-xs">
            Немає тренувань
          </p>
        )}
      </CardContent>
    </Card>
  );
}
