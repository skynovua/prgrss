import { useQuery } from "@tanstack/react-query";
import { fetchAchievements } from "@/src/lib/api/achievements";

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: fetchAchievements,
    staleTime: 5 * 60 * 1000,
  });
}
