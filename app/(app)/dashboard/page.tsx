import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Plus, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { DeleteWorkoutButton } from "@/components/workout/delete-workout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Останні тренування
  const { data: recentWorkouts } = await supabase
    .from("workouts")
    .select("*, sets(*)")
    .order("started_at", { ascending: false })
    .limit(5);

  // Статистика за тиждень
  const weekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  const { data: weekWorkouts } = await supabase
    .from("workouts")
    .select("id")
    .gte("started_at", weekAgo);

  const { data: weekSets } = await supabase
    .from("sets")
    .select("weight, reps, workout_id")
    .in(
      "workout_id",
      (weekWorkouts ?? []).map((w) => w.id)
    );

  const weekVolume = (weekSets ?? []).reduce(
    (acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0),
    0
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">
          Привіт, {user?.user_metadata?.name ?? "атлет"} 💪
        </h1>
        <p className="text-muted-foreground">Готовий до тренування?</p>
      </div>

      <Link href="/workout/new">
        <Button size="lg" className="w-full gap-2">
          <Plus className="h-5 w-5" />
          Нове тренування
        </Button>
      </Link>

      {/* Статистика тижня */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Calendar className="mb-1 h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">
              {weekWorkouts?.length ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">тренувань</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Dumbbell className="mb-1 h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">
              {weekSets?.length ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">підходів</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <TrendingUp className="mb-1 h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">
              {weekVolume > 1000
                ? `${(weekVolume / 1000).toFixed(1)}т`
                : `${Math.round(weekVolume)}`}
            </span>
            <span className="text-xs text-muted-foreground">об&apos;єм кг</span>
          </CardContent>
        </Card>
      </div>

      {/* Останні тренування */}
      {recentWorkouts && recentWorkouts.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Останні тренування</h2>
          {recentWorkouts.map((workout) => (
            <div key={workout.id} className="relative flex items-center gap-1">
              <Link href={`/workout/${workout.id}`} className="flex-1">
                <Card className="transition-colors hover:bg-accent/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {workout.name ?? "Тренування"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>
                        {workout.started_at &&
                          new Date(workout.started_at).toLocaleDateString("uk-UA", {
                            day: "numeric",
                            month: "short",
                          })}
                      </span>
                      <span>
                        {(workout.sets as unknown[])?.length ?? 0} підходів
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <DeleteWorkoutButton workoutId={workout.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
