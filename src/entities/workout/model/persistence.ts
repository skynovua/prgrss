import type { WorkoutExercise } from "@/entities/workout";
import { buildSaveWorkoutPayload, toWorkoutOperationError } from "@/entities/workout";
import { createClient } from "@/shared/api";

import { generateId } from "./reducer";
import type { RestClock } from "./rest-clock";
import { getExerciseTrackingType } from "./workout-logging";

const ACTIVE_WORKOUT_STORAGE_KEY = "prgrss.activeWorkout";
const ACTIVE_WORKOUT_DRAFT_EVENT = "prgrss-active-workout-draft";

export interface ActiveWorkoutDraft {
  workoutId: string;
  exercises: WorkoutExercise[];
  startedAt: string;
  restClock: RestClock | null;
  name: string;
  notes: string;
  updatedAt: string;
}

interface FinishResult {
  success: boolean;
  redirectTo: string;
}

export function saveActiveWorkoutDraft({
  exercises,
  startedAt,
  workoutId,
  restClock,
  name,
  notes,
}: {
  workoutId: string;
  exercises: WorkoutExercise[];
  startedAt: string;
  restClock: RestClock | null;
  name: string;
  notes: string;
}) {
  try {
    const draft: ActiveWorkoutDraft = {
      exercises,
      startedAt,
      workoutId,
      restClock,
      name,
      notes,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, JSON.stringify(draft));
    window.dispatchEvent(new Event(ACTIVE_WORKOUT_DRAFT_EVENT));
  } catch {
    // Чернетка не блокує збереження тренування через Supabase.
  }
}

export function restoreActiveWorkoutDraft(): ActiveWorkoutDraft | null {
  try {
    const rawDraft = localStorage.getItem(ACTIVE_WORKOUT_STORAGE_KEY);
    if (!rawDraft) return null;

    const draft = JSON.parse(rawDraft) as Partial<ActiveWorkoutDraft>;
    if (!Array.isArray(draft.exercises) || typeof draft.startedAt !== "string") {
      return null;
    }

    return {
      workoutId: typeof draft.workoutId === "string" ? draft.workoutId : generateId(),
      exercises: draft.exercises.map((exercise) => ({
        ...exercise,
        instanceId: exercise.instanceId ?? generateId(),
        trackingType:
          exercise.trackingType ?? getExerciseTrackingType(exercise.exercise, exercise.sets),
        restSeconds: exercise.restSeconds ?? 90,
      })),
      startedAt: draft.startedAt,
      restClock: draft.restClock ?? null,
      name: typeof draft.name === "string" ? draft.name : "",
      notes: typeof draft.notes === "string" ? draft.notes : "",
      updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : draft.startedAt,
    };
  } catch {
    return null;
  }
}

export function clearActiveWorkoutDraft() {
  try {
    localStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
    window.dispatchEvent(new Event(ACTIVE_WORKOUT_DRAFT_EVENT));
  } catch {
    // Немає що чистити, якщо browser storage недоступний.
  }
}

export { ACTIVE_WORKOUT_DRAFT_EVENT };

export async function finishWorkout(
  workoutExercises: WorkoutExercise[],
  startedAt: string,
  workoutId: string,
  details?: { name?: string; notes?: string }
): Promise<FinishResult> {
  const supabase = createClient();
  const finishedAt = new Date().toISOString();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw toWorkoutOperationError(new Error("Не авторизовано"), "save");
  }

  const payload = buildSaveWorkoutPayload({
    workoutId,
    workoutExercises,
    startedAt,
    finishedAt,
    name: details?.name,
    notes: details?.notes?.trim() || null,
  });

  const { error } = await supabase.rpc("save_workout_with_sets", { payload }).single();

  if (error) {
    throw toWorkoutOperationError(error, "save");
  }

  clearActiveWorkoutDraft();

  return { success: true, redirectTo: `/workout/${workoutId}` };
}
