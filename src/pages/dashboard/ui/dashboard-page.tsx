import {
  Dumbbell,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Award,
  Flame,
  Plus,
  MoreHorizontal,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useDashboard } from "@/pages/dashboard/model/use-dashboard";
import { useAchievements } from "@/entities/achievement";
import {
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  buttonVariants,
} from "@/shared/ui";
import { LoaderBar } from "@/shared/ui";
import { cn, getWeekDays, getWeekStartsOn, toDateKey, toLocalDateKey } from "@/shared/lib";

function StatDiff({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const diff = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  if (diff === 0) {
    return (
      <span className="text-muted-foreground flex items-center gap-0.5 text-[10px]">
        <Minus className="size-2.5" />
        0%
      </span>
    );
  }
  const isUp = diff > 0;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-[10px]",
        isUp ? "text-primary-dark dark:text-primary" : "text-destructive"
      )}
    >
      {isUp ? <ArrowUp className="size-2.5" /> : <ArrowDown className="size-2.5" />}
      {Math.abs(diff)}%
    </span>
  );
}

function getTrainingPaceLabel(stats: { workouts: number; sets: number; volume: number }) {
  if (stats.workouts === 0) return "старт тижня";
  if (stats.workouts >= 5 || stats.sets >= 45 || stats.volume >= 15000) return "піковий темп";
  if (stats.workouts >= 3 || stats.sets >= 28 || stats.volume >= 9000) return "високий темп";
  if (stats.workouts >= 2 || stats.sets >= 14 || stats.volume >= 4000) return "активний темп";
  return "легкий темп";
}

const DASHBOARD_LOCALE = "uk-UA";
const WEEK_MINUTES_GOAL = 100;
const WEEK_LABELS = {
  zero: "тижнів",
  one: "тиждень",
  two: "тижні",
  few: "тижні",
  many: "тижнів",
  other: "тижня",
} satisfies Record<Intl.LDMLPluralRule, string>;

type DashboardCalendarWorkout = {
  id: string;
  name: string | null;
  started_at: string;
  setsCount: number;
};

type DashboardRecentWorkout = {
  id: string;
  name: string | null;
  started_at: string | null;
  setsCount: number;
  duration: number | null;
};

function formatWeekLabel(weeks: number, locale = DASHBOARD_LOCALE) {
  const pluralRule = new Intl.PluralRules(locale).select(weeks);
  return WEEK_LABELS[pluralRule] ?? WEEK_LABELS.other;
}

