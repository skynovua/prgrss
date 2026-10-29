import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Award,
  ChevronRight,
  Dumbbell,
  Moon,
  Plus,
  Sun,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

import { useAchievements } from "@/entities/achievement";
import { RecentWorkouts } from "@/entities/workout";
import { useDashboard } from "@/pages/dashboard/model/use-dashboard";
import { cn, getWeekDays, getWeekStartsOn, toDateKey, toLocalDateKey } from "@/shared/lib";
import { useTheme } from "@/shared/theme";
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  PageError,
  PageLoading,
  RefreshNotice,
} from "@/shared/ui";

const LOCALE = "uk-UA";
const WEEK_LABELS = {
  zero: "тижнів",
  one: "тиждень",
  two: "тижні",
  few: "тижні",
  many: "тижнів",
  other: "тижня",
} satisfies Record<Intl.LDMLPluralRule, string>;

type CalendarWorkout = {
  id: string;
  name: string | null;
  started_at: string;
  setsCount: number;
};

function StatDiff({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 || current === previous) return null;
  const diff = Math.round(((current - previous) / previous) * 100);
  const Icon = diff > 0 ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs",
        diff > 0 ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="size-3" />
      {Math.abs(diff)}%
    </span>
  );
}

export default function DashboardPage() {
  const { data, isPending, isError, refetch } = useDashboard();
  const { data: achievements } = useAchievements();
  const { resolvedTheme, setTheme } = useTheme();

  if (isPending)
    return <PageLoading title="Головна" layout="stats" onRetry={() => void refetch()} />;
  if (!data) return <PageError title="Головна не завантажилася" onRetry={() => void refetch()} />;

  const { profile, recentWorkouts, weekStats, prevWeekStats, calendarWorkouts, streak } = data;
  const newAchievementsCount = new Set(
    (achievements ?? [])
      .filter(
        (achievement) => achievement.unlocked && achievement.unlockedAt && !achievement.seenAt
      )
      .map((achievement) => achievement.familyKey)
  ).size;
  const date = new Date().toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const volume =
    weekStats.volume >= 1000
      ? `${(weekStats.volume / 1000).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} т`
      : `${Math.round(weekStats.volume)} кг`;

  return (
    <div className="flex flex-1 flex-col gap-7 px-5 pt-6 pb-6 md:px-8 md:pt-8">
      {isError && <RefreshNotice onRetry={() => void refetch()} />}
      <header className="flex items-center justify-between gap-4">
        <span className="font-logo text-xl tracking-normal" aria-label="PRGRSS">
          PR<span className="text-primary">G</span>RSS
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              resolvedTheme === "light" ? "Увімкнути темну тему" : "Увімкнути світлу тему"
            }
            onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
          >
            {resolvedTheme === "light" ? <Moon /> : <Sun />}
          </Button>
          <Link
            to="/achievements"
            aria-label={
              newAchievementsCount > 0 ? `Досягнення: ${newAchievementsCount} нових` : "Досягнення"
            }
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
          >
            <Award />
            {newAchievementsCount > 0 && (
              <span className="bg-primary ring-background absolute top-2 right-2 size-2 rounded-full ring-2" />
            )}
          </Link>
          <Link
            to="/settings"
            aria-label="Відкрити профіль"
            className="ml-2 flex size-11 shrink-0 items-center justify-center"
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
            ) : (
              <span className="bg-secondary text-secondary-foreground flex size-9 items-center justify-center rounded-full text-sm font-medium">
                {profile.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </Link>
        </div>
      </header>

      <section className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm first-letter:uppercase">{date}</p>
        <h1 className="font-heading text-3xl leading-tight font-medium tracking-tight">
          Привіт, {profile.displayName}.
        </h1>
      </section>

      <Card className="gap-4 py-5">
        <CardHeader className="gap-3 px-5">
          <div className="flex items-center justify-between gap-3">
            <span className="bg-accent text-accent-foreground flex size-11 items-center justify-center rounded-xl">
              <Dumbbell className="size-5" />
            </span>
            <Badge variant="secondary">Твій час для себе</Badge>
          </div>
          <CardTitle className="text-xl">Нове тренування</CardTitle>
          <CardDescription>Крок за кроком. Підхід за підходом.</CardDescription>
        </CardHeader>
        <CardFooter className="px-5">
          <Link to="/workout/new" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
            <Plus data-icon="inline-start" />
            Почати тренування
          </Link>
        </CardFooter>
      </Card>

      <section className="flex flex-col gap-4" aria-labelledby="week-stats-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="week-stats-title" className="text-base font-semibold">
            Цього тижня
          </h2>
          <span className="text-muted-foreground text-xs">до минулого тижня</span>
        </div>
        <div className="divide-border grid grid-cols-3 divide-x">
          <WeekStat
            value={`${weekStats.workouts}`}
            label="Тренування"
            diff={<StatDiff current={weekStats.workouts} previous={prevWeekStats.workouts} />}
          />
          <WeekStat
            value={volume}
            label="Об’єм"
            diff={<StatDiff current={weekStats.volume} previous={prevWeekStats.volume} />}
          />
          <WeekStat
            value={`${weekStats.sets}`}
            label="Підходи"
            diff={<StatDiff current={weekStats.sets} previous={prevWeekStats.sets} />}
          />
        </div>
      </section>

      <WeekCalendar workouts={calendarWorkouts} streak={streak} />
      <RecentWorkouts workouts={recentWorkouts.slice(0, 3)} />
    </div>
  );
}

