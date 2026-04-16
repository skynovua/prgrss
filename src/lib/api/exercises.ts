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