function formatWorkoutTime(startedAt: string) {
  return new Date(startedAt).toLocaleTimeString(DASHBOARD_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { data: achievements } = useAchievements();

  if (isLoading || !data) {
    return <LoaderBar />;
  }

  const { profile, recentWorkouts, weekStats, prevWeekStats, calendarWorkouts, streak } = data;
  const hasNewAchievements =
    achievements?.some(
      (achievement) => achievement.unlocked && achievement.unlockedAt && !achievement.seenAt
    ) ?? false;
  const newAchievementsCount = new Set(
    (achievements ?? [])
      .filter(
        (achievement) => achievement.unlocked && achievement.unlockedAt && !achievement.seenAt
      )
      .map((achievement) => achievement.familyKey)
  ).size;

  const volumeLabel =
    weekStats.volume > 1000
      ? `${(weekStats.volume / 1000).toFixed(1)}k`
      : `${Math.round(weekStats.volume)}`;
  const trainingPaceLabel = getTrainingPaceLabel(weekStats);

  return (
    <div className="flex flex-1 flex-col gap-5 p-4">
      <div className="flex items-center justify-between">
        <Link to="/settings">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              className="border-border size-10 rounded-full border object-cover"
            />
          ) : (
            <div className="border-border bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full border text-sm font-semibold">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
        <span className="font-logo text-3xl font-black tracking-normal uppercase">
          PR<span className="text-primary">G</span>RSS
        </span>
        <Link
          to="/achievements"
          aria-label="Ачівки"
          className={cn(
            "group relative flex size-10 items-center justify-center gap-1.5 rounded-full border px-3 backdrop-blur-sm transition-all",
            hasNewAchievements
              ? "border-primary/30 bg-primary/12 text-primary hover:border-primary/40 hover:bg-primary/16 shadow-sm"
              : "border-border/70 bg-card/80 text-muted-foreground hover:border-border hover:bg-accent/70 hover:text-foreground shadow-sm"
          )}
        >
          {hasNewAchievements && (
            <span className="bg-primary text-primary-foreground pointer-events-none absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-semibold shadow-sm">
              {newAchievementsCount}
            </span>
          )}
          <Award className="size-4.5 shrink-0 transition-transform group-hover:scale-[1.03]" />
        </Link>
      </div>

      <section className="flex flex-col gap-2">
        <h1 className="text-3xl leading-tight font-bold">Привіт, {profile.displayName}!</h1>
        <p className="text-muted-foreground text-base">Готові до нових досягнень сьогодні?</p>
      </section>

      <Card className="p-0">
        <CardContent className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Тижневий прогрес</h2>
            <MoreHorizontal className="text-muted-foreground size-5" />
          </div>

          <div className="grid grid-cols-3 items-end gap-3">
            <WeekStatCard
              icon={<Flame className="size-4.5" />}
              value={volumeLabel}
              label="кг об'єму"
              progress={Math.min(92, Math.max(18, weekStats.volume / 120))}
              diff={<StatDiff current={weekStats.volume} previous={prevWeekStats.volume} />}
            />
            <WeekStatCard
              icon={<Dumbbell className="size-5" />}
              value={`${weekStats.workouts}/5`}
              label="тренувань"
              progress={Math.min(100, Math.max(18, weekStats.workouts * 20))}
              featured
              diff={<StatDiff current={weekStats.workouts} previous={prevWeekStats.workouts} />}
            />
            <WeekStatCard
              icon={<Calendar className="size-4.5" />}
              value={`${weekStats.sets}`}
              label="підходів"
              progress={Math.min(92, Math.max(18, weekStats.sets * 4))}
              diff={<StatDiff current={weekStats.sets} previous={prevWeekStats.sets} />}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="relative min-h-[242px] overflow-hidden p-0 text-white">
        <picture className="absolute inset-0">
          <source srcSet="/images/dashboard-hero-gym.webp" type="image/webp" />
          <img
            src="/images/dashboard-hero-gym.png"
            alt=""
            className="size-full object-cover object-center"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050909] via-[#050909]/78 to-[#050909]/12" />
        <CardContent className="relative flex min-h-[242px] flex-col justify-end gap-4 p-6">
          <div className="flex gap-2">
            <span className="rounded bg-white/12 px-2 py-1 text-xs font-bold tracking-[0.06em] uppercase backdrop-blur-md">
              {streak > 0 ? `${streak} тиж.` : "сьогодні"}
            </span>
            <span className="rounded bg-white/12 px-2 py-1 text-xs font-bold tracking-[0.06em] uppercase backdrop-blur-md">
              {trainingPaceLabel}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl leading-tight font-bold">Сьогоднішнє тренування</h2>
            <p className="max-w-[18rem] text-sm leading-6 text-white/78">
              Запишіть підходи, стежте за об'ємом і тримайте прогрес у фокусі.
            </p>
          </div>
          <Link to="/workout/new" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
            <Plus data-icon="inline-start" />
            Почати тренування
          </Link>
        </CardContent>
      </Card>

      <MyWeekCard
        calendarWorkouts={calendarWorkouts}
        recentWorkouts={recentWorkouts}
        streak={streak}
        weekStats={weekStats}
      />
    </div>
  );
}

function MyWeekCard({
  calendarWorkouts,
  recentWorkouts,
  streak,
  weekStats,
}: {
  calendarWorkouts: DashboardCalendarWorkout[];
  recentWorkouts: DashboardRecentWorkout[];
  streak: number;
  weekStats: { workouts: number; sets: number; volume: number };
}) {
  const navigate = useNavigate();
  const today = new Date();
  const todayKey = toDateKey(today);
  const weekDays = getWeekDays(today, {
    locale: DASHBOARD_LOCALE,
    weekStartsOn: getWeekStartsOn(DASHBOARD_LOCALE),
    weekdayFormat: "short",
  });
  const weekDateKeys = new Set(weekDays.map((day) => day.key));
  const workoutsByDate = calendarWorkouts.reduce((map, workout) => {
    if (!workout.started_at) return map;
    const dateKey = toLocalDateKey(workout.started_at);
    map.set(dateKey, [...(map.get(dateKey) ?? []), workout]);
    return map;
  }, new Map<string, DashboardCalendarWorkout[]>());
  const weekMinutes = recentWorkouts.reduce((total, workout) => {
    if (!workout.started_at || !weekDateKeys.has(toLocalDateKey(workout.started_at))) return total;
    return total + (workout.duration ?? Math.round(workout.setsCount * 3));
  }, 0);
  const displayedMinutes = weekMinutes > 0 ? weekMinutes : Math.round(weekStats.sets * 3);
  const minutesProgress = Math.min(100, Math.round((displayedMinutes / WEEK_MINUTES_GOAL) * 100));

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="flex flex-col gap-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="bg-primary/12 text-primary flex size-9 items-center justify-center rounded-full">
              <Calendar className="size-4.5" />
            </span>
            <h2 className="text-2xl font-bold">Мій тиждень</h2>
          </div>
          <Link
            to="/calendar"
            aria-label="Відкрити календар"
            className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full transition-colors"
          >
            <ChevronRight className="size-5" />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const isToday = day.key === todayKey;
            const dayWorkouts = workoutsByDate.get(day.key) ?? [];
            const hasWorkout = dayWorkouts.length > 0;
            const dayButtonClassName = cn(
              "flex size-11 items-center justify-center rounded-full text-base font-black tabular-nums",
              isToday
                ? "bg-primary text-primary-foreground"
                : hasWorkout
                  ? "bg-primary/18 text-primary"
                  : "bg-muted text-muted-foreground",
              hasWorkout && "transition-transform hover:scale-105 active:scale-95"
            );
            const dayLabel = `${day.dayNumber}, ${day.label}`;

            return (
              <div key={day.key} className="flex min-w-0 flex-col items-center gap-2">
                {dayWorkouts.length === 1 ? (
                  <Link
                    to="/workout/$id"
                    params={{ id: dayWorkouts[0].id }}
                    aria-label={`Відкрити тренування за ${dayLabel}`}
                    className={dayButtonClassName}
                  >
                    {day.dayNumber}
                  </Link>
                ) : dayWorkouts.length > 1 ? (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className={dayButtonClassName}
                          aria-label={`Обрати тренування за ${dayLabel}`}
                        />
                      }
                    >
                      {day.dayNumber}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" sideOffset={8}>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>{dayWorkouts.length} тренування</DropdownMenuLabel>
                        {dayWorkouts.map((workout) => (
                          <DropdownMenuItem
                            key={workout.id}
                            onClick={() => {
                              navigate({ to: "/workout/$id", params: { id: workout.id } });
                            }}
                          >
                            <Dumbbell className="text-primary" />
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate">{workout.name ?? "Тренування"}</span>
                              <span className="text-muted-foreground text-xs">
                                {formatWorkoutTime(workout.started_at)} · {workout.setsCount} підх.
                              </span>
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className={dayButtonClassName}>{day.dayNumber}</div>
                )}
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      "text-xs font-bold",
                      isToday ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {day.label}
                  </span>
                  {hasWorkout ? (
                    <Dumbbell className="text-primary size-3" />
                  ) : (
                    <span className="bg-muted-foreground/20 size-1.5 rounded-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-border h-px" />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/12 text-primary flex size-11 items-center justify-center rounded-full">
              <Zap className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tabular-nums">{streak}</span>
                <span className="text-muted-foreground text-sm font-bold">
                  {formatWeekLabel(streak)}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">поточна серія</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-primary relative flex size-14 items-center justify-center">
              <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  className="stroke-muted"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  className="stroke-primary"
                  strokeLinecap="round"
                  strokeWidth="12"
                  strokeDasharray={`${minutesProgress * 2.51} 251`}
                />
              </svg>
              <Flame className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tabular-nums">{displayedMinutes}</span>
                <span className="text-muted-foreground text-lg font-bold">
                  /{WEEK_MINUTES_GOAL}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">хвилин</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeekStatCard({
  icon,
  value,
  label,
  progress,
  featured = false,
  diff,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  progress: number;
  featured?: boolean;
  diff: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-3 text-center">
      <div
        className={cn(
          "text-primary relative flex items-center justify-center rounded-full",
          featured ? "size-24" : "size-20"
        )}
      >
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" className="stroke-muted" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            className="stroke-primary"
            strokeLinecap="round"
            strokeWidth="8"
            strokeDasharray={`${Math.min(100, progress) * 2.64} 264`}
          />
        </svg>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-center justify-center gap-1">
          <p className="text-3xl font-black tracking-tight tabular-nums">{value}</p>
          {diff}
        </div>
        <p className="text-muted-foreground text-xs font-semibold">{label}</p>
      </div>
    </div>
  );
}
