import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAchievements,
  markAchievementStatesSeen,
  type Achievement,
} from "@/entities/achievement";

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: fetchAchievements,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarkAchievementsSeen() {
  const queryClient = useQueryClient();

  return useCallback(
    async (achievementIds: string[]) => {
      if (achievementIds.length === 0) return;

      const markedAt = await markAchievementStatesSeen(achievementIds);

      if (!markedAt) return;

      queryClient.setQueryData<Achievement[] | undefined>(["achievements"], (current) =>
        current?.map((achievement) =>
          achievementIds.includes(achievement.id)
            ? { ...achievement, seenAt: markedAt }
            : achievement
        )
      );
    },
    [queryClient]
  );
}
