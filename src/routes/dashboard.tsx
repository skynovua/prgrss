import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Dumbbell, Plus, TrendingUp, Calendar } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ActiveWorkoutBanner } from "@/src/components/workout/active-workout-banner";
import { RecentWorkouts } from "@/src/components/workout/recent-workouts";
import { WorkoutCalendar } from "@/src/components/workout/workout-calendar";
import { useDashboard } from "@/src/lib/hooks/use-dashboard";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <div className="fixed inset-x-0 top-0 z-100">
        <div className="bg-primary h-0.5 animate-pulse" />
      </div>
    );
  }

  const { profile, recentWorkouts, weekStats, calendarWorkouts } = data;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
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
          <p className="text-muted-foreground">Готовий до тренування?</p>
        </div>
      </div>

      <ActiveWorkoutBanner />

      <Link to="/workout/new">
        <Button size="lg" className="w-full gap-2">
          <Plus className="h-5 w-5" />
          Нове тренування
        </Button>
      </Link>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Calendar className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-2xl font-bold">{weekStats.workouts}</span>
            <span className="text-muted-foreground text-xs">тренувань</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Dumbbell className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-2xl font-bold">{weekStats.sets}</span>
            <span className="text-muted-foreground text-xs">підходів</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <TrendingUp className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-2xl font-bold">
              {weekStats.volume > 1000
                ? `${(weekStats.volume / 1000).toFixed(1)}т`
                : `${Math.round(weekStats.volume)}`}
            </span>
            <span className="text-muted-foreground text-xs">об&#39;єм кг</span>
          </CardContent>
        </Card>
      </div>

      <WorkoutCalendar workouts={calendarWorkouts} />

      {recentWorkouts.length > 0 && <RecentWorkouts workouts={recentWorkouts} />}
    </div>
  );
}
