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
    .select("*, sets(id, weight, reps)")
    .order("started_at", { ascending: false })
    .limit(5);

  // Статистика за тиждень — один запит з join
  const weekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: weekWorkouts } = await supabase
    .from("workouts")
    .select("id, sets(weight, reps)")
    .gte("started_at", weekAgo);

  const weekSets = (weekWorkouts ?? []).flatMap((w) => (Array.isArray(w.sets) ? w.sets : []));
  const weekVolume = weekSets.reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Привіт, {user?.user_metadata?.name ?? "атлет"} 💪</h1>
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
            <Calendar className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-2xl font-bold">{weekWorkouts?.length ?? 0}</span>
            <span className="text-muted-foreground text-xs">тренувань</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Dumbbell className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-2xl font-bold">{weekSets.length}</span>
            <span className="text-muted-foreground text-xs">підходів</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <TrendingUp className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-2xl font-bold">
              {weekVolume > 1000
                ? `${(weekVolume / 1000).toFixed(1)}т`
                : `${Math.round(weekVolume)}`}
            </span>
            <span className="text-muted-foreground text-xs">об&apos;єм кг</span>
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
                <Card className="hover:bg-accent/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {workout.name ?? "Тренування"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-muted-foreground flex gap-4 text-xs">
                      <span>
                        {workout.started_at &&
                          new Date(workout.started_at).toLocaleDateString("uk-UA", {
                            day: "numeric",
                            month: "short",
                          })}
                      </span>
                      <span>{Array.isArray(workout.sets) ? workout.sets.length : 0} підходів</span>
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
