import { supabase } from "@/src/lib/supabase/client";
import type { Database } from "@/src/lib/db/types";

export type Period = "7d" | "30d" | "90d" | "all";

type ProgressGlobalStatsRpc =
  Database["public"]["Functions"]["get_progress_global_stats"]["Returns"];
type ProgressPeriodSummaryRpc =
  Database["public"]["Functions"]["get_progress_period_summary"]["Returns"];
type ProgressLastWorkoutComparisonRpc =
  Database["public"]["CompositeTypes"]["progress_last_workout_comparison"];
type ProgressPeriodStatsRpc = Database["public"]["CompositeTypes"]["progress_period_stats"];
type ProgressMuscleTonnageRpc = Database["public"]["CompositeTypes"]["progress_muscle_tonnage"];
type ProgressTopExerciseRpc = Database["public"]["CompositeTypes"]["progress_top_exercise"];
type ProgressExerciseProgressEntryRpc =
  Database["public"]["CompositeTypes"]["progress_exercise_progress_entry"];
type ProgressExerciseProgressPointRpc =
  Database["public"]["CompositeTypes"]["progress_exercise_progress_point"];

const PERIOD_DAYS: Record<Period, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

export function periodToDate(period: Period): string | null {
  const days = PERIOD_DAYS[period];
  if (!days) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function mapLastWorkoutComparison(comparison: ProgressLastWorkoutComparisonRpc | null | undefined) {
  if (!comparison?.last_date) return null;

  return {
    lastDate: comparison.last_date,
    lastVolume: comparison.last_volume ?? 0,
    lastSets: comparison.last_sets ?? 0,
    lastDuration: comparison.last_duration,
    prevVolume: comparison.prev_volume,
    prevSets: comparison.prev_sets,
    volumeDiff: comparison.volume_diff,
    setsDiff: comparison.sets_diff,
  };
}

function mapPeriodStats(stats: ProgressPeriodStatsRpc | null | undefined) {
  return {
    totalWorkouts: stats?.total_workouts ?? 0,
    avgDuration: stats?.avg_duration ?? null,
  };
}

function mapMuscleTonnage(entry: ProgressMuscleTonnageRpc) {
  return {
    muscleGroup: entry.muscle_group ?? "other",
    label: entry.label ?? "other",
    volume: entry.volume ?? 0,
  };
}

function mapTopExercise(entry: ProgressTopExerciseRpc) {
  return {
    exerciseId: entry.exercise_id ?? "",
    exerciseName: entry.exercise_name ?? "Невідома",
    volume: entry.volume ?? 0,
    sets: entry.sets ?? 0,
  };
}

function mapExerciseProgressPoint(point: ProgressExerciseProgressPointRpc) {
  if (!point.date) return null;

  return {
    date: point.date,
    bestWeight: point.best_weight ?? 0,
    totalVolume: point.total_volume ?? 0,
    estimated1RM: point.estimated_1rm ?? 0,
  };
}

function mapExerciseProgressEntry(entry: ProgressExerciseProgressEntryRpc) {
  return {
    exerciseId: entry.exercise_id ?? "",
    exerciseName: entry.exercise_name ?? "Невідома",
    data:
      entry.data
        ?.map(mapExerciseProgressPoint)
        .filter(
          (point): point is NonNullable<ReturnType<typeof mapExerciseProgressPoint>> =>
            point !== null
        ) ?? [],
  };
}

function mapGlobalStats(stats: ProgressGlobalStatsRpc | null | undefined) {
  return {
    streak: stats?.streak ?? 0,
    lastComparison: mapLastWorkoutComparison(stats?.last_comparison),
  };
}

function mapPeriodSummary(summary: ProgressPeriodSummaryRpc | null | undefined) {
  return {
    stats: mapPeriodStats(summary?.stats),
    muscleTonnage: summary?.muscle_tonnage?.map(mapMuscleTonnage) ?? [],
    topExercises: summary?.top_exercises?.map(mapTopExercise) ?? [],
  };
}

export type LastWorkoutComparison = NonNullable<ReturnType<typeof mapLastWorkoutComparison>>;
export type PeriodStats = ReturnType<typeof mapPeriodStats>;
export type MuscleGroupTonnage = ReturnType<typeof mapMuscleTonnage>;
export type TopExercise = ReturnType<typeof mapTopExercise>;
export type ExerciseProgressPoint = NonNullable<ReturnType<typeof mapExerciseProgressPoint>>;
export type ExerciseProgressData = ReturnType<typeof mapExerciseProgressEntry>;
export type GlobalProgressStats = ReturnType<typeof mapGlobalStats>;
export type PeriodProgressSummary = ReturnType<typeof mapPeriodSummary>;

export async function fetchGlobalStats(): Promise<GlobalProgressStats> {
  const { data, error } = await supabase.rpc("get_progress_global_stats");

  if (error) {
    throw error;
  }

  return mapGlobalStats(data);
}

export async function fetchPeriodSummary(since: string | null): Promise<PeriodProgressSummary> {
  const { data, error } = await supabase.rpc(
    "get_progress_period_summary",
    since ? { period_since: since } : {}
  );

  if (error) {
    throw error;
  }

  return mapPeriodSummary(data);
}

// --- Прогрес конкретної вправи ---

export async function fetchExerciseProgress(since: string | null): Promise<ExerciseProgressData[]> {
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const { data, error } = await supabase.rpc("get_progress_exercise_progress", {
    client_timezone: clientTimezone,
    ...(since ? { period_since: since } : {}),
  });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapExerciseProgressEntry);
}
