import { supabase } from "@/src/lib/supabase/client";

export type Period = "7d" | "30d" | "90d" | "all";

// --- Типи ---

export interface LastWorkoutComparison {
  lastDate: string;
  lastVolume: number;
  lastSets: number;
  lastDuration: number | null;
  prevVolume: number | null;
  prevSets: number | null;
  volumeDiff: number | null;
  setsDiff: number | null;
}

export interface MuscleGroupTonnage {
  muscleGroup: string;
  label: string;
  volume: number;
}

export interface TopExercise {
  exerciseId: string;
  exerciseName: string;
  volume: number;
  sets: number;
}

export interface ExerciseProgressPoint {
  date: string;
  bestWeight: number;
  totalVolume: number;
  estimated1RM: number;
}

export interface ExerciseProgressData {
  exerciseId: string;
  exerciseName: string;
  data: ExerciseProgressPoint[];
}

export interface PeriodStats {
  totalWorkouts: number;
  avgDuration: number | null;
}

export interface GlobalProgressStats {
  streak: number;
  lastComparison: LastWorkoutComparison | null;
}

export interface PeriodProgressSummary {
  stats: PeriodStats;
  muscleTonnage: MuscleGroupTonnage[];
  topExercises: TopExercise[];
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

export function periodToDate(period: Period): string | null {
  const days = PERIOD_DAYS[period];
  if (!days) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// --- Стрік (завжди глобальний, не залежить від періоду) ---

export async function fetchStreak(): Promise<number> {
  const { data: workouts } = await supabase
    .from("workouts")
    .select("started_at")
    .not("finished_at", "is", null)
    .order("started_at", { ascending: false });

  if (!workouts || workouts.length === 0) return 0;
  return calcWeekStreak(workouts.map((w) => w.started_at).filter(Boolean) as string[]);
}

export async function fetchGlobalStats(): Promise<GlobalProgressStats> {
  const { data, error } = await supabase.rpc("get_progress_global_stats");

  if (error) {
    throw error;
  }

  const stats = (data ?? {}) as Partial<GlobalProgressStats>;

  return {
    streak: stats.streak ?? 0,
    lastComparison: stats.lastComparison ?? null,
  };
}

export async function fetchPeriodSummary(since: string | null): Promise<PeriodProgressSummary> {
  const { data, error } = await supabase.rpc(
    "get_progress_period_summary",
    since ? { period_since: since } : {}
  );

  if (error) {
    throw error;
  }

  const summary = (data ?? {}) as Partial<PeriodProgressSummary>;

  return {
    stats: summary.stats ?? { totalWorkouts: 0, avgDuration: null },
    muscleTonnage: summary.muscleTonnage ?? [],
    topExercises: summary.topExercises ?? [],
  };
}

// --- Статистика за період ---

export async function fetchPeriodStats(since: string | null): Promise<PeriodStats> {
  let query = supabase
    .from("workouts")
    .select("started_at, finished_at")
    .not("finished_at", "is", null)
    .order("started_at", { ascending: false });

  if (since) {
    query = query.gte("started_at", since);
  }

  const { data: workouts } = await query;
  if (!workouts || workouts.length === 0) {
    return { totalWorkouts: 0, avgDuration: null };
  }

  const durations = workouts
    .map((w) => {
      if (!w.started_at || !w.finished_at) return null;
      return (new Date(w.finished_at).getTime() - new Date(w.started_at).getTime()) / 60000;
    })
    .filter((d): d is number => d !== null && d > 0 && d < 600);

  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

  return { totalWorkouts: workouts.length, avgDuration };
}

function calcWeekStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const getWeekKey = (d: Date) => {
    const start = new Date(d);
    const day = start.getDay();
    start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  };

  const weeks = new Set(dates.map((d) => getWeekKey(new Date(d))));
  const now = new Date();
  let streak = 0;
  let current = getWeekKey(now);

  // Якщо цього тижня ще не було тренування — перевіряємо минулий
  if (!weeks.has(current)) {
    current -= 7 * 24 * 60 * 60 * 1000;
  }

  while (weeks.has(current)) {
    streak++;
    current -= 7 * 24 * 60 * 60 * 1000;
  }

  return streak;
}

// --- Порівняння з минулим тренуванням ---

export async function fetchLastComparison(): Promise<LastWorkoutComparison | null> {
  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, started_at, finished_at, sets(weight, reps)")
    .not("finished_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(2);

  if (!workouts || workouts.length === 0) return null;

  const calcWorkoutStats = (w: (typeof workouts)[0]) => {
    const sets = Array.isArray(w.sets) ? w.sets : [];
    const volume = sets.reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0);
    const duration =
      w.started_at && w.finished_at
        ? Math.round((new Date(w.finished_at).getTime() - new Date(w.started_at).getTime()) / 60000)
        : null;
    return { volume: Math.round(volume), sets: sets.length, duration };
  };

  const last = calcWorkoutStats(workouts[0]);
  const prev = workouts.length > 1 ? calcWorkoutStats(workouts[1]) : null;

  return {
    lastDate: workouts[0].started_at!,
    lastVolume: last.volume,
    lastSets: last.sets,
    lastDuration: last.duration,
    prevVolume: prev?.volume ?? null,
    prevSets: prev?.sets ?? null,
    volumeDiff: prev ? last.volume - prev.volume : null,
    setsDiff: prev ? last.sets - prev.sets : null,
  };
}

// --- Тонаж по м'язових групах ---

export async function fetchMuscleTonnage(since: string | null): Promise<MuscleGroupTonnage[]> {
  let query = supabase
    .from("sets")
    .select("weight, reps, exercises(muscle_group), workouts!inner(started_at, user_id)");

  if (since) {
    query = query.gte("workouts.started_at", since);
  }

  const { data: sets } = await query;
  if (!sets || sets.length === 0) return [];

  const groupVolume = new Map<string, number>();

  for (const s of sets) {
    const exercises = s.exercises as unknown as
      | { muscle_group: string | null }[]
      | { muscle_group: string | null }
      | null;
    const mg = Array.isArray(exercises)
      ? (exercises[0]?.muscle_group ?? "other")
      : (exercises?.muscle_group ?? "other");
    const vol = (s.weight ?? 0) * (s.reps ?? 0);
    groupVolume.set(mg, (groupVolume.get(mg) ?? 0) + vol);
  }

  return [...groupVolume.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([muscleGroup, volume]) => ({
      muscleGroup,
      label: MUSCLE_LABELS[muscleGroup] ?? muscleGroup,
      volume: Math.round(volume),
    }));
}

// --- Топ вправ за об'ємом ---

export async function fetchTopExercises(since: string | null): Promise<TopExercise[]> {
  let query = supabase
    .from("sets")
    .select("weight, reps, exercise_id, exercises(name), workouts!inner(started_at, user_id)");

  if (since) {
    query = query.gte("workouts.started_at", since);
  }

  const { data: sets } = await query;
  if (!sets || sets.length === 0) return [];

  const exerciseStats = new Map<string, { name: string; volume: number; sets: number }>();

  for (const s of sets) {
    const exercises = s.exercises as unknown as { name: string }[] | { name: string } | null;
    const name = Array.isArray(exercises)
      ? (exercises[0]?.name ?? "Невідома")
      : (exercises?.name ?? "Невідома");

    const existing = exerciseStats.get(s.exercise_id) ?? { name, volume: 0, sets: 0 };
    existing.volume += (s.weight ?? 0) * (s.reps ?? 0);
    existing.sets++;
    exerciseStats.set(s.exercise_id, existing);
  }

  return [...exerciseStats.entries()]
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 8)
    .map(([exerciseId, { name, volume, sets }]) => ({
      exerciseId,
      exerciseName: name,
      volume: Math.round(volume),
      sets,
    }));
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

  return (data ?? []) as unknown as ExerciseProgressData[];
}
