import { createClient } from "@/shared/api";
import { buildSaveWorkoutPayload, toWorkoutOperationError } from "@/entities/workout";
import type { WorkoutExercise } from "@/entities/workout";
import { generateId } from "./reducer";

const ACTIVE_WORKOUT_STORAGE_KEY = "prgrss.activeWorkout";
const ACTIVE_WORKOUT_DRAFT_EVENT = "prgrss-active-workout-draft";

export interface ActiveWorkoutDraft {
  exercises: WorkoutExercise[];
  startedAt: string;
  updatedAt: string;
}

interface FinishResult {
  success: boolean;
  redirectTo: string;
}

export function saveActiveWorkoutDraft({
  exercises,
  startedAt,
}: {
  exercises: WorkoutExercise[];
  startedAt: string;
}) {
  try {
    const draft: ActiveWorkoutDraft = {
      exercises,
      startedAt,
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
      exercises: draft.exercises,
      startedAt: draft.startedAt,
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
  startedAt: string
): Promise<FinishResult> {
  const supabase = createClient();
  const finishedAt = new Date().toISOString();
  const workoutId = generateId();

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
  });

  const { error } = await supabase.rpc("save_workout_with_sets", { payload }).single();

  if (error) {
    throw toWorkoutOperationError(error, "save");
  }

  clearActiveWorkoutDraft();

  return { success: true, redirectTo: "/dashboard" };
}
