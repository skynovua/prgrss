import { supabase } from "@/src/lib/supabase/client";

export async function fetchExercises() {
  const { data } = await supabase.from("exercises").select("*").order("muscle_group").order("name");
  return data ?? [];
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
