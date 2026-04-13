"use server";

import { withAuth } from "./protected";
import { calc1RM } from "@/lib/utils/calc";

export type Period = "7d" | "30d" | "90d" | "all";

export interface OneRMDataPoint {
  date: string;
  estimated1RM: number;
}

export interface ExerciseOneRM {
  exerciseId: string;
  exerciseName: string;
  data: OneRMDataPoint[];
}

export interface WeeklyVolumePoint {
  week: string;
  volume: number;
  workouts: number;
}

export interface MuscleGroupDistribution {
  muscleGroup: string;
  label: string;
  sets: number;
}

export interface WorkoutFrequencyPoint {
  week: string;
  count: number;
}

export interface ProgressData {
  oneRM: ExerciseOneRM[];
  weeklyVolume: WeeklyVolumePoint[];
  muscleDistribution: MuscleGroupDistribution[];
  workoutFrequency: WorkoutFrequencyPoint[];
  stats: { totalWorkouts: number; totalSets: number; totalVolume: number };
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Груди",
  back: "Спина",
  legs: "Ноги",
  shoulders: "Плечі",
  arms: "Руки",
  core: "Кор",
};

const PERIOD_DAYS: Record<Period, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

function periodToDate(period: Period): string | null {
  const days = PERIOD_DAYS[period];
  if (!days) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function weeksForPeriod(period: Period): number {
  const days = PERIOD_DAYS[period];
  if (!days) return 52;
  return Math.ceil(days / 7);
}

// Завантажити всі дані одним запитом
export async function getProgressData(period: Period = "30d"): Promise<ProgressData> {
  return withAuth(async (_userId, supabase) => {
    const since = periodToDate(period);
    const weeks = weeksForPeriod(period);

    // Паралельні запити
    const [oneRM, weeklyVolume, muscleDistribution, workoutFrequency, stats] = await Promise.all([
      fetchOneRM(supabase, since),
      fetchWeeklyVolume(supabase, since, weeks),
      fetchMuscleDistribution(supabase, since),
      fetchWorkoutFrequency(supabase, since, weeks),
      fetchOverallStats(supabase, since),
    ]);

    return { oneRM, weeklyVolume, muscleDistribution, workoutFrequency, stats };
  });
}

// Estimated 1RM прогресія для топ вправ
async function fetchOneRM(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  since: string | null
): Promise<ExerciseOneRM[]> {
  let query = supabase
    .from("sets")
    .select(
      "weight, reps, created_at, exercise_id, exercises(name), workouts!inner(started_at, user_id)"
    )
    .not("weight", "is", null)
    .not("reps", "is", null)
    .order("created_at", { ascending: true });

  if (since) {
    query = query.gte("workouts.started_at", since);
  }

  const { data: sets } = await query;

  if (!sets || sets.length === 0) return [];

  const exerciseMap = new Map<string, { name: string; dailyBest: Map<string, number> }>();

  for (const s of sets) {
    if (!s.weight || !s.reps || s.reps === 0) continue;

    const e1rm = calc1RM(s.weight, s.reps);
    const date = s.created_at ? new Date(s.created_at).toISOString().slice(0, 10) : null;
    if (!date) continue;

    const exercises = s.exercises as unknown as { name: string }[] | { name: string } | null;
    const exerciseName = Array.isArray(exercises)
      ? (exercises[0]?.name ?? "Невідома")
      : (exercises?.name ?? "Невідома");
    const key = s.exercise_id;

    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, { name: exerciseName, dailyBest: new Map() });
    }

    const entry = exerciseMap.get(key)!;
    const current = entry.dailyBest.get(date) ?? 0;
    if (e1rm > current) {
      entry.dailyBest.set(date, e1rm);
    }
  }

  const sorted = [...exerciseMap.entries()]
    .sort((a, b) => b[1].dailyBest.size - a[1].dailyBest.size)
    .slice(0, 5);

  return sorted.map(([exerciseId, { name, dailyBest }]) => ({
    exerciseId,
    exerciseName: name,
    data: [...dailyBest.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, estimated1RM]) => ({
        date,
        estimated1RM: Math.round(estimated1RM * 10) / 10,
      })),
  }));
}

