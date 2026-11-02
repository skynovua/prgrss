import type { ExerciseMuscleTarget } from "@/entities/exercise";
import type { WorkoutExercise } from "@/entities/workout";

export function programMuscles(
  exercises: WorkoutExercise[],
  catalog: Array<{ id: string; muscles: ExerciseMuscleTarget[] }>
) {
  const catalogById = new Map(catalog.map((exercise) => [exercise.id, exercise]));
  const targets = new Map<string, ExerciseMuscleTarget>();
  let hasUnmappedExercises = false;
  for (const exercise of exercises) {
    const muscles = catalogById.get(exercise.exercise.id)?.muscles ?? [];
    if (!muscles.length) hasUnmappedExercises = true;
    for (const muscle of muscles) {
      const previous = targets.get(muscle.muscleKey);
      if (!previous || previous.activationScore < muscle.activationScore) {
        targets.set(muscle.muscleKey, muscle);
      }
    }
  }
  return {
    muscles: Array.from(targets.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "uk")
    ),
    hasUnmappedExercises,
  };
}
