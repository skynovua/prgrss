import { supabase } from "@/src/lib/supabase/client";

export async function fetchDashboardData() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Паралельні запити
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const threeMonthsAgo = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 2,
    1
  ).toISOString();

  const [recentResult, weekResult, calendarResult, profileResult] = await Promise.all([
    supabase
      .from("workouts")
      .select("*, sets(id, weight, reps)")
      .order("started_at", { ascending: false })
      .limit(5),
    supabase.from("workouts").select("id, sets(weight, reps)").gte("started_at", weekAgo),
    supabase
      .from("workouts")
      .select("id, name, started_at, sets(id)")
      .gte("started_at", threeMonthsAgo)
      .order("started_at", { ascending: false }),
    supabase.from("users").select("name, avatar_url").eq("id", user.id).single(),
  ]);

  const recentWorkouts = recentResult.data ?? [];
  const weekWorkouts = weekResult.data ?? [];
  const calendarWorkouts = calendarResult.data ?? [];
  const profile = profileResult.data;

  const weekSets = weekWorkouts.flatMap((w) => (Array.isArray(w.sets) ? w.sets : []));
  const weekVolume = weekSets.reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0);

  return {
    user,
    profile: {
      avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
      displayName: profile?.name ?? user.user_metadata?.name ?? "атлет",
    },
    recentWorkouts: recentWorkouts.map((w) => ({
      id: w.id,
      name: w.name,
      started_at: w.started_at,
      sets: Array.isArray(w.sets) ? w.sets : [],
    })),
    weekStats: {
      workouts: weekWorkouts.length,
      sets: weekSets.length,
      volume: weekVolume,
    },
    calendarWorkouts: calendarWorkouts.map((w) => ({
      id: w.id,
      name: w.name,
      started_at: w.started_at!,
      setsCount: Array.isArray(w.sets) ? w.sets.length : 0,
    })),
  };
}
