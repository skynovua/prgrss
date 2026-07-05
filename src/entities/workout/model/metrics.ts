import type { Exercise, LocalSet, SetData, WorkoutExercise } from "@/entities/workout";

type ExerciseWithEquipment = Pick<Exercise, "equipment"> | null | undefined;
type WeightedSet = Pick<LocalSet, "weight" | "reps"> | Pick<SetData, "weight" | "reps">;

export function usesDoubleWeight(exercise: ExerciseWithEquipment): boolean {
  return exercise?.equipment === "dumbbell";
}

export function getWeightPlaceholder(previousWeight?: number | null): string {
  return previousWeight != null ? `${previousWeight}` : "кг";
}

export function getSetVolume(set: WeightedSet, exercise: ExerciseWithEquipment): number {
  const weight = set.weight ?? 0;
  const reps = set.reps ?? 0;
  const multiplier = usesDoubleWeight(exercise) ? 2 : 1;

  return weight * reps * multiplier;
}

export function getWorkoutVolume(workoutExercises: WorkoutExercise[]): number {
  return workoutExercises.reduce(
    (total, workoutExercise) =>
      total +
      workoutExercise.sets
        .filter((set) => set.completed)
        .reduce(
          (exerciseTotal, set) => exerciseTotal + getSetVolume(set, workoutExercise.exercise),
          0
        ),
    0
  );
}
