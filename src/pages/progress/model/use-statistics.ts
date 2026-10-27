import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchExerciseProgress, fetchPeriodSummary, type Period } from "@/entities/progress";

import { fetchTrainingDays } from "../api/training-days";
import { getStatisticsSince } from "./statistics";

export function useStatistics(period: Period) {
  return useQuery({
    queryKey: ["progress", "statistics", period],
    queryFn: async () => {
      const now = new Date();
      const since = getStatisticsSince(period, now);
      const [summary, exercises, workouts] = await Promise.all([
        fetchPeriodSummary(since),
        fetchExerciseProgress(since),
        fetchTrainingDays(since),
      ]);
      return { period, asOf: now.toISOString(), ...summary, exercises, workouts };
    },
    placeholderData: keepPreviousData,
  });
}
