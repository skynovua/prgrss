import { createClient } from "@/lib/supabase/server";
import { ExerciseLibrary } from "@/components/exercises/exercise-library";

export default async function ExercisesPage() {
  const supabase = await createClient();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("muscle_group")
    .order("name");

  return <ExerciseLibrary exercises={exercises ?? []} />;
}
