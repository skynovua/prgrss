import { db } from "@/lib/offline/db";
import { createClient } from "@/lib/supabase/client";
import type { WorkoutExercise } from "@/lib/types";
import type { WorkoutState } from "./reducer";
import { generateId } from "./reducer";

export function saveActiveWorkout(state: WorkoutState) {
  db.activeWorkout.put({
    id: 1,
    exercises: state.exercises,
    startedAt: state.startedAt,
    updatedAt: new Date().toISOString(),
  });
}

export async function clearActiveWorkout() {
  await db.activeWorkout.delete(1);
}

export async function restoreActiveWorkout() {
  return db.activeWorkout.get(1);
}

interface FinishResult {
  success: boolean;
  offline?: boolean;
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
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, redirectTo: "/login" };
  }

  const workoutName = workoutExercises
    .map((we) => we.exercise.name)
    .slice(0, 3)
    .join(", ");

  const { error: workoutError } = await supabase.from("workouts").insert({
    id: workoutId,
    user_id: user.id,
    started_at: startedAt,
    finished_at: finishedAt,
    name: workoutName,
  });

  if (workoutError) {
    // Offline — зберігаємо в Dexie
    await db.pendingWorkouts.add({
      uuid: workoutId,
      name: workoutName,
      startedAt,
      finishedAt,
      notes: null,
      programId: null,
      syncedAt: null,
    });

    for (const we of workoutExercises) {
      for (const set of we.sets.filter((s) => s.completed)) {
        await db.pendingSets.add({
          uuid: generateId(),
          workoutUuid: workoutId,
          exerciseId: we.exercise.id,
          setNumber: set.setNumber,
          reps: set.reps,
          weight: set.weight,
          rpe: set.rpe,
          durationS: set.durationS,
          notes: null,
          syncedAt: null,
        });
      }
    }

    await clearActiveWorkout();
    return { success: true, offline: true, redirectTo: "/dashboard" };
  }

  // Online — зберігаємо сети
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
    await supabase.from("sets").insert(setsToInsert);
  }

  await clearActiveWorkout();
  return { success: true, offline: false, redirectTo: "/dashboard" };
}