// Тижневий об'єм
async function fetchWeeklyVolume(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  since: string | null,
  weeks: number
): Promise<WeeklyVolumePoint[]> {
  let query = supabase
    .from("workouts")
    .select("id, started_at, sets(weight, reps)")
    .order("started_at", { ascending: true });

  if (since) {
    query = query.gte("started_at", since);
  }

  const { data: workouts } = await query;

  if (!workouts || workouts.length === 0) return [];

  const weekMap = new Map<string, { volume: number; workouts: number }>();

  // Заповнюємо всі тижні
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = getWeekStart(d);
    weekMap.set(weekStart.toISOString().slice(0, 10), { volume: 0, workouts: 0 });
  }

  for (const w of workouts) {
    const date = w.started_at ? new Date(w.started_at) : null;
    if (!date) continue;

    const weekStart = getWeekStart(date);
    const key = weekStart.toISOString().slice(0, 10);

    if (!weekMap.has(key)) {
      weekMap.set(key, { volume: 0, workouts: 0 });
    }

    const entry = weekMap.get(key)!;
    entry.workouts++;

    const sets = Array.isArray(w.sets) ? w.sets : [];
    for (const s of sets) {
      entry.volume += (s.weight ?? 0) * (s.reps ?? 0);
    }
  }

  return [...weekMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, { volume, workouts }]) => ({
      week: formatWeekLabel(week),
      volume: Math.round(volume),
      workouts,
    }));
}

// Розподіл по м'язових групах
async function fetchMuscleDistribution(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  since: string | null
): Promise<MuscleGroupDistribution[]> {
  let query = supabase
    .from("sets")
    .select("id, exercises(muscle_group), workouts!inner(started_at, user_id)");

  if (since) {
    query = query.gte("workouts.started_at", since);
  }

  const { data: sets } = await query;

  if (!sets || sets.length === 0) return [];

  const groupCount = new Map<string, number>();

  for (const s of sets) {
    const exercises = s.exercises as unknown as
      | { muscle_group: string | null }[]
      | { muscle_group: string | null }
      | null;
    const mg = Array.isArray(exercises)
      ? (exercises[0]?.muscle_group ?? "other")
      : (exercises?.muscle_group ?? "other");
    groupCount.set(mg, (groupCount.get(mg) ?? 0) + 1);
  }

  return [...groupCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([muscleGroup, setsCount]) => ({
      muscleGroup,
      label: MUSCLE_LABELS[muscleGroup] ?? muscleGroup,
      sets: setsCount,
    }));
}

// Частота тренувань по тижнях
async function fetchWorkoutFrequency(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  since: string | null,
  weeks: number
): Promise<WorkoutFrequencyPoint[]> {
  let query = supabase
    .from("workouts")
    .select("started_at")
    .not("finished_at", "is", null)
    .order("started_at", { ascending: true });

  if (since) {
    query = query.gte("started_at", since);
  }

  const { data: workouts } = await query;

  if (!workouts || workouts.length === 0) return [];

  const weekMap = new Map<string, number>();

  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = getWeekStart(d);
    weekMap.set(weekStart.toISOString().slice(0, 10), 0);
  }

  for (const w of workouts) {
    if (!w.started_at) continue;
    const weekStart = getWeekStart(new Date(w.started_at));
    const key = weekStart.toISOString().slice(0, 10);
    weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
  }

  return [...weekMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, count]) => ({
      week: formatWeekLabel(week),
      count,
    }));
}

// Загальна статистика
async function fetchOverallStats(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  since: string | null
) {
  let workoutsQuery = supabase
    .from("workouts")
    .select("*", { count: "exact", head: true })
    .not("finished_at", "is", null);

  if (since) {
    workoutsQuery = workoutsQuery.gte("started_at", since);
  }

  const { count: totalWorkouts } = await workoutsQuery;

  // Для sets потрібен join через workouts для фільтрації по даті
  let setsQuery = supabase.from("sets").select("weight, reps, workouts!inner(started_at, user_id)");

  if (since) {
    setsQuery = setsQuery.gte("workouts.started_at", since);
  }

  const { data: allSets } = await setsQuery;

  const totalSets = allSets?.length ?? 0;
  const totalVolume = (allSets ?? []).reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0);

  return {
    totalWorkouts: totalWorkouts ?? 0,
    totalSets,
    totalVolume: Math.round(totalVolume),
  };
}

// Helpers
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понеділок
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(isoDate: string): string {
  const d = new Date(isoDate);
  const day = d.getDate();
  const month = d.toLocaleDateString("uk-UA", { month: "short" });
  return `${day} ${month}`;
}
