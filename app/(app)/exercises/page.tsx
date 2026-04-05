import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExerciseLibrary } from "@/components/exercises/exercise-library";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Системні + кастомні вправи користувача
  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("muscle_group")
    .order("name");

  return <ExerciseLibrary exercises={exercises ?? []} userId={user.id} />;
}
