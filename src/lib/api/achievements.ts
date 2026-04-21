import { supabase } from "@/src/lib/supabase/client";

// --- Типи ---

export interface Achievement {
  id: string;
  familyKey: string;
  slug: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold";
  progress: number; // 0–1
  current: number;
  target: number;
  unlocked: boolean;
  unlockedAt: string | null;
  seenAt: string | null;
}

interface AchievementRow {
  id: string;
  family_key: string;
  slug: string;
  title: string;
  description: string;
  tier: Achievement["tier"];
  progress: number;
  current: number;
  target: number;
  unlocked: boolean;
  unlocked_at: string | null;
  seen_at: string | null;
}

export async function markAchievementStatesSeen(achievementIds: string[]) {
  if (achievementIds.length === 0) return null;

  const { data, error } = await supabase.rpc(
    "mark_achievement_states_seen" as never,
    { achievement_ids: achievementIds } as never
  );

  if (error) throw error;

  return (data as string | null) ?? new Date().toISOString();
}

// --- Основна функція ---

export async function fetchAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase.rpc("get_achievements" as never);

  if (error) throw error;

  return ((data ?? []) as AchievementRow[]).map((achievement) => ({
    id: achievement.id,
    familyKey: achievement.family_key,
    slug: achievement.slug,
    title: achievement.title,
    description: achievement.description,
    tier: achievement.tier,
    progress: achievement.progress,
    current: achievement.current,
    target: achievement.target,
    unlocked: achievement.unlocked,
    unlockedAt: achievement.unlocked_at,
    seenAt: achievement.seen_at,
  }));
}
