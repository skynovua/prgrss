import { useEffect, useRef } from "react";

import { addDays, cn, getWeekStart, toDateKey } from "@/shared/lib";

import {
  CALENDAR_WEEKDAYS,
  type CalendarView,
  type CalendarWorkout,
  getCalendarDayLabel,
  getCalendarDays,
  getCalendarPeriodLabel,
  moveCalendarDate,
  parseCalendarDate,
} from "../model/calendar";

interface CalendarGridProps {
  dateKey: string;
  todayKey: string;
  view: CalendarView;
  selected: boolean;
  workouts: Map<string, CalendarWorkout[]>;
  status: "loading" | "error" | "ready";
  onSelect: (date: string) => void;
}

export function CalendarGrid({
  dateKey,
  todayKey,
  view,
  selected,
  workouts,
  status,
  onSelect,
}: CalendarGridProps) {
  const days = getCalendarDays(dateKey, view);
  const selectedButton = useRef<HTMLButtonElement>(null);
  const focusAfterNavigation = useRef(false);

  useEffect(() => {
    if (!focusAfterNavigation.current) return;
    selectedButton.current?.focus();
    focusAfterNavigation.current = false;
  }, [dateKey]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const date = parseCalendarDate(dateKey)!;
    const shifts: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    let next: string;
    if (event.key in shifts) next = toDateKey(addDays(date, shifts[event.key]));
    else if (event.key === "Home") next = toDateKey(getWeekStart(date, 1));
    else if (event.key === "End") next = toDateKey(addDays(getWeekStart(date, 1), 6));
    else if (event.key === "PageUp" || event.key === "PageDown")
      next = moveCalendarDate(dateKey, "month", event.key === "PageUp" ? -1 : 1, todayKey);
    else return;
    event.preventDefault();
    if (!parseCalendarDate(next) || next > todayKey || next === dateKey) return;
    focusAfterNavigation.current = true;
    onSelect(next);
  };

  return (
    <div
      role="grid"
      aria-label={getCalendarPeriodLabel(dateKey, view)}
      aria-colcount={7}
      aria-busy={status === "loading"}
      className="flex flex-col gap-1"
    >
      <div role="row" className="grid grid-cols-7 sm:gap-1">
        {CALENDAR_WEEKDAYS.map((day) => (
          <span
            key={day}
            role="columnheader"
            className="text-muted-foreground pb-1 text-center text-xs"
          >
            {day}
          </span>
        ))}
      </div>
      {Array.from({ length: days.length / 7 }, (_, week) => (
        <div role="row" key={week} className="grid grid-cols-7 sm:gap-1">
          {days.slice(week * 7, week * 7 + 7).map((key, index) => {
            if (!key) return <div key={`empty-${index}`} role="gridcell" />;
            const isToday = key === todayKey;
            const isSelected = selected && key === dateKey;
            const count = workouts.get(key)?.length ?? 0;
            return (
              <div role="gridcell" key={key} aria-selected={isSelected}>
                <button
                  ref={key === dateKey ? selectedButton : undefined}
                  type="button"
                  tabIndex={key === dateKey ? 0 : -1}
                  aria-label={`${getCalendarDayLabel(key)} ${parseCalendarDate(key)!.getFullYear()}, ${status === "loading" ? "тренування завантажуються" : status === "error" ? "дані тренувань недоступні" : `тренувань: ${count}`}${isToday ? ", сьогодні" : ""}`}
                  aria-current={isToday ? "date" : undefined}
                  disabled={key > todayKey}
                  onClick={() => onSelect(key)}
                  onKeyDown={handleKeyDown}
                  className="hover:bg-muted focus-visible:ring-ring flex h-13 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-35 sm:h-14"
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-xl text-sm font-medium tabular-nums",
                      isSelected && "bg-primary text-primary-foreground",
                      isToday && !isSelected && "ring-primary/65 ring-1"
                    )}
                  >
                    {parseCalendarDate(key)!.getDate()}
                  </span>
                  <span className="flex h-1.5 items-center justify-center gap-1" aria-hidden="true">
                    {status === "ready" && count > 0 && (
                      <span className="bg-primary size-1 rounded-full" />
                    )}
                    {status === "ready" && count > 1 && (
                      <span className="bg-primary size-1 rounded-full" />
                    )}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
