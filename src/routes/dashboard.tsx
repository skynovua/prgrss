import {
  Dumbbell,
  TrendingUp,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
  Flame,
  Plus,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ActiveWorkoutBanner } from "@/src/components/workout/active-workout-banner";
import { RecentWorkouts } from "@/src/components/workout/recent-workouts";
import { WorkoutCalendar } from "@/src/components/workout/workout-calendar";
import { useDashboard } from "@/src/lib/hooks/use-dashboard";
import { useAchievements } from "@/src/lib/hooks/use-achievements";
import { LoaderBar } from "@/src/components/ui/loader-bar";
import { Card, CardContent } from "@/src/components/ui/card";

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

  return (
    <div className="flex flex-1 flex-col gap-5 p-4">
      {/* Хедер */}
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
          className={`group relative flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm transition-all ${
            hasNewAchievements
              ? "border-foreground/10 bg-foreground/4 text-foreground hover:border-foreground/14 hover:bg-foreground/5.5 shadow-sm"
              : "border-border/70 bg-background/80 text-muted-foreground hover:border-border hover:bg-accent/70 hover:text-foreground shadow-sm"
          }`}
        >
          {hasNewAchievements && (
            <span className="border-foreground/12 pointer-events-none absolute -inset-1 animate-pulse rounded-full border" />
          )}
          <Trophy className="h-4.5 w-4.5 transition-transform group-hover:scale-[1.03]" />
        </Link>
      </div>

      {/* Привітання + стрік */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Привіт, {profile.displayName}</h2>
        {streak > 0 && (
          <div className="flex items-center gap-1.5">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-bold">{streak}</span>
            <span className="text-muted-foreground text-xs">
              {streak === 1 ? "тиждень" : streak < 5 ? "тижні" : "тижнів"}
            </span>
          </div>
        )}
      </div>

      {/* Банер активного тренування або CTA */}
      <ActiveWorkoutBanner
        fallback={
          <Link
            to="/workout/new"
            className="bg-primary text-primary-foreground flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium transition-opacity active:opacity-80"
          >
            <Plus className="h-5 w-5" />
            Почати тренування
          </Link>
        }
      />

      {/* Тижнева статистика */}
      <div>
        <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
          Цей тиждень
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-0">
            <CardContent className="flex flex-col items-center px-3 py-6">
              <Calendar className="text-muted-foreground mb-1 h-5 w-5" />
              <span className="text-2xl font-bold">{weekStats.workouts}</span>
              <span className="text-muted-foreground text-xs">тренувань</span>
              <StatDiff current={weekStats.workouts} previous={prevWeekStats.workouts} />
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardContent className="flex flex-col items-center px-3 py-6">
              <Dumbbell className="text-muted-foreground mb-1 h-5 w-5" />
              <span className="text-2xl font-bold">{weekStats.sets}</span>
              <span className="text-muted-foreground text-xs">підходів</span>
              <StatDiff current={weekStats.sets} previous={prevWeekStats.sets} />
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardContent className="flex flex-col items-center px-3 py-6">
              <TrendingUp className="text-muted-foreground mb-1 h-5 w-5" />
              <span className="text-2xl font-bold">
                {weekStats.volume > 1000
                  ? `${(weekStats.volume / 1000).toFixed(1)}т`
                  : `${Math.round(weekStats.volume)}`}
              </span>
              <span className="text-muted-foreground text-xs">об&#39;єм кг</span>
              <StatDiff current={weekStats.volume} previous={prevWeekStats.volume} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Останні тренування */}
      {recentWorkouts.length > 0 && <RecentWorkouts workouts={recentWorkouts} />}

      {/* Календар */}
      <WorkoutCalendar workouts={calendarWorkouts} />
    </div>
  );
}
