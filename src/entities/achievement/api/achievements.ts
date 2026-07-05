import { supabase } from "@/shared/api";
import type { Database } from "@/shared/db";

type AchievementTier = "bronze" | "silver" | "gold";
export type AchievementRow = Database["public"]["Functions"]["get_achievements"]["Returns"][number];

export type Achievement = Omit<
  AchievementRow,
  "family_key" | "unlocked_at" | "seen_at" | "tier"
> & {
  familyKey: AchievementRow["family_key"];
  unlockedAt: AchievementRow["unlocked_at"] | null;
  seenAt: AchievementRow["seen_at"] | null;
  tier: AchievementTier;
};

export async function markAchievementStatesSeen(achievementIds: string[]) {
  if (achievementIds.length === 0) return null;

  const { data, error } = await supabase.rpc("mark_achievement_states_seen", {
    achievement_ids: achievementIds,
  });

  if (error) throw error;

  return data ?? new Date().toISOString();
}

// --- Основна функція ---

export async function fetchAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase.rpc("get_achievements");

  if (error) throw error;

  return (data ?? []).map((achievement) => ({
    id: achievement.id,
    familyKey: achievement.family_key,
    slug: achievement.slug,
    title: achievement.title,
    description: achievement.description,
    tier: achievement.tier as AchievementTier,
    progress: achievement.progress,
    current: achievement.current,
    target: achievement.target,
    unlocked: achievement.unlocked,
    unlockedAt: achievement.unlocked_at,
    seenAt: achievement.seen_at,
  }));
}
