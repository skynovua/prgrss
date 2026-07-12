import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchExercises,
  fetchAnatomicalMuscles,
  createExercise,
  archiveExercise,
  fetchFavoriteExerciseIds,
  toggleFavoriteExercise,
  fetchPopularExerciseIds,
} from "../api/exercises";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";

const EXERCISE_CATALOG_QUERY_KEY = ["exercise", "catalog"] as const;

const exerciseQueryKeys = {
  catalog: (userId: string | undefined) => [...EXERCISE_CATALOG_QUERY_KEY, userId] as const,
  anatomicalMuscles: ["exercise", "anatomical-muscles"] as const,
  favorites: (userId: string | undefined) => ["exercise", "favorites", userId] as const,
  popular: (userId: string | undefined) => ["exercise", "popular", userId] as const,
};

interface ExerciseQueryOptions {
  enabled?: boolean;
}

export function useExercises({ enabled = true }: ExerciseQueryOptions = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: exerciseQueryKeys.catalog(user?.id),
    queryFn: fetchExercises,
    enabled: enabled && Boolean(user),
    staleTime: 30 * 60 * 1000,
  });
}

export function useAnatomicalMuscles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: exerciseQueryKeys.anatomicalMuscles,
    queryFn: fetchAnatomicalMuscles,
    enabled: Boolean(user),
    staleTime: 30 * 60 * 1000,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXERCISE_CATALOG_QUERY_KEY });
      toast.success("Вправу додано");
    },
    onError: (err) => {
      toast.error("Не вдалося додати вправу", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
    },
  });
}

export function useArchiveExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXERCISE_CATALOG_QUERY_KEY });
      toast.success("Вправу приховано");
    },
    onError: (err) => {
      toast.error("Не вдалося приховати вправу", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
    },
  });
}

export function useFavoriteExerciseIds({ enabled = true }: ExerciseQueryOptions = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: exerciseQueryKeys.favorites(user?.id),
    queryFn: fetchFavoriteExerciseIds,
    enabled: enabled && Boolean(user),
  });
}

export function useToggleFavoriteExercise() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const favoriteQueryKey = exerciseQueryKeys.favorites(user?.id);

  return useMutation({
    mutationFn: ({ exerciseId, wasFavorite }: { exerciseId: string; wasFavorite: boolean }) =>
      toggleFavoriteExercise(exerciseId, wasFavorite),
    onMutate: async ({ exerciseId, wasFavorite }) => {
      // Скасовуємо запити що летять, щоб не перезаписати optimistic update
      await queryClient.cancelQueries({ queryKey: favoriteQueryKey });

      const previous = queryClient.getQueryData<string[]>(favoriteQueryKey);

      queryClient.setQueryData<string[]>(favoriteQueryKey, (old = []) =>
        wasFavorite
          ? old.filter((id) => id !== exerciseId)
          : old.includes(exerciseId)
            ? old
            : [...old, exerciseId]
      );

      return { previous };
    },
    onError: (err, _vars, context) => {
      // Відкат при помилці
      queryClient.setQueryData(favoriteQueryKey, context?.previous);
      toast.error("Не вдалося оновити вподобання", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteQueryKey });
    },
  });
}

export function usePopularExerciseIds({ enabled = true }: ExerciseQueryOptions = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: exerciseQueryKeys.popular(user?.id),
    queryFn: fetchPopularExerciseIds,
    enabled: enabled && Boolean(user),
    staleTime: 5 * 60 * 1000, // 5 хвилин
  });
}
