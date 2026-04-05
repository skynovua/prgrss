import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkoutDetail } from "@/components/workout/workout-detail";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workout } = await supabase
    .from("workouts")
    .select("id, name, started_at, finished_at, notes")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!workout) redirect("/dashboard");

  const { data: sets } = await supabase
    .from("sets")
    .select("id, set_number, weight, reps, rpe, duration_s, exercise_id")
    .eq("workout_id", id)
    .order("set_number");

  // Збираємо унікальні exercise_id
  const exerciseIds = [...new Set((sets ?? []).map((s) => s.exercise_id))];

  const { data: exercises } = exerciseIds.length
    ? await supabase
        .from("exercises")
        .select("id, name, muscle_group, equipment")
        .in("id", exerciseIds)
    : { data: [] };

  return (
    <WorkoutDetail
      workout={{ ...workout, sets: sets ?? [] }}
      exercises={exercises ?? []}
    />
  );
}
