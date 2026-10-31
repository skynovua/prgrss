import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { withQueryTimeout } from "@/shared/api";
import { useAuth } from "@/shared/auth";

import {
  archiveExercise,
  createExercise,
  fetchAnatomicalMuscles,
  fetchExercises,
  fetchFavoriteExerciseIds,
  fetchPopularExerciseIds,
  toggleFavoriteExercise,
} from "../api/exercises";

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

export const exerciseCatalogOptions = (userId: string) =>
  queryOptions({
    queryKey: exerciseQueryKeys.catalog(userId),
    queryFn: () => withQueryTimeout(fetchExercises),
    staleTime: 30 * 60 * 1000,
  });

export function useExercises({ enabled = true }: ExerciseQueryOptions = {}) {
  const { user } = useAuth();
  return useQuery({ ...exerciseCatalogOptions(user?.id ?? ""), enabled: enabled && Boolean(user) });
}

export const anatomicalMusclesQueryOptions = queryOptions({
  queryKey: exerciseQueryKeys.anatomicalMuscles,
  queryFn: fetchAnatomicalMuscles,
  staleTime: 30 * 60 * 1000,
});

export function useAnatomicalMuscles() {
  const { user } = useAuth();

  return useQuery({
    ...anatomicalMusclesQueryOptions,
    enabled: Boolean(user),
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

export const popularExerciseIdsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: exerciseQueryKeys.popular(userId),
    queryFn: () => withQueryTimeout(fetchPopularExerciseIds),
    staleTime: 5 * 60 * 1000, // 5 хвилин
    retryOnMount: false,
  });

export function usePopularExerciseIds({ enabled = true }: ExerciseQueryOptions = {}) {
  const { user } = useAuth();

  return useQuery({
    ...popularExerciseIdsQueryOptions(user?.id ?? ""),
    enabled: enabled && Boolean(user),
  });
}
