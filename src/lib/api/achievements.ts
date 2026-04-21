import { supabase } from "@/src/lib/supabase/client";

// --- Типи ---

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
  progress: number; // 0–1
  current: number;
  target: number;
  unlocked: boolean;
}

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  tiers: { tier: "bronze" | "silver" | "gold"; target: number }[];
}

interface AchievementMetrics {
  total_workouts?: number | null;
  total_sets?: number | null;
  total_reps?: number | null;
  total_volume?: number | null;
  unique_exercises?: number | null;
  distinct_muscle_groups?: number | null;
  best_1rm?: number | null;
  total_duration_hours?: number | null;
  workout_dates?: Array<string | null> | null;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "workouts",
    title: "Тренування",
    description: "Завершіть {target} тренувань",
    icon: "🏋️",
    tiers: [
      { tier: "bronze", target: 15 },
      { tier: "silver", target: 40 },
      { tier: "gold", target: 140 },
    ],
  },
  {
    id: "streak",
    title: "Стрік",
    description: "{target} тижнів поспіль",
    icon: "🔥",
    tiers: [
      { tier: "bronze", target: 5 },
      { tier: "silver", target: 10 },
      { tier: "gold", target: 20 },
    ],
  },
  {
    id: "volume",
    title: "Тонаж",
    description: "Підніміть {target} кг загалом",
    icon: "⚡",
    tiers: [
      { tier: "bronze", target: 20000 },
      { tier: "silver", target: 50000 },
      { tier: "gold", target: 180000 },
    ],
  },
  {
    id: "sets",
    title: "Підходи",
    description: "Виконайте {target} підходів",
    icon: "💪",
    tiers: [
      { tier: "bronze", target: 125 },
      { tier: "silver", target: 320 },
      { tier: "gold", target: 1200 },
    ],
  },
  {
    id: "exercises",
    title: "Різноманітність",
    description: "Спробуйте {target} різних вправ",
    icon: "🎯",
    tiers: [
      { tier: "bronze", target: 15 },
      { tier: "silver", target: 28 },
      { tier: "gold", target: 45 },
    ],
  },
  {
    id: "1rm",
    title: "Сила",
    description: "Досягніть 1RM {target} кг в будь-якій вправі",
    icon: "🏆",
    tiers: [
      { tier: "bronze", target: 100 },
      { tier: "silver", target: 130 },
      { tier: "gold", target: 180 },
    ],
  },
  {
    id: "reps",
    title: "Повторення",
    description: "Зробіть {target} повторень",
    icon: "🔁",
    tiers: [
      { tier: "bronze", target: 1500 },
      { tier: "silver", target: 4500 },
      { tier: "gold", target: 16000 },
    ],
  },
  {
    id: "duration",
    title: "Час у залі",
    description: "Проведіть {target} годин у тренуваннях",
    icon: "⏱️",
    tiers: [
      { tier: "bronze", target: 12 },
      { tier: "silver", target: 32 },
      { tier: "gold", target: 110 },
    ],
  },
  {
    id: "balance",
    title: "Баланс",
    description: "Охопіть {target} груп м'язів",
    icon: "🧩",
    tiers: [
      { tier: "bronze", target: 4 },
      { tier: "silver", target: 5 },
      { tier: "gold", target: 6 },
    ],
  },
];

function formatDescription(template: string, target: number): string {
  const formatted = target >= 1000 ? `${(target / 1000).toFixed(0)}k` : target.toString();
  return template.replace("{target}", formatted);
}

// --- Основна функція ---

export async function fetchAchievements(): Promise<Achievement[]> {
  const { data: metrics, error } = await supabase.rpc("get_achievement_metrics");

  if (error) throw error;

  const typedMetrics = metrics as AchievementMetrics | null;

  const streak = calcWeekStreak(typedMetrics?.workout_dates ?? []);

  const values: Record<string, number> = {
    workouts: typedMetrics?.total_workouts ?? 0,
    streak,
    volume: typedMetrics?.total_volume ?? 0,
    sets: typedMetrics?.total_sets ?? 0,
    exercises: typedMetrics?.unique_exercises ?? 0,
    "1rm": Math.round(typedMetrics?.best_1rm ?? 0),
    reps: typedMetrics?.total_reps ?? 0,
    duration: Math.floor(typedMetrics?.total_duration_hours ?? 0),
    balance: typedMetrics?.distinct_muscle_groups ?? 0,
  };

  const achievements: Achievement[] = [];

  for (const def of ACHIEVEMENT_DEFS) {
    const current = values[def.id] ?? 0;

    for (const { tier, target } of def.tiers) {
      const progress = Math.min(current / target, 1);
      achievements.push({
        id: `${def.id}_${tier}`,
        title: def.title,
        description: formatDescription(def.description, target),
        icon: def.icon,
        tier,
        progress,
        current,
        target,
        unlocked: current >= target,
      });
    }
  }

  return achievements;
}

function calcWeekStreak(dates: Array<string | null>): number {
  if (dates.length === 0) return 0;

  const getWeekKey = (d: Date) => {
    const start = new Date(d);
    const day = start.getDay();
    start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  };

  const weeks = new Set(
    dates.filter((date): date is string => date !== null).map((d) => getWeekKey(new Date(d)))
  );
  const now = new Date();
  let streakCount = 0;
  let current = getWeekKey(now);

  if (!weeks.has(current)) {
    current -= 7 * 24 * 60 * 60 * 1000;
  }

  while (weeks.has(current)) {
    streakCount++;
    current -= 7 * 24 * 60 * 60 * 1000;
  }

  return streakCount;
}
