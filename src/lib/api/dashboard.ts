import { supabase } from "@/src/lib/supabase/client";
import { fetchStreak } from "@/src/lib/api/stats";

export async function fetchDashboardData() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const user = session.user;

  // Паралельні запити
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const threeMonthsAgo = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 2,
    1
  ).toISOString();

  const [recentResult, weekResult, prevWeekResult, calendarResult, profileResult, streak] =
    await Promise.all([
      supabase
        .from("workouts")
        .select(
          "id, name, started_at, finished_at, sets(id, weight, reps, exercise_id, exercises(muscle_group))"
        )
        .order("started_at", { ascending: false })
        .limit(5),
      supabase.from("workouts").select("id, sets(weight, reps)").gte("started_at", weekAgo),
      supabase
        .from("workouts")
        .select("id, sets(weight, reps)")
        .gte("started_at", twoWeeksAgo)
        .lt("started_at", weekAgo),
      supabase
        .from("workouts")
        .select("id, name, started_at, sets(id)")
        .gte("started_at", threeMonthsAgo)
        .order("started_at", { ascending: false }),
      supabase.from("users").select("name, avatar_url").eq("id", user.id).single(),
      fetchStreak(),
    ]);

  const recentWorkouts = recentResult.data ?? [];
  const weekWorkouts = weekResult.data ?? [];
  const prevWeekWorkouts = prevWeekResult.data ?? [];
  const calendarWorkouts = calendarResult.data ?? [];
  const profile = profileResult.data;

  const weekSets = weekWorkouts.flatMap((w) => (Array.isArray(w.sets) ? w.sets : []));
  const weekVolume = weekSets.reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0);

  const prevWeekSets = prevWeekWorkouts.flatMap((w) => (Array.isArray(w.sets) ? w.sets : []));
  const prevWeekVolume = prevWeekSets.reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0);

  return {
    user,
    profile: {
      avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
      displayName: profile?.name ?? user.user_metadata?.name ?? "атлет",
    },
    recentWorkouts: recentWorkouts.map((w) => {
      const sets = Array.isArray(w.sets) ? w.sets : [];
      const volume = sets.reduce(
        (acc: number, s: { weight?: number | null; reps?: number | null }) =>
          acc + (s.weight ?? 0) * (s.reps ?? 0),
        0
      );
      const muscleGroups = [
        ...new Set(
          sets
            .map((s: { exercises?: { muscle_group?: string | null } | null }) => {
              const ex = s.exercises;
              return ex && typeof ex === "object" && "muscle_group" in ex
                ? (ex.muscle_group as string | null)
                : null;
            })
            .filter(Boolean)
        ),
      ] as string[];
      const duration =
        w.started_at && w.finished_at
          ? Math.round(
              (new Date(w.finished_at).getTime() - new Date(w.started_at).getTime()) / 60000
            )
          : null;

      return {
        id: w.id,
        name: w.name,
        started_at: w.started_at,
        setsCount: sets.length,
        volume,
        muscleGroups,
        duration,
      };
    }),
    weekStats: {
      workouts: weekWorkouts.length,
      sets: weekSets.length,
      volume: weekVolume,
    },
    prevWeekStats: {
      workouts: prevWeekWorkouts.length,
      sets: prevWeekSets.length,
      volume: prevWeekVolume,
    },
    calendarWorkouts: calendarWorkouts.map((w) => ({
      id: w.id,
      name: w.name,
      started_at: w.started_at!,
      setsCount: Array.isArray(w.sets) ? w.sets.length : 0,
    })),
    streak,
  };
}
