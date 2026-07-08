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
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { RecentWorkouts } from "@/entities/workout";
import { WorkoutCalendar } from "@/entities/workout";
import { useDashboard } from "@/pages/dashboard/model/use-dashboard";
import { useAchievements } from "@/entities/achievement";
import { Card, CardContent, buttonVariants } from "@/shared/ui";
import { LoaderBar } from "@/shared/ui";
import { cn } from "@/shared/lib";

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

  return (
    <div className="flex flex-1 flex-col gap-10 px-4 pb-6">
      <div className="sticky top-0 z-30 -mx-4 flex items-center justify-between bg-transparent px-4 py-3">
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
        <span className="text-primary text-3xl font-black tracking-tight uppercase">PRGRSS</span>
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
        <h1 className="font-heading text-3xl leading-tight font-bold">
          Привіт, {profile.displayName}!
        </h1>
        <p className="text-muted-foreground text-base">Готові до нових досягнень сьогодні?</p>
      </section>

      <Card className="p-0">
        <CardContent className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-bold">Тижневий прогрес</h2>
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

      <Card className="relative min-h-[242px] overflow-hidden bg-[url('/images/dashboard-hero-gym.png')] bg-cover bg-center p-0 text-white">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050909] via-[#050909]/78 to-[#050909]/12" />
        <CardContent className="relative flex min-h-[242px] flex-col justify-end gap-4 p-6">
          <div className="flex gap-2">
            <span className="rounded bg-white/12 px-2 py-1 text-xs font-bold tracking-[0.06em] uppercase backdrop-blur-md">
              {streak > 0 ? `${streak} тиж.` : "сьогодні"}
            </span>
            <span className="rounded bg-white/12 px-2 py-1 text-xs font-bold tracking-[0.06em] uppercase backdrop-blur-md">
              висока
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-3xl leading-tight font-bold">
              Сьогоднішнє тренування
            </h2>
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

      {recentWorkouts.length > 0 && <RecentWorkouts workouts={recentWorkouts} />}

      <WorkoutCalendar workouts={calendarWorkouts} variant="week" showCalendarLink />
    </div>
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
