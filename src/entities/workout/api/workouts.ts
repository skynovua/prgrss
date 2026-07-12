import type { WorkoutExercise } from "@/entities/workout";
import { buildSaveWorkoutPayload, toWorkoutOperationError } from "@/entities/workout";
import { supabase } from "@/shared/api";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 години

type ExerciseSummary = {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readExerciseSummary(value: unknown): ExerciseSummary | null {
  if (!isRecord(value)) return null;

  return {
    id: typeof value.id === "string" ? value.id : "",
    name: typeof value.name === "string" ? value.name : "",
    muscle_group: typeof value.muscle_group === "string" ? value.muscle_group : null,
    equipment: typeof value.equipment === "string" ? value.equipment : null,
  };
}

function readStartedAt(value: unknown): string | null {
  if (Array.isArray(value)) {
    return readStartedAt(value[0]);
  }

  if (!isRecord(value)) return null;
  return typeof value.started_at === "string" ? value.started_at : null;
}

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
    .select("started_at, finished_at, program_id")
    .eq("id", workoutId)
    .single();

  if (!workout || !isWorkoutEditable(workout.started_at)) {
    throw new Error("Час редагування вичерпано (24 години)");
  }

  if (!workout.started_at) {
    throw new Error("У тренування відсутній час початку");
  }

  const payload = buildSaveWorkoutPayload({
    workoutId,
    workoutExercises,
    startedAt: workout.started_at,
    finishedAt: workout.finished_at ?? workout.started_at,
    notes,
    programId: workout.program_id,
    enforceEditWindow: true,
  });

  const { error } = await supabase.rpc("save_workout_with_sets", { payload }).single();

  if (error) throw toWorkoutOperationError(error, "update");
}

export async function deleteWorkout(workoutId: string) {
  const { error } = await supabase.rpc("delete_workout_cascade", {
    target_workout_id: workoutId,
  });

  if (error) throw toWorkoutOperationError(error, "delete");
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
    const exercise = readExerciseSummary(set.exercises);
    if (exercise?.id && !exerciseMap.has(exercise.id)) {
      exerciseMap.set(exercise.id, exercise);
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
      const startedAt = readStartedAt(s.workouts);
      if (!startedAt) continue;
      const current = exerciseLatestDate.get(s.exercise_id);
      if (!current || startedAt > current) {
        exerciseLatestDate.set(s.exercise_id, startedAt);
      }
    }

    for (const s of lastSets) {
      const startedAt = readStartedAt(s.workouts);
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
