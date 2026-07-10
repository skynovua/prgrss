import { Database } from "@/shared/db";
export { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from "@/shared/config";
export type { MuscleGroup } from "@/shared/config";

export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type Workout = Database["public"]["Tables"]["workouts"]["Row"];
export type Set = Database["public"]["Tables"]["sets"]["Row"];
export type SetInsert = Database["public"]["Tables"]["sets"]["Insert"];
export type WorkoutInsert = Database["public"]["Tables"]["workouts"]["Insert"];
export type BodyMeasurement = Database["public"]["Tables"]["body_measurements"]["Row"];

// Складені типи для компонентів
export type SetData = Pick<
  Set,
  "id" | "set_number" | "weight" | "reps" | "rpe" | "duration_s" | "exercise_id"
>;
export type ExerciseData = Pick<Exercise, "id" | "name" | "muscle_group" | "equipment">;
export type WorkoutWithSets = Pick<
  Workout,
  "id" | "name" | "started_at" | "finished_at" | "notes"
> & {
  sets: SetData[];
};

export interface WorkoutExercise {
  exercise: ExerciseData;
  sets: LocalSet[];
}

export interface LocalSet {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  durationS: number | null;
  completed: boolean;
}

export interface PreviousSetData {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
}

export type PreviousSetsMap = Record<string, PreviousSetData[]>;
