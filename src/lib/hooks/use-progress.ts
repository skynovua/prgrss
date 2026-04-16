import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchStreak,
  fetchLastComparison,
  fetchPeriodStats,
  fetchMuscleTonnage,
  fetchTopExercises,
  fetchExerciseProgress,
  periodToDate,
  type Period,
} from "@/src/lib/api/stats";

// Період-незалежні дані — не рефетчаться при зміні фільтра
export function useGlobalStats() {
  return useQuery({
    queryKey: ["progress", "global"],
    queryFn: async () => {
      const [streak, lastComparison] = await Promise.all([fetchStreak(), fetchLastComparison()]);
      return { streak, lastComparison };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Період-залежні дані — показують попередні дані поки вантажаться нові
export function usePeriodProgress(period: Period) {
  return useQuery({
    queryKey: ["progress", "period", period],
    queryFn: async () => {
      const since = periodToDate(period);
      const [stats, muscleTonnage, topExercises, exerciseProgress] = await Promise.all([
        fetchPeriodStats(since),
        fetchMuscleTonnage(since),
        fetchTopExercises(since),
        fetchExerciseProgress(since),
      ]);
      return { stats, muscleTonnage, topExercises, exerciseProgress };
    },
    placeholderData: keepPreviousData,
  });
}
