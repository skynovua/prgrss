import { supabase } from "@/src/lib/supabase/client";

interface DashboardRpcResponse {
  profile?: {
    avatarUrl?: string | null;
    displayName?: string | null;
  } | null;
  recentWorkouts?: Array<{
    id: string;
    name: string | null;
    started_at: string | null;
    setsCount: number;
    volume: number;
    muscleGroups: string[];
    duration: number | null;
  }>;
  weekStats?: {
    workouts: number;
    sets: number;
    volume: number;
  } | null;
  prevWeekStats?: {
    workouts: number;
    sets: number;
    volume: number;
  } | null;
  calendarWorkouts?: Array<{
    id: string;
    name: string | null;
    started_at: string;
    setsCount: number;
  }>;
  streak?: number;
}

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

  const dashboard = (data ?? {}) as DashboardRpcResponse;
  const profile = dashboard.profile;

  return {
    user,
    profile: {
      avatarUrl: profile?.avatarUrl ?? user.user_metadata?.avatar_url ?? null,
      displayName: profile?.displayName ?? user.user_metadata?.name ?? "атлет",
    },
    recentWorkouts: dashboard.recentWorkouts ?? [],
    weekStats: dashboard.weekStats ?? { workouts: 0, sets: 0, volume: 0 },
    prevWeekStats: dashboard.prevWeekStats ?? { workouts: 0, sets: 0, volume: 0 },
    calendarWorkouts: dashboard.calendarWorkouts ?? [],
    streak: dashboard.streak ?? 0,
  };
}
