import { createClient } from "@/shared/api";
import { buildSaveWorkoutPayload, toWorkoutOperationError } from "@/entities/workout";
import type { WorkoutExercise } from "@/entities/workout";
import { generateId } from "./reducer";

interface FinishResult {
  success: boolean;
  redirectTo: string;
}

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

  return { success: true, redirectTo: "/dashboard" };
}
