import { supabase } from "@/src/lib/supabase/client";
import type { WorkoutExercise } from "@/src/lib/types";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 години

export function isWorkoutEditable(startedAt: string | null): boolean {
  if (!startedAt) return false;
  return Date.now() - new Date(startedAt).getTime() < EDIT_WINDOW_MS;
}

export async function updateWorkout(
  workoutId: string,
  workoutExercises: WorkoutExercise[],
  notes?: string | null
) {
  // Перевіряємо 24-год вікно на клієнті (на сервері — RLS-політика)
  const { data: workout } = await supabase
    .from("workouts")
    .select("started_at")
    .eq("id", workoutId)
    .single();

  if (!workout || !isWorkoutEditable(workout.started_at)) {
    throw new Error("Час редагування вичерпано (24 години)");
  }

  // Видаляємо старі сети
  await supabase.from("sets").delete().eq("workout_id", workoutId);

  // Вставляємо нові
  const setsToInsert = workoutExercises.flatMap((we) =>
    we.sets
      .filter((s) => s.completed)
      .map((set) => ({
        workout_id: workoutId,
        exercise_id: we.exercise.id,
        set_number: set.setNumber,
        reps: set.reps,
        weight: set.weight,
        rpe: set.rpe,
        duration_s: set.durationS,
      }))
  );

  if (setsToInsert.length > 0) {
    const { error } = await supabase.from("sets").insert(setsToInsert);
    if (error) throw error;
  }

  // Оновлюємо назву
  const workoutName = workoutExercises
    .map((we) => we.exercise.name)
    .slice(0, 3)
    .join(", ");

  const { error } = await supabase
    .from("workouts")
    .update({ name: workoutName, notes: notes ?? null })
    .eq("id", workoutId);

  if (error) throw error;
}

export async function deleteWorkout(workoutId: string) {
  // RLS захищає — видалити можна тільки свої
  await supabase.from("sets").delete().eq("workout_id", workoutId);
  await supabase.from("workouts").delete().eq("id", workoutId);
}

export async function deleteSetFromWorkout(setId: string) {
  await supabase.from("sets").delete().eq("id", setId);
}

export async function fetchWorkoutDetail(id: string) {
  const { data: workout } = await supabase
    .from("workouts")
    .select(
      "id, name, started_at, finished_at, notes, sets(id, set_number, weight, reps, rpe, duration_s, exercise_id, exercises(id, name, muscle_group, equipment))"
    )
    .eq("id", id)
    .single();

  if (!workout) return null;

  const exerciseMap = new Map<
    string,
    { id: string; name: string; muscle_group: string | null; equipment: string | null }
  >();

  const sets = (workout.sets ?? []).map((set) => {
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

  return {
    workout: { ...workout, sets },
    exercises: Array.from(exerciseMap.values()),
  };
}

export async function fetchPreviousSets() {
  const { data: lastSets } = await supabase
    .from("sets")
    .select("exercise_id, set_number, weight, reps, rpe, workouts!inner(started_at)")
    .order("created_at", { ascending: false })
    .limit(500);

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

    for (const key of Object.keys(previousSetsMap)) {
      previousSetsMap[key].sort((a, b) => a.setNumber - b.setNumber);
    }
  }

  return previousSetsMap;
}
