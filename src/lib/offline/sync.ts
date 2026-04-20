import { db } from "@/src/lib/offline/db";
import { supabase } from "@/src/lib/supabase/client";
import { toWorkoutOperationError } from "@/src/lib/api/workout-rpc";

export async function syncPendingWorkouts() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return;

  // Синхронізуємо тренування
  const pendingWorkouts = await db.pendingWorkouts.filter((w) => !w.syncedAt).toArray();

  for (const workout of pendingWorkouts) {
    const pendingSets = await db.pendingSets
      .where("workoutUuid")
      .equals(workout.uuid)
      .filter((s) => !s.syncedAt)
      .toArray();

    const payload = {
      workout_id: workout.uuid,
      started_at: workout.startedAt,
      finished_at: workout.finishedAt,
      name: workout.name,
      notes: workout.notes,
      program_id: workout.programId,
      enforce_edit_window: false,
      sets: pendingSets.map((set) => ({
        exercise_id: set.exerciseId,
        set_number: set.setNumber,
        reps: set.reps,
        weight: set.weight,
        rpe: set.rpe,
        duration_s: set.durationS,
        notes: set.notes,
      })),
    };

    try {
      const { error } = await supabase.rpc("save_workout_with_sets", { payload }).single();

      if (error) {
        throw toWorkoutOperationError(error, "sync");
      }

      const now = new Date().toISOString();
      await Promise.all([
        db.pendingWorkouts.update(workout.id!, { syncedAt: now }),
        ...pendingSets.map((set) => db.pendingSets.update(set.id!, { syncedAt: now })),
      ]);
    } catch (error) {
      const mappedError = toWorkoutOperationError(error, "sync");

      if (mappedError.kind === "network") {
        continue;
      }

      console.error("Workout sync failed", {
        workoutId: workout.uuid,
        kind: mappedError.kind,
        message: mappedError.message,
      });
    }
  }
}
