import { db } from "@/src/lib/offline/db";
import { createClient } from "@/src/lib/supabase/client";
import {
  buildSaveWorkoutPayload,
  buildWorkoutName,
  toWorkoutOperationError,
  WorkoutOperationError,
} from "@/src/lib/api/workout-rpc";
import type { WorkoutExercise } from "@/src/lib/types";
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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    // Офлайн і немає сесії — зберігаємо локально
    await db.pendingWorkouts.add({
      uuid: workoutId,
      name: buildWorkoutName(workoutExercises),
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

  const workoutName = buildWorkoutName(workoutExercises);

  try {
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

    await clearActiveWorkout();
    return { success: true, offline: false, redirectTo: "/dashboard" };
  } catch (error) {
    const mappedError = toWorkoutOperationError(error, "save");

    if (!(mappedError instanceof WorkoutOperationError) || mappedError.kind !== "network") {
      throw mappedError;
    }

    if (!session?.user) {
      throw mappedError;
    }

    if (mappedError.kind !== "network") {
      throw error;
    }

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
}
