import { createClient } from "@/lib/supabase/server";
import { WorkoutLogger } from "@/components/workout/workout-logger";

export default async function NewWorkoutPage() {
  const supabase = await createClient();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("muscle_group")
    .order("name");

  return <WorkoutLogger exercises={exercises ?? []} />;
}
