"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteWorkout(workoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизовано");

  // RLS захищає — видалити можна тільки свої
  // Спочатку видаляємо sets (FK constraint)
  await supabase.from("sets").delete().eq("workout_id", workoutId);
  await supabase.from("workouts").delete().eq("id", workoutId);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteSetFromWorkout(
  setId: string,
  workoutId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизовано");

  await supabase.from("sets").delete().eq("id", setId);
  revalidatePath(`/workout/${workoutId}`);
}
