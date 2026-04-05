"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "./protected";

export async function createExercise(formData: {
  name: string;
  muscle_group: string;
  equipment: string;
}) {
  await withAuth(async (userId, supabase) => {
    const { error } = await supabase.from("exercises").insert({
      user_id: userId,
      name: formData.name.trim(),
      muscle_group: formData.muscle_group,
      equipment: formData.equipment,
      is_custom: true,
    });
    if (error) throw new Error(error.message);
  });
  revalidatePath("/exercises");
}

export async function deleteExercise(exerciseId: string) {
  await withAuth(async (userId, supabase) => {
    const { error } = await supabase
      .from("exercises")
      .delete()
      .eq("id", exerciseId)
      .eq("user_id", userId)
      .eq("is_custom", true);
    if (error) throw new Error(error.message);
  });
  revalidatePath("/exercises");
}
