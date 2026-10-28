import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { toDateKey } from "@/shared/lib";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  LoaderBar,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";

import {
  buildCalendarReturnPath,
  CALENDAR_MIN_YEAR,
  type CalendarSearch,
  type CalendarView,
  formatCalendarDuration,
  getCalendarDayLabel,
  getCalendarPeriod,
  getCalendarPeriodLabel,
  groupCalendarWorkouts,
  moveCalendarDate,
} from "../model/calendar";
import { useCalendarWorkouts } from "../model/use-calendar-workouts";
import { CalendarGrid } from "./calendar-grid";
import { CalendarPeriodPicker } from "./calendar-period-picker";
import { CalendarSessions } from "./calendar-sessions";

export default function CalendarPage() {
  const search = useSearch({ from: "/app/calendar" });
  const navigate = useNavigate({ from: "/calendar" });
  const todayKey = toDateKey(new Date());
  const dateKey = search.date ?? todayKey;
  const view: CalendarView = search.view === "week" ? "week" : "month";
  const dayOnly = view === "month" || search.day === true;
  const {
    data: workouts,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useCalendarWorkouts(dateKey, view);
  const [pickerOpen, setPickerOpen] = useState(false);
  const workoutMap = useMemo(() => groupCalendarWorkouts(workouts ?? []), [workouts]);
  const period = getCalendarPeriod(dateKey, view);
  const currentPeriod = getCalendarPeriod(todayKey, view);
  const canGoNext = period.startKey < currentPeriod.startKey;
  const canGoPrev = period.startKey > `${CALENDAR_MIN_YEAR}-01-01`;
  const selectedWorkouts = workoutMap.get(dateKey) ?? [];
  const weekGroups = [...workoutMap.entries()].sort(([a], [b]) => b.localeCompare(a));
  const returnTo = buildCalendarReturnPath({ date: dateKey, view: search.view, day: search.day });
  const durationRecords = (workouts ?? []).filter((workout) => workout.durationMinutes != null);
  const totalMinutes = durationRecords.reduce((sum, workout) => sum + workout.durationMinutes!, 0);
  const durationLabel =
    workouts?.length === 0
      ? "0 хв"
      : durationRecords.length
        ? formatCalendarDuration(totalMinutes)
        : "—";

  const updateSearch = (next: CalendarSearch) => {
    void navigate({ search: next, replace: true, resetScroll: false });
  };
  const selectDate = (date: string) =>
    updateSearch({ date, view: search.view, day: view === "week" ? true : undefined });
  const movePeriod = (direction: -1 | 1) =>
    updateSearch({ date: moveCalendarDate(dateKey, view, direction, todayKey), view: search.view });

  const content = (
    <>
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={view === "month" ? "Попередній місяць" : "Попередній тиждень"}
          onClick={() => movePeriod(-1)}
          disabled={!canGoPrev}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="ghost"
          className="min-w-0 px-1"
          onClick={() => setPickerOpen(true)}
          aria-label={`Обрати місяць і рік, ${getCalendarPeriodLabel(dateKey, view)}`}
        >
          <span className="whitespace-normal">{getCalendarPeriodLabel(dateKey, view)}</span>
          <ChevronDown data-icon="inline-end" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={view === "month" ? "Наступний місяць" : "Наступний тиждень"}
          onClick={() => movePeriod(1)}
          disabled={!canGoNext}
        >
          <ChevronRight />
        </Button>
      </div>
      <dl
        className="grid grid-cols-2 gap-5 border-b px-1 pb-5"
        aria-label={view === "month" ? "Підсумок місяця" : "Підсумок тижня"}
      >
        <div>
          <dt className="text-muted-foreground text-xs">
            Тренування {view === "month" ? "за місяць" : "за тиждень"}
          </dt>
          <dd className="mt-1 text-2xl font-medium tabular-nums">
            {isPending || isError || !workouts ? "—" : workouts.length}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Час у записах</dt>
          <dd className="mt-1 text-xl font-medium tabular-nums sm:text-2xl">
            {isPending || isError || !workouts ? "—" : durationLabel}
          </dd>
        </div>
      </dl>
      <div className="grid items-start gap-6 md:grid-cols-2 md:gap-8">
        <section
          className="flex min-w-0 flex-col gap-3"
          aria-label={view === "month" ? "Дні місяця" : "Дні тижня"}
        >
          <CalendarGrid
            dateKey={dateKey}
            todayKey={todayKey}
            view={view}
            selected={dayOnly}
            workouts={workoutMap}
            status={isPending ? "loading" : isError ? "error" : "ready"}
            onSelect={selectDate}
          />
          <div
            className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs"
            aria-label="Позначення календаря"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />
              Тренування
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="ring-primary/65 size-3 rounded-sm ring-1" aria-hidden="true" />
              Сьогодні
            </span>
          </div>
        </section>
        <section className="flex min-w-0 flex-col gap-4" aria-busy={isPending}>
          <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-medium">
              {dayOnly ? getCalendarDayLabel(dateKey) : "Тренування за тиждень"}
            </h2>
            {view === "week" && dayOnly ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateSearch({ date: dateKey, view: "week" })}
              >
                Увесь тиждень
              </Button>
            ) : dayOnly && !isPending && !isError ? (
              <span className="text-muted-foreground text-xs">
                Сесії: {selectedWorkouts.length}
              </span>
            ) : null}
          </div>
          {isPending ? (
            <div
              role="status"
              className="text-muted-foreground flex min-h-32 items-center justify-center gap-2 text-sm"
            >
              <Loader2 className="size-4 animate-spin" />
              <span>Завантажую тренування…</span>
            </div>
          ) : isError ? (
            <Empty className="px-2 py-8">
              <EmptyHeader>
                <EmptyTitle>Не вдалося завантажити тренування</EmptyTitle>
                <EmptyDescription>Перевір з’єднання й спробуй ще раз.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => void refetch()}>
                  Спробувати ще раз
                </Button>
              </EmptyContent>
            </Empty>
          ) : dayOnly ? (
            <CalendarSessions workouts={selectedWorkouts} returnTo={returnTo} />
          ) : weekGroups.length === 0 ? (
            <CalendarSessions workouts={[]} returnTo={returnTo} week />
          ) : (
            <div className="flex flex-col gap-6">
              {weekGroups.map(([date, sessions]) => (
                <section key={date} className="flex flex-col gap-2">
                  <h3 className="text-muted-foreground text-sm">{getCalendarDayLabel(date)}</h3>
                  <CalendarSessions workouts={sessions} returnTo={returnTo} />
                </section>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pt-6 pb-6 sm:px-6 md:px-8">
      {isFetching && <LoaderBar />}
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          render={<Link to="/dashboard" />}
          nativeButton={false}
          aria-label="На головну"
        >
          <ChevronLeft />
        </Button>
        <h1 className="min-w-0 flex-1 text-2xl font-medium tracking-tight">Календар</h1>
        <Button
          variant="outline"
          onClick={() => updateSearch({ date: todayKey, view: search.view })}
        >
          Сьогодні
        </Button>
      </header>
      <Tabs
        value={view}
        onValueChange={(value) =>
          updateSearch({ date: dateKey, view: value === "week" ? "week" : undefined })
        }
        className="gap-5"
      >
        <TabsList className="h-11 w-full sm:w-fit" aria-label="Вигляд календаря">
          <TabsTrigger value="month">Місяць</TabsTrigger>
          <TabsTrigger value="week">Тиждень і стрічка</TabsTrigger>
        </TabsList>
        <TabsContent value={view} className="flex flex-col gap-5">
          {content}
        </TabsContent>
      </Tabs>
      <p className="sr-only" role="status" aria-live="polite">
        {!isPending && !isError
          ? `${getCalendarPeriodLabel(dateKey, view)}. Тренувань: ${workouts?.length ?? 0}.${dayOnly ? ` ${getCalendarDayLabel(dateKey)}, сесій: ${selectedWorkouts.length}.` : ""}`
          : ""}
      </p>
      <CalendarPeriodPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        dateKey={dateKey}
        todayKey={todayKey}
        onSelect={(date) => updateSearch({ date, view: search.view })}
      />
    </div>
  );
}
