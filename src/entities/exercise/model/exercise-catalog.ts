import type { Database } from "@/shared/db";

export type AnatomicalMuscle = Database["public"]["Tables"]["anatomical_muscles"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

export interface ExerciseMuscleTarget {
  muscleKey: string;
  name: string;
  muscleGroup: string;
  sortOrder: number;
  activationScore: number;
}

export interface ExerciseCatalogItem extends Exercise {
  muscles: ExerciseMuscleTarget[];
}

export interface ExerciseMuscleInput {
  muscleKey: string;
  activationScore: number;
}

export interface CreateExerciseInput {
  name: string;
  equipment: string;
  muscles: ExerciseMuscleInput[];
}
