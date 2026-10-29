import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchExerciseProgress,
  fetchExerciseProgressById,
  fetchGlobalStats,
  fetchPeriodSummary,
  type Period,
  periodToDate,
} from "@/entities/progress";
import { withQueryTimeout } from "@/shared/api";

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

export function useExerciseProgress(exerciseId: string, period: Period) {
  return useQuery({
    queryKey: ["progress", "exercise", exerciseId, period],
    queryFn: () =>
      withQueryTimeout(() => fetchExerciseProgressById(exerciseId, periodToDate(period))),
    enabled: Boolean(exerciseId),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === exerciseId ? previous : undefined,
  });
}
