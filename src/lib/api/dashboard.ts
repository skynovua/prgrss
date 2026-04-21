import { supabase } from "@/src/lib/supabase/client";
import type { Database } from "@/src/lib/db/types";

type DashboardRpcResponse = Database["public"]["Functions"]["get_dashboard_data"]["Returns"];

export async function fetchDashboardData() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const user = session.user;
  const { data, error } = await supabase.rpc("get_dashboard_data");

  if (error) {
    throw error;
  }

  const dashboard: DashboardRpcResponse | null = data;
  const profile = dashboard?.profile;

  return {
    user,
    profile: {
      avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
      displayName: profile?.display_name ?? user.user_metadata?.name ?? "атлет",
    },
    recentWorkouts:
      dashboard?.recent_workouts?.map((workout) => ({
        id: workout.id ?? "",
        name: workout.name,
        started_at: workout.started_at,
        setsCount: workout.sets_count ?? 0,
        volume: workout.volume ?? 0,
        muscleGroups: workout.muscle_groups ?? [],
        duration: workout.duration,
      })) ?? [],
    weekStats: {
      workouts: dashboard?.week_stats?.workouts ?? 0,
      sets: dashboard?.week_stats?.sets ?? 0,
      volume: dashboard?.week_stats?.volume ?? 0,
    },
    prevWeekStats: {
      workouts: dashboard?.prev_week_stats?.workouts ?? 0,
      sets: dashboard?.prev_week_stats?.sets ?? 0,
      volume: dashboard?.prev_week_stats?.volume ?? 0,
    },
    calendarWorkouts:
      dashboard?.calendar_workouts?.map((workout) => ({
        id: workout.id ?? "",
        name: workout.name,
        started_at: workout.started_at ?? "",
        setsCount: workout.sets_count ?? 0,
      })) ?? [],
    streak: dashboard?.streak ?? 0,
  };
}
