import type { Exercise, ExerciseData, WorkoutExercise, WorkoutWithSets } from "@/entities/workout";
import { createWorkoutSet, getExerciseTrackingType } from "@/entities/workout";

export function exerciseForProgram(exercise: Exercise): WorkoutExercise {
  const trackingType = getExerciseTrackingType(exercise);
  return {
    instanceId: crypto.randomUUID(),
    exercise: {
      id: exercise.id,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      equipment: exercise.equipment,
      catalog_key: exercise.catalog_key,
    },
    trackingType,
    restSeconds: 90,
    sets: [createWorkoutSet(trackingType, 1)],
  };
}

export function programFromWorkout(workout: WorkoutWithSets, exercises: ExerciseData[]) {
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const grouped = new Map<string, typeof workout.sets>();
  for (const set of workout.sets) {
    grouped.set(set.exercise_id, [...(grouped.get(set.exercise_id) ?? []), set]);
  }
  return Array.from(grouped, ([exerciseId, sets]) => {
    const exercise = exerciseMap.get(exerciseId) ?? {
      id: exerciseId,
      name: "Невідома вправа",
      muscle_group: null,
      equipment: null,
    };
    const trackingType = getExerciseTrackingType(
      exercise,
      sets.map((set) => ({ durationS: set.duration_s }))
    );
    return {
      instanceId: crypto.randomUUID(),
      exercise,
      trackingType,
      restSeconds: 90,
      sets: sets.map((set, index) =>
        createWorkoutSet(trackingType, index + 1, {
          weight: set.weight,
          reps: set.reps,
          durationS: set.duration_s,
        })
      ),
    };
  });
}

export function programWorkoutDraft(exercises: WorkoutExercise[]) {
  return exercises.map((entry) => ({
    ...entry,
    instanceId: crypto.randomUUID(),
    sets: entry.sets.map((set, index) => ({
      ...set,
      id: crypto.randomUUID(),
      setNumber: index + 1,
      completed: false,
      rpe: null,
      notes: null,
      inputValues: undefined,
    })),
  }));
}

export function readProgramExercises(value: unknown): WorkoutExercise[] {
  if (!Array.isArray(value)) throw new Error("Не вдалося прочитати програму");
  if (
    !value.every(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        entry.exercise &&
        typeof entry.exercise.id === "string" &&
        typeof entry.exercise.name === "string" &&
        ["weight-reps", "bodyweight", "duration"].includes(entry.trackingType) &&
        Array.isArray(entry.sets) &&
        entry.sets.length > 0 &&
        entry.sets.every((set: unknown) => set && typeof set === "object")
    )
  )
    throw new Error("Не вдалося прочитати програму");
  return value as WorkoutExercise[];
}

function programPlan(exercises: WorkoutExercise[]) {
  return exercises.map(({ exercise, trackingType, restSeconds, sets }) => ({
    exerciseId: exercise.id,
    trackingType,
    restSeconds,
    sets: sets.map((set) => ({
      weight: trackingType === "duration" ? null : (set.weight ?? null),
      reps: trackingType === "duration" ? null : (set.reps ?? null),
      durationS: trackingType === "duration" ? (set.durationS ?? null) : null,
    })),
  }));
}

export function hasProgramChanges(template: unknown, exercises: WorkoutExercise[]) {
  try {
    return (
      JSON.stringify(programPlan(readProgramExercises(template))) !==
      JSON.stringify(programPlan(exercises))
    );
  } catch {
    return false;
  }
}

export function templateFromWorkout(exercises: WorkoutExercise[]) {
  return exercises.map((entry) => ({
    ...entry,
    sets: entry.sets.map((set, index) => ({
      ...set,
      setNumber: index + 1,
      completed: false,
      rpe: null,
      notes: null,
      inputValues: undefined,
    })),
  }));
}
