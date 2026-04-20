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

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "workouts",
    title: "Тренування",
    description: "Завершіть {target} тренувань",
    icon: "🏋️",
    tiers: [
      { tier: "bronze", target: 10 },
      { tier: "silver", target: 50 },
      { tier: "gold", target: 100 },
    ],
  },
  {
    id: "streak",
    title: "Стрік",
    description: "{target} тижнів поспіль",
    icon: "🔥",
    tiers: [
      { tier: "bronze", target: 2 },
      { tier: "silver", target: 4 },
      { tier: "gold", target: 8 },
    ],
  },
  {
    id: "volume",
    title: "Тонаж",
    description: "Підніміть {target} кг загалом",
    icon: "⚡",
    tiers: [
      { tier: "bronze", target: 10000 },
      { tier: "silver", target: 50000 },
      { tier: "gold", target: 100000 },
    ],
  },
  {
    id: "sets",
    title: "Підходи",
    description: "Виконайте {target} підходів",
    icon: "💪",
    tiers: [
      { tier: "bronze", target: 100 },
      { tier: "silver", target: 500 },
      { tier: "gold", target: 1000 },
    ],
  },
  {
    id: "exercises",
    title: "Різноманітність",
    description: "Спробуйте {target} різних вправ",
    icon: "🎯",
    tiers: [
      { tier: "bronze", target: 10 },
      { tier: "silver", target: 25 },
      { tier: "gold", target: 40 },
    ],
  },
  {
    id: "1rm",
    title: "Сила",
    description: "Досягніть 1RM {target} кг в будь-якій вправі",
    icon: "🏆",
    tiers: [
      { tier: "bronze", target: 60 },
      { tier: "silver", target: 100 },
      { tier: "gold", target: 140 },
    ],
  },
];

function formatDescription(template: string, target: number): string {
  const formatted = target >= 1000 ? `${(target / 1000).toFixed(0)}k` : target.toString();
  return template.replace("{target}", formatted);
}

// --- Типи RPC відповіді ---

interface AchievementMetrics {
  total_workouts: number;
  total_sets: number;
  total_volume: number;
  unique_exercises: number;
  best_1rm: number;
  workout_dates: string[];
}

// --- Основна функція ---

export async function fetchAchievements(): Promise<Achievement[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_achievement_metrics");

  if (error) throw error;

  const metrics = data as unknown as AchievementMetrics;
  const streak = calcWeekStreak(metrics.workout_dates ?? []);

  const values: Record<string, number> = {
    workouts: metrics.total_workouts,
    streak,
    volume: metrics.total_volume,
    sets: metrics.total_sets,
    exercises: metrics.unique_exercises,
    "1rm": Math.round(metrics.best_1rm),
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
