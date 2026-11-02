import type { ExerciseTrackingType, WorkoutExercise } from "@/entities/workout";

export function moveProgramExercise(exercises: WorkoutExercise[], from: number, to: number) {
  if (from < 0 || from >= exercises.length || to < 0 || to >= exercises.length || from === to) {
    return exercises;
  }
  const reordered = [...exercises];
  const [exercise] = reordered.splice(from, 1);
  reordered.splice(to, 0, exercise);
  return reordered;
}

export function updateProgramExerciseOptions(
  exercise: WorkoutExercise,
  trackingType: ExerciseTrackingType,
  restSeconds: number
): WorkoutExercise {
  // Зберігаємо приховані значення, якщо користувач повернеться до попереднього формату.
  return { ...exercise, trackingType, restSeconds };
}
