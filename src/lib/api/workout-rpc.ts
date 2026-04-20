import type { WorkoutExercise } from "@/src/lib/types";
import type { Json } from "@/src/lib/db/types";

interface SaveWorkoutPayloadOptions {
  workoutId?: string;
  workoutExercises: WorkoutExercise[];
  startedAt: string;
  finishedAt: string;
  notes?: string | null;
  programId?: string | null;
  enforceEditWindow?: boolean;
}

export function buildWorkoutName(workoutExercises: WorkoutExercise[]) {
  return workoutExercises
    .map((we) => we.exercise.name)
    .slice(0, 3)
    .join(", ");
}

export function buildWorkoutSetsPayload(workoutExercises: WorkoutExercise[]) {
  return workoutExercises.flatMap((we) =>
    we.sets
      .filter((set) => set.completed)
      .map((set) => ({
        exercise_id: we.exercise.id,
        set_number: set.setNumber,
        reps: set.reps,
        weight: set.weight,
        rpe: set.rpe,
        duration_s: set.durationS,
        notes: null,
      }))
  );
}

export function buildSaveWorkoutPayload({
  workoutId,
  workoutExercises,
  startedAt,
  finishedAt,
  notes = null,
  programId = null,
  enforceEditWindow = false,
}: SaveWorkoutPayloadOptions): Json {
  return {
    workout_id: workoutId ?? null,
    started_at: startedAt,
    finished_at: finishedAt,
    name: buildWorkoutName(workoutExercises),
    notes,
    program_id: programId,
    enforce_edit_window: enforceEditWindow,
    sets: buildWorkoutSetsPayload(workoutExercises),
  };
}

export function isLikelyNetworkError(error: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /failed to fetch|networkerror|network request failed/i.test(error.message);
}
