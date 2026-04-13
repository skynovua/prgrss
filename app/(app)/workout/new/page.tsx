import { createClient } from "@/lib/supabase/server";
import { WorkoutLogger } from "@/components/workout/workout-logger";

export default async function NewWorkoutPage() {
  const supabase = await createClient();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("muscle_group")
    .order("name");

  // Отримуємо останні підходи для кожної вправи (auto-fill)
  const { data: lastSets } = await supabase
    .from("sets")
    .select("exercise_id, set_number, weight, reps, rpe, workouts!inner(started_at)")
    .order("created_at", { ascending: false })
    .limit(500);

  // Групуємо по вправі — беремо лише найновіше тренування для кожної
  const previousSetsMap: Record<
    string,
    { setNumber: number; weight: number | null; reps: number | null; rpe: number | null }[]
  > = {};

  if (lastSets) {
    const exerciseLatestDate = new Map<string, string>();
    for (const s of lastSets) {
      const workouts = s.workouts as unknown as { started_at: string } | { started_at: string }[];
      const startedAt = Array.isArray(workouts) ? workouts[0]?.started_at : workouts?.started_at;
      if (!startedAt) continue;
      const current = exerciseLatestDate.get(s.exercise_id);
      if (!current || startedAt > current) {
        exerciseLatestDate.set(s.exercise_id, startedAt);
      }
    }

    for (const s of lastSets) {
      const workouts = s.workouts as unknown as { started_at: string } | { started_at: string }[];
      const startedAt = Array.isArray(workouts) ? workouts[0]?.started_at : workouts?.started_at;
      if (startedAt !== exerciseLatestDate.get(s.exercise_id)) continue;

      if (!previousSetsMap[s.exercise_id]) {
        previousSetsMap[s.exercise_id] = [];
      }
      previousSetsMap[s.exercise_id].push({
        setNumber: s.set_number,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
      });
    }

    // Сортуємо по номеру підходу
    for (const key of Object.keys(previousSetsMap)) {
      previousSetsMap[key].sort((a, b) => a.setNumber - b.setNumber);
    }
  }

  return <WorkoutLogger exercises={exercises ?? []} previousSets={previousSetsMap} />;
}
