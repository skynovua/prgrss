import { supabase } from "@/shared/api";
import type {
  CreateExerciseInput,
  ExerciseCatalogItem,
  ExerciseMuscleInput,
} from "../model/exercise-catalog";

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);
  if (!user) throw new Error("Не авторизовано");

  return user.id;
}

function validateExerciseMuscles(muscles: ExerciseMuscleInput[]) {
  if (muscles.length === 0) {
    throw new Error("Оберіть хоча б один м'яз");
  }

  if (new Set(muscles.map((muscle) => muscle.muscleKey)).size !== muscles.length) {
    throw new Error("М'язи у вправі не мають повторюватися");
  }

  if (
    muscles.some(
      (muscle) =>
        !Number.isInteger(muscle.activationScore) ||
        muscle.activationScore < 1 ||
        muscle.activationScore > 10
    )
  ) {
    throw new Error("Оцінка залучення має бути від 1 до 10");
  }

  if (!muscles.some((muscle) => muscle.activationScore >= 8)) {
    throw new Error("Основний м'яз повинен мати оцінку щонайменше 8");
  }
}

export async function fetchExercises(): Promise<ExerciseCatalogItem[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select(
      "*, exercise_muscles(activation_score, anatomical_muscles(key, name, muscle_group, sort_order))"
    )
    .eq("is_active", true)
    .order("muscle_group")
    .order("name");

  if (error) throw new Error(error.message);

  return (data ?? []).map(({ exercise_muscles, ...exercise }) => ({
    ...exercise,
    muscles: exercise_muscles
      .flatMap(({ activation_score, anatomical_muscles }) =>
        anatomical_muscles
          ? [
              {
                muscleKey: anatomical_muscles.key,
                name: anatomical_muscles.name,
                muscleGroup: anatomical_muscles.muscle_group,
                sortOrder: anatomical_muscles.sort_order,
                activationScore: activation_score,
              },
            ]
          : []
      )
      .sort(
        (left, right) =>
          right.activationScore - left.activationScore || left.sortOrder - right.sortOrder
      ),
  }));
}

export async function fetchAnatomicalMuscles() {
  const { data, error } = await supabase
    .from("anatomical_muscles")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createExercise(formData: CreateExerciseInput) {
  const userId = await getCurrentUserId();

  const name = formData.name.trim();
  if (!name) throw new Error("Вкажіть назву вправи");
  validateExerciseMuscles(formData.muscles);

  const { data: exercise, error } = await supabase
    .from("exercises")
    .insert({
      user_id: userId,
      name,
      equipment: formData.equipment,
      is_custom: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const { error: musclesError } = await supabase.from("exercise_muscles").insert(
    formData.muscles.map((muscle) => ({
      exercise_id: exercise.id,
      muscle_key: muscle.muscleKey,
      activation_score: muscle.activationScore,
    }))
  );

  if (musclesError) {
    await supabase.from("exercises").delete().eq("id", exercise.id);
    throw new Error(musclesError.message);
  }
}

export async function archiveExercise(exerciseId: string) {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("exercises")
    .update({ is_active: false })
    .eq("id", exerciseId)
    .eq("user_id", userId)
    .eq("is_custom", true);
  if (error) throw new Error(error.message);
}

// --- Вподобані вправи ---

export async function fetchFavoriteExerciseIds(): Promise<string[]> {
  const { data, error } = await supabase.from("favorite_exercises").select("exercise_id");

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.exercise_id);
}

export async function toggleFavoriteExercise(exerciseId: string, wasFavorite: boolean) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Не авторизовано");

  if (wasFavorite) {
    const { error } = await supabase
      .from("favorite_exercises")
      .delete()
      .eq("user_id", session.user.id)
      .eq("exercise_id", exerciseId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("favorite_exercises")
      .insert({ user_id: session.user.id, exercise_id: exerciseId });
    if (error) throw new Error(error.message);
  }
}

// --- Популярні вправи ---

export async function fetchPopularExerciseIds(): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_popular_exercises", { lim: 20 });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.exercise_id);
}
