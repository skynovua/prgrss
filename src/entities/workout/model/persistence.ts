import type { WorkoutExercise } from "@/entities/workout";
import { buildSaveWorkoutPayload, toWorkoutOperationError } from "@/entities/workout";
import { createClient } from "@/shared/api";

import { clearActiveWorkoutDraft } from "./workout-draft";

interface FinishResult {
  success: boolean;
  redirectTo: string;
}

export async function finishWorkout(
  userId: string | undefined,
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

  if (!userId || session?.user.id !== userId) {
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

  clearActiveWorkoutDraft(userId);

  return { success: true, redirectTo: `/workout/${workoutId}` };
}
