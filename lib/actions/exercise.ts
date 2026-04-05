"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createExercise(formData: {
  name: string;
  muscle_group: string;
  equipment: string;
}) {
  const supabase = await createClient();
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
  revalidatePath("/exercises");
}

export async function deleteExercise(exerciseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизовано");

  // Видаляємо тільки кастомні вправи користувача
  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", exerciseId)
    .eq("user_id", user.id)
    .eq("is_custom", true);

  if (error) throw new Error(error.message);
  revalidatePath("/exercises");
}
