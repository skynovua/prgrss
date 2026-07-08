import {
  Dumbbell,
  TrendingUp,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Award,
  Flame,
  Plus,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { RecentWorkouts } from "@/entities/workout";
import { WorkoutCalendar } from "@/entities/workout";
import { useDashboard } from "@/pages/dashboard/model/use-dashboard";
import { useAchievements } from "@/entities/achievement";
import { LoaderBar } from "@/shared/ui";
import { Card, CardContent } from "@/shared/ui";

function StatDiff({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const diff = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  if (diff === 0) {
    return (
      <span className="text-muted-foreground flex items-center gap-0.5 text-[10px]">
        <Minus className="h-2.5 w-2.5" />
        0%
      </span>
    );
  }
  const isUp = diff > 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-[10px] ${isUp ? "text-green-500" : "text-red-500"}`}
    >
      {isUp ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
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

  return (
    <div className="flex flex-1 flex-col gap-5 p-4">
      <div className="flex items-center justify-between">
        <Link to="/settings">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              className="border-border h-10 w-10 rounded-full border object-cover"
            />
          ) : (
            <div className="border-border bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
        <span className="text-lg font-bold tracking-tight uppercase">prgrss</span>
        <Link
          to="/achievements"
          aria-label="Ачівки"
          className={`group relative flex size-10 items-center justify-center gap-1.5 rounded-full border px-3 backdrop-blur-sm transition-all ${
            hasNewAchievements
              ? "border-amber-500/20 bg-amber-500/10 text-amber-700 shadow-sm hover:border-amber-500/30 hover:bg-amber-500/14 dark:text-amber-300"
              : "border-border/70 bg-background/80 text-muted-foreground hover:border-border hover:bg-accent/70 hover:text-foreground shadow-sm"
          }`}
        >
          {hasNewAchievements && (
            <span className="pointer-events-none absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white shadow-sm">
              {newAchievementsCount}
            </span>
          )}
          <Award className="h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-[1.03]" />
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        <CardContent className="px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">Привіт, {profile.displayName}</h1>
              </div>

              {streak > 0 && (
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-orange-600 dark:text-orange-400">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-semibold">{streak}</span>
                  <span className="text-xs">
                    {streak === 1 ? "тиждень" : streak < 5 ? "тижні" : "тижнів"}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <WeekStatCard
                icon={<Calendar className="text-muted-foreground h-4.5 w-4.5" />}
                value={`${weekStats.workouts}`}
                label="тренувань"
                diff={<StatDiff current={weekStats.workouts} previous={prevWeekStats.workouts} />}
              />
              <WeekStatCard
                icon={<Dumbbell className="text-muted-foreground h-4.5 w-4.5" />}
                value={`${weekStats.sets}`}
                label="підходів"
                diff={<StatDiff current={weekStats.sets} previous={prevWeekStats.sets} />}
              />
              <WeekStatCard
                icon={<TrendingUp className="text-muted-foreground h-4.5 w-4.5" />}
                value={
                  weekStats.volume > 1000
                    ? `${(weekStats.volume / 1000).toFixed(1)}т`
                    : `${Math.round(weekStats.volume)}`
                }
                label="об'єм кг"
                diff={<StatDiff current={weekStats.volume} previous={prevWeekStats.volume} />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Link
        to="/workout/new"
        className="bg-primary text-primary-foreground flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium transition-opacity active:opacity-80"
      >
        <Plus className="h-5 w-5" />
        Почати тренування
      </Link>

      {recentWorkouts.length > 0 && <RecentWorkouts workouts={recentWorkouts} />}

      <WorkoutCalendar workouts={calendarWorkouts} variant="week" showCalendarLink />
    </div>
  );
}

function WeekStatCard({
  icon,
  value,
  label,
  diff,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  diff: React.ReactNode;
}) {
  return (
    <div className="bg-background/70 rounded-2xl border px-3 py-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        {icon}
        {diff}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold tabular-nums">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </div>
    </div>
  );
}
