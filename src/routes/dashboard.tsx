import { Card, CardContent } from "@/src/components/ui/card";
import { Dumbbell, TrendingUp, Calendar, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { ActiveWorkoutBanner } from "@/src/components/workout/active-workout-banner";
import { RecentWorkouts } from "@/src/components/workout/recent-workouts";
import { WorkoutCalendar } from "@/src/components/workout/workout-calendar";
import { useDashboard } from "@/src/lib/hooks/use-dashboard";

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

  if (isLoading || !data) {
    return (
      <div className="fixed inset-x-0 top-0 z-100">
        <div className="bg-primary h-0.5 animate-pulse" />
      </div>
    );
  }

  const { profile, recentWorkouts, weekStats, prevWeekStats, calendarWorkouts } = data;

  const lastWorkout = recentWorkouts[0];
  const lastWorkoutLabel = lastWorkout?.started_at
    ? formatRelativeDate(lastWorkout.started_at)
    : null;

  return (
    <div className="flex flex-1 flex-col gap-5 p-4">
      {/* Привітання */}
      <div className="flex items-center gap-3">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">Привіт, {profile.displayName} 💪</h1>
          <p className="text-muted-foreground text-sm">
            {lastWorkoutLabel
              ? `Останнє тренування: ${lastWorkoutLabel}`
              : "Час почати тренуватися!"}
          </p>
        </div>
      </div>

      {/* Банер активного тренування */}
      <ActiveWorkoutBanner />

      {/* Тижнева статистика */}
      <div>
        <h2 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
          Цей тиждень
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center p-3">
              <Calendar className="text-muted-foreground mb-1 h-5 w-5" />
              <span className="text-2xl font-bold">{weekStats.workouts}</span>
              <span className="text-muted-foreground text-xs">тренувань</span>
              <StatDiff current={weekStats.workouts} previous={prevWeekStats.workouts} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-3">
              <Dumbbell className="text-muted-foreground mb-1 h-5 w-5" />
              <span className="text-2xl font-bold">{weekStats.sets}</span>
              <span className="text-muted-foreground text-xs">підходів</span>
              <StatDiff current={weekStats.sets} previous={prevWeekStats.sets} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-3">
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

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) return "щойно";
    return `${diffHours} год тому`;
  }
  if (diffDays === 1) return "вчора";
  if (diffDays < 7) return `${diffDays} дн тому`;

  return date.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}
