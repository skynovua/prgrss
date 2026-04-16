import { db } from "@/src/lib/offline/db";
import { supabase } from "@/src/lib/supabase/client";

export async function syncPendingWorkouts() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return;
  const user = session.user;

  // Синхронізуємо тренування
  const pendingWorkouts = await db.pendingWorkouts.filter((w) => !w.syncedAt).toArray();

  for (const workout of pendingWorkouts) {
    const { error } = await supabase.from("workouts").insert({
      id: workout.uuid,
      user_id: user.id,
      started_at: workout.startedAt,
      finished_at: workout.finishedAt,
      name: workout.name,
      notes: workout.notes,
      program_id: workout.programId,
    });

    if (!error) {
      // Синхронізуємо сети цього тренування
      const pendingSets = await db.pendingSets
        .where("workoutUuid")
        .equals(workout.uuid)
        .filter((s) => !s.syncedAt)
        .toArray();

      const setsToInsert = pendingSets.map((s) => ({
        workout_id: workout.uuid,
        exercise_id: s.exerciseId,
        set_number: s.setNumber,
        reps: s.reps,
        weight: s.weight,
        rpe: s.rpe,
        duration_s: s.durationS,
      }));

      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase.from("sets").insert(setsToInsert);

        if (!setsError) {
          // Позначаємо сети як синхронізовані
          const now = new Date().toISOString();
          await Promise.all(
            pendingSets.map((s) => db.pendingSets.update(s.id!, { syncedAt: now }))
          );
        }
      }

      // Позначаємо тренування як синхронізоване
      await db.pendingWorkouts.update(workout.id!, {
        syncedAt: new Date().toISOString(),
      });
    }
  }
}
