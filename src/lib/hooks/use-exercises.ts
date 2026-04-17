import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchExercises,
  createExercise,
  deleteExercise,
  fetchFavoriteExerciseIds,
  toggleFavoriteExercise,
  fetchPopularExerciseIds,
} from "@/src/lib/api/exercises";
import { toast } from "sonner";

export function useExercises() {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: fetchExercises,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Вправу додано");
    },
    onError: (err) => {
      toast.error("Не вдалося додати вправу", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Вправу видалено");
    },
    onError: (err) => {
      toast.error("Не вдалося видалити вправу", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
    },
  });
}

export function useFavoriteExerciseIds() {
  return useQuery({
    queryKey: ["favorite-exercises"],
    queryFn: fetchFavoriteExerciseIds,
  });
}

export function useToggleFavoriteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ exerciseId, isFavorite }: { exerciseId: string; isFavorite: boolean }) =>
      toggleFavoriteExercise(exerciseId, isFavorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-exercises"] });
    },
  });
}

export function usePopularExerciseIds() {
  return useQuery({
    queryKey: ["popular-exercises"],
    queryFn: fetchPopularExerciseIds,
    staleTime: 5 * 60 * 1000, // 5 хвилин
  });
}
