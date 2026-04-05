import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkoutDetail } from "@/components/workout/workout-detail";

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: workout } = await supabase
    .from("workouts")
    .select(
      "id, name, started_at, finished_at, notes, sets(id, set_number, weight, reps, rpe, duration_s, exercise_id, exercises(id, name, muscle_group, equipment))"
    )
    .eq("id", id)
    .single();

  if (!workout) redirect("/dashboard");

  // Витягуємо унікальні вправи з join-результату
  const exerciseMap = new Map<
    string,
    {
      id: string;
      name: string;
      muscle_group: string | null;
      equipment: string | null;
    }
  >();
  const sets = (workout.sets ?? []).map((set) => {
    // Supabase повертає масив через Relationships, але для FK це завжди 1 елемент
    const exerciseArr = set.exercises as unknown as {
      id: string;
      name: string;
      muscle_group: string | null;
      equipment: string | null;
    } | null;
    if (exerciseArr && !exerciseMap.has(exerciseArr.id)) {
      exerciseMap.set(exerciseArr.id, exerciseArr);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { exercises: _, ...setData } = set;
    return setData;
  });

  return (
    <WorkoutDetail workout={{ ...workout, sets }} exercises={Array.from(exerciseMap.values())} />
  );
}
