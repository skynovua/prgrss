import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWorkoutDetail,
  fetchPreviousSets,
  deleteWorkout,
  deleteSetFromWorkout,
} from "@/src/lib/api/workouts";
import { toast } from "sonner";

export function useWorkoutDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["workout", id],
    queryFn: () => fetchWorkoutDetail(id!),
    enabled: !!id,
  });
}

export function usePreviousSets() {
  return useQuery({
    queryKey: ["previousSets"],
    queryFn: fetchPreviousSets,
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => {
      toast.error("Не вдалося видалити тренування", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
    },
  });
}

export function useDeleteSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSetFromWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => {
      toast.error("Не вдалося видалити підхід", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
    },
  });
}
