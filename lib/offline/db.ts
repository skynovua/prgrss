import Dexie, { type EntityTable } from "dexie";
import type { WorkoutExercise } from "@/lib/types";

interface PendingWorkout {
  id?: number;
  uuid: string;
  name: string | null;
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
  programId: string | null;
  syncedAt: string | null;
}

interface PendingSet {
  id?: number;
  uuid: string;
  workoutUuid: string;
  exerciseId: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  durationS: number | null;
  notes: string | null;
  syncedAt: string | null;
}

interface ActiveWorkout {
  id: 1; // завжди один запис
  exercises: WorkoutExercise[];
  startedAt: string;
  updatedAt: string;
}

const db = new Dexie("WorkoutDB") as Dexie & {
  pendingWorkouts: EntityTable<PendingWorkout, "id">;
  pendingSets: EntityTable<PendingSet, "id">;
  activeWorkout: EntityTable<ActiveWorkout, "id">;
};

db.version(2).stores({
  pendingWorkouts: "++id, uuid, syncedAt",
  pendingSets: "++id, uuid, workoutUuid, syncedAt",
  activeWorkout: "id",
});

export type { PendingWorkout, PendingSet, ActiveWorkout };
export { db };
