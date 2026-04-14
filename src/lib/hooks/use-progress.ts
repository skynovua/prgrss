import { useQuery } from "@tanstack/react-query";
import { getProgressData, type Period } from "@/src/lib/api/stats";

export function useProgress(period: Period) {
  return useQuery({
    queryKey: ["progress", period],
    queryFn: () => getProgressData(period),
  });
}
