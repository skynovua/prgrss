import type { Achievement } from "@/entities/achievement";

export const TIER_ORDER = ["bronze", "silver", "gold"] as const;
export const TIER_LABELS: Record<Achievement["tier"], string> = {
  bronze: "Бронза",
  silver: "Срібло",
  gold: "Золото",
};

export interface AchievementTrack {
  key: Achievement["familyKey"];
  title: Achievement["title"];
  tiers: Achievement[];
}

// Дата здобуття зберігає нагороду, навіть якщо поточна серія перервалася.
export function isEarned(achievement: Achievement) {
  return achievement.unlocked || Boolean(achievement.unlockedAt);
}

export function buildAchievementTracks(achievements: Achievement[]): AchievementTrack[] {
  const tracks = new Map<string, AchievementTrack>();
  for (const achievement of achievements) {
    const track = tracks.get(achievement.familyKey);
    if (track) {
      track.tiers.push(achievement);
    } else {
      tracks.set(achievement.familyKey, {
        key: achievement.familyKey,
        title: achievement.title,
        tiers: [achievement],
      });
    }
  }
  return [...tracks.values()].map((track) => ({
    ...track,
    tiers: track.tiers.sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)),
  }));
}

export function getNextTier(track: AchievementTrack) {
  return track.tiers.find((achievement) => !isEarned(achievement));
}

export function getBestTier(track: AchievementTrack) {
  return [...track.tiers].reverse().find(isEarned);
}

export function getUnseenRewards(track: AchievementTrack) {
  return track.tiers.filter(
    (achievement) => isEarned(achievement) && achievement.unlockedAt && !achievement.seenAt
  );
}

export function getProgressPercent(achievement: Achievement) {
  if (isEarned(achievement)) return 100;
  return Math.min(99, Math.max(0, Math.round(achievement.progress * 100)));
}

export function getClosestTrack(tracks: AchievementTrack[]) {
  return tracks
    .filter((track) => getNextTier(track))
    .sort((a, b) => (getNextTier(b)?.progress ?? 0) - (getNextTier(a)?.progress ?? 0))[0];
}

const METRIC_LABELS: Record<string, [string, string, string]> = {
  workouts: ["тренування", "тренування", "тренувань"],
  streak: ["тиждень", "тижні", "тижнів"],
  sets: ["підхід", "підходи", "підходів"],
  exercises: ["вправа", "вправи", "вправ"],
  reps: ["повторення", "повторення", "повторень"],
  duration: ["година", "години", "годин"],
  balance: ["група м’язів", "групи м’язів", "груп м’язів"],
};

export function formatMetric(key: string, value: number) {
  const number = value.toLocaleString("uk-UA", { maximumFractionDigits: 1 });
  if (key === "volume" || key === "1rm") return `${number} кг`;
  const forms = METRIC_LABELS[key];
  if (!forms) return number;
  const plural = new Intl.PluralRules("uk-UA").select(value);
  return `${number} ${forms[plural === "one" ? 0 : plural === "few" ? 1 : 2]}`;
}

export function getRemainingLabel(achievement: Achievement) {
  const remaining = Math.max(0, achievement.target - achievement.current);
  return `Ще ${formatMetric(achievement.familyKey, remaining)}${achievement.familyKey === "streak" ? " поспіль" : ""}`;
}

export function getGoalDescription(achievement: Achievement) {
  const target = formatMetric(achievement.familyKey, achievement.target);
  switch (achievement.familyKey) {
    case "workouts":
      return `Заверши ${target}.`;
    case "streak":
      return `Тренуйся ${target} поспіль.`;
    case "volume":
      return `Накопич загальний об’єм ${target}.`;
    case "sets":
      return `Виконай ${target} у тренуваннях.`;
    case "exercises":
      return `Використай ${target} у завершених тренуваннях.`;
    case "1rm":
      return `Досягни розрахункового 1ПМ ${target} у будь-якій вправі.`;
    case "reps":
      return `Виконай загалом ${target}.`;
    case "duration":
      return `Загальний час тренувань — ${target}.`;
    case "balance":
      return `Урізноманітни тренування: ${target}.`;
    default:
      return achievement.description;
  }
}
