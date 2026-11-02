import type { WorkoutExercise } from "@/entities/workout";
import { buildSaveWorkoutPayload, toWorkoutOperationError } from "@/entities/workout";
import { createClient, withQueryTimeout } from "@/shared/api";

import { clearActiveWorkoutDraft } from "./workout-draft";

interface FinishResult {
  success: boolean;
  redirectTo: string;
  programLinked: boolean;
}

export async function finishWorkout(
  userId: string | undefined,
  workoutExercises: WorkoutExercise[],
  startedAt: string,
  workoutId: string,
  details?: { name?: string; notes?: string },
  programId?: string
): Promise<FinishResult> {
  const supabase = createClient();
  const finishedAt = new Date().toISOString();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!userId || session?.user.id !== userId) {
    throw toWorkoutOperationError(new Error("Не авторизовано"), "save");
  }

  let linkedProgramId: string | null = null;
  if (programId) {
    try {
      const { data, error } = await withQueryTimeout(() =>
        supabase
          .from("programs")
          .select("id")
          .eq("id", programId)
          .eq("user_id", userId)
          .maybeSingle()
      );
      if (!error) linkedProgramId = data?.id ?? null;
    } catch {
      // Тренування можна зберегти, навіть якщо шаблон недоступний.
    }
  }

  const save = (sourceId: string | null) =>
    supabase
      .rpc("save_workout_with_sets", {
        payload: buildSaveWorkoutPayload({
          workoutId,
          workoutExercises,
          startedAt,
          finishedAt,
          name: details?.name,
          notes: details?.notes?.trim() || null,
          programId: sourceId,
        }),
      })
      .single();

  let { error } = await save(linkedProgramId);
  if (
    linkedProgramId &&
    error?.code === "23503" &&
    error.message.includes("workouts_program_id_fkey")
  ) {
    linkedProgramId = null;
    ({ error } = await save(null));
  }

  if (error) {
    throw toWorkoutOperationError(error, "save");
  }

  clearActiveWorkoutDraft(userId);

  return {
    success: true,
    redirectTo: `/workout/${workoutId}`,
    programLinked: Boolean(linkedProgramId),
  };
}
