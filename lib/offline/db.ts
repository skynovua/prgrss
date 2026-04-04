import Dexie, { type EntityTable } from "dexie";

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

const db = new Dexie("WorkoutDB") as Dexie & {
  pendingWorkouts: EntityTable<PendingWorkout, "id">;
  pendingSets: EntityTable<PendingSet, "id">;
};

db.version(1).stores({
  pendingWorkouts: "++id, uuid, syncedAt",
  pendingSets: "++id, uuid, workoutUuid, syncedAt",
});

export type { PendingWorkout, PendingSet };
export { db };
