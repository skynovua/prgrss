import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchGlobalStats,
  fetchPeriodSummary,
  fetchExerciseProgress,
  periodToDate,
  type Period,
} from "@/src/lib/api/stats";

// Період-незалежні дані — не рефетчаться при зміні фільтра
export function useGlobalStats() {
  return useQuery({
    queryKey: ["progress", "global"],
    queryFn: fetchGlobalStats,
    staleTime: 5 * 60 * 1000,
  });
}

// Період-залежні дані — показують попередні дані поки вантажаться нові
export function usePeriodProgress(period: Period) {
  return useQuery({
    queryKey: ["progress", "period", period],
    queryFn: async () => {
      const since = periodToDate(period);
      const [summary, exerciseProgress] = await Promise.all([
        fetchPeriodSummary(since),
        fetchExerciseProgress(since),
      ]);
      return { ...summary, exerciseProgress };
    },
    placeholderData: keepPreviousData,
  });
}
