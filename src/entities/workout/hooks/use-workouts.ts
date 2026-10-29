import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { WorkoutExercise } from "@/entities/workout";
import {
  deleteSetFromWorkout,
  deleteWorkout,
  fetchPreviousSets,
  fetchWorkoutDetail,
  updateWorkout,
} from "@/entities/workout";
import { toWorkoutOperationError } from "@/entities/workout";
import { withQueryTimeout } from "@/shared/api";

export function useWorkoutDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["workout", id],
    queryFn: () => withQueryTimeout(() => fetchWorkoutDetail(id!)),
    enabled: !!id,
  });
}

export const previousSetsQueryOptions = queryOptions({
  queryKey: ["previousSets"],
  queryFn: () => withQueryTimeout(fetchPreviousSets),
});

export function usePreviousSets() {
  return useQuery(previousSetsQueryOptions);
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
    onError: (err) => {
      const mappedError = toWorkoutOperationError(err, "delete");
      toast.error("Не вдалося видалити тренування", {
        description: mappedError.message,
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
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
    onError: (err) => {
      toast.error("Не вдалося видалити підхід", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workoutId,
      exercises,
      notes,
      name,
    }: {
      workoutId: string;
      exercises: WorkoutExercise[];
      notes?: string | null;
      name?: string;
    }) => updateWorkout(workoutId, exercises, notes, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["workout"] });
      queryClient.invalidateQueries({ queryKey: ["previousSets"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
    onError: (err) => {
      const mappedError = toWorkoutOperationError(err, "update");
      toast.error("Не вдалося оновити тренування", {
        description: mappedError.message,
      });
    },
  });
}
