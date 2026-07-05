import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWorkoutDetail,
  fetchPreviousSets,
  deleteWorkout,
  deleteSetFromWorkout,
  updateWorkout,
} from "@/entities/workout";
import type { WorkoutExercise } from "@/entities/workout";
import { toWorkoutOperationError } from "@/entities/workout";
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
    }: {
      workoutId: string;
      exercises: WorkoutExercise[];
      notes?: string | null;
    }) => updateWorkout(workoutId, exercises, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
