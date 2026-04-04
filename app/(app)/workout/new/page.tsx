import { createClient } from "@/lib/supabase/server";
import { WorkoutLogger } from "@/components/workout/workout-logger";
import { redirect } from "next/navigation";

export default async function NewWorkoutPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("muscle_group")
    .order("name");

  return (
    <WorkoutLogger exercises={exercises ?? []} userId={user.id} />
  );
}