function WeekStat({ value, label, diff }: { value: string; label: string; diff: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 px-3 first:pl-0 last:pr-0 sm:px-5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-2xl font-medium tracking-tight tabular-nums">{value}</span>
        {diff}
      </div>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}

function WeekCalendar({ workouts, streak }: { workouts: CalendarWorkout[]; streak: number }) {
  const navigate = useNavigate();
  const today = new Date();
  const todayKey = toDateKey(today);
  const days = getWeekDays(today, {
    locale: LOCALE,
    weekStartsOn: getWeekStartsOn(LOCALE),
    weekdayFormat: "short",
  });
  const workoutsByDate = workouts.reduce((map, workout) => {
    if (!workout.started_at) return map;
    const key = toLocalDateKey(workout.started_at);
    map.set(key, [...(map.get(key) ?? []), workout]);
    return map;
  }, new Map<string, CalendarWorkout[]>());

  return (
    <Card className="gap-4 py-5">
      <CardHeader className="flex items-center justify-between px-5">
        <CardTitle>Мій тиждень</CardTitle>
        <Link
          to="/calendar"
          aria-label="Відкрити календар"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "-my-2 -mr-2")}
        >
          <ChevronRight />
        </Link>
      </CardHeader>
      <CardContent className="px-3 sm:px-5">
        <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
          {days.map((day) => {
            const dayWorkouts = workoutsByDate.get(day.key) ?? [];
            const isToday = day.key === todayKey;
            const classes = cn(
              "flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium tabular-nums",
              isToday
                ? "bg-primary text-primary-foreground"
                : dayWorkouts.length
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground",
              dayWorkouts.length > 0 &&
                "hover:bg-secondary hover:text-secondary-foreground transition-colors"
            );
            const label = `${day.dayNumber}, ${day.label}`;
            return (
              <div key={day.key} className="flex min-w-0 flex-col items-center gap-2">
                <span className="text-muted-foreground text-xs">{day.label}</span>
                {dayWorkouts.length === 1 ? (
                  <Link
                    to="/workout/$id"
                    params={{ id: dayWorkouts[0].id }}
                    aria-label={`Відкрити тренування за ${label}`}
                    aria-current={isToday ? "date" : undefined}
                    className={classes}
                  >
                    {day.dayNumber}
                  </Link>
                ) : dayWorkouts.length > 1 ? (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className={classes}
                          aria-label={`Обрати тренування за ${label}`}
                          aria-current={isToday ? "date" : undefined}
                        />
                      }
                    >
                      {day.dayNumber}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" sideOffset={8}>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Тренування за день</DropdownMenuLabel>
                        {dayWorkouts.map((workout) => (
                          <DropdownMenuItem
                            key={workout.id}
                            onClick={() =>
                              navigate({ to: "/workout/$id", params: { id: workout.id } })
                            }
                          >
                            <Dumbbell />
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate">{workout.name ?? "Тренування"}</span>
                              <span className="text-muted-foreground text-xs">
                                {new Date(workout.started_at).toLocaleTimeString(LOCALE, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                · {workout.setsCount} підх.
                              </span>
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className={classes} aria-current={isToday ? "date" : undefined}>
                    {day.dayNumber}
                  </span>
                )}
                <span
                  className={cn(
                    "size-1 rounded-full",
                    dayWorkouts.length > 0 ? "bg-primary" : "bg-transparent"
                  )}
                />
              </div>
            );
          })}
        </div>
        {streak > 0 && (
          <p className="text-muted-foreground mt-4 flex items-center gap-2 border-t pt-4 text-sm">
            <Zap className="text-primary size-4" />
            {streak} {WEEK_LABELS[new Intl.PluralRules(LOCALE).select(streak)]} поспіль. Продовжуй у
            своєму темпі.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
