import { supabase } from "@/src/lib/supabase/client";
import { db } from "@/src/lib/offline/db";

export async function fetchExercises() {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("muscle_group")
    .order("name");

  if (data && !error) {
    // Кешуємо вправи в IndexedDB для офлайн доступу
    try {
      await db.cachedExercises.clear();
      await db.cachedExercises.bulkPut(data);
    } catch {
      // Не блокуємо якщо кеш не записався
    }
    return data;
  }

  // Офлайн — повертаємо з IndexedDB
  const cached = await db.cachedExercises.orderBy("muscle_group").toArray();
  if (cached.length > 0) return cached;

  throw new Error("Не вдалося завантажити вправи");
}

export async function createExercise(formData: {
  name: string;
  muscle_group: string;
  equipment: string;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизовано");

  const { error } = await supabase.from("exercises").insert({
    user_id: user.id,
    name: formData.name.trim(),
    muscle_group: formData.muscle_group,
    equipment: formData.equipment,
    is_custom: true,
  });
  if (error) throw new Error(error.message);
}

export async function deleteExercise(exerciseId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизовано");

  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", exerciseId)
    .eq("user_id", user.id)
    .eq("is_custom", true);
  if (error) throw new Error(error.message);
}

// --- Вподобані вправи ---

export async function fetchFavoriteExerciseIds(): Promise<string[]> {
  const { data, error } = await supabase.from("favorite_exercises").select("exercise_id");

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.exercise_id);
}

export async function toggleFavoriteExercise(exerciseId: string, isFavorite: boolean) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Не авторизовано");

  if (isFavorite) {
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
