"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withAuth } from "./protected";

export async function deleteWorkout(workoutId: string) {
  await withAuth(async (_userId, supabase) => {
    // RLS захищає — видалити можна тільки свої
    // Спочатку видаляємо sets (FK constraint)
    await supabase.from("sets").delete().eq("workout_id", workoutId);
    await supabase.from("workouts").delete().eq("id", workoutId);
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteSetFromWorkout(setId: string, workoutId: string) {
  await withAuth(async (_userId, supabase) => {
    await supabase.from("sets").delete().eq("id", setId);
  });
  revalidatePath(`/workout/${workoutId}`);
}
