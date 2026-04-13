import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Plus, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { ActiveWorkoutBanner } from "@/components/workout/active-workout-banner";
import { RecentWorkouts } from "@/components/workout/recent-workouts";

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

  // Профіль з таблиці users
  const { data: profile } = await supabase
    .from("users")
    .select("name, avatar_url")
    .eq("id", user!.id)
    .single();

  const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? null;
  const displayName = profile?.name ?? user?.user_metadata?.name ?? "атлет";

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">Привіт, {displayName} 💪</h1>
          <p className="text-muted-foreground">Готовий до тренування?</p>
        </div>
      </div>

      <ActiveWorkoutBanner />

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
        <RecentWorkouts
          workouts={recentWorkouts.map((w) => ({
            id: w.id,
            name: w.name,
            started_at: w.started_at,
            sets: Array.isArray(w.sets) ? w.sets : [],
          }))}
        />
      )}
    </div>
  );
}
