import { Database } from "@/lib/db/types";

export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type Workout = Database["public"]["Tables"]["workouts"]["Row"];
export type Set = Database["public"]["Tables"]["sets"]["Row"];
export type SetInsert = Database["public"]["Tables"]["sets"]["Insert"];
export type WorkoutInsert = Database["public"]["Tables"]["workouts"]["Insert"];

export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core";

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Груди",
  back: "Спина",
  legs: "Ноги",
  shoulders: "Плечі",
  arms: "Руки",
  core: "Кор",
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Штанга",
  dumbbell: "Гантелі",
  machine: "Тренажер",
  bodyweight: "Власна вага",
  cable: "Блок",
};

export interface WorkoutExercise {
  exercise: Exercise;
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
