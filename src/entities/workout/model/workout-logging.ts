import type {
  ExerciseData,
  ExerciseTrackingType,
  LocalSet,
  PreviousSetData,
  WorkoutExercise,
} from "./types";

export const TRACKING_TYPES = [
  { value: "weight-reps", label: "Вага та повторення" },
  { value: "bodyweight", label: "Власна вага" },
  { value: "duration", label: "На час" },
] satisfies { value: ExerciseTrackingType; label: string }[];

// Тип вимірювання задається ключем каталогу, а не перекладеною назвою вправи.
const TIMED_EXERCISE_KEYS = new Set(["plank", "side-plank"]);

export function getExerciseTrackingType(
  exercise: Pick<ExerciseData, "equipment" | "catalog_key">,
  previousSets: Pick<PreviousSetData, "durationS">[] = []
): ExerciseTrackingType {
  if (
    TIMED_EXERCISE_KEYS.has(exercise.catalog_key ?? "") ||
    previousSets.some((set) => (set.durationS ?? 0) > 0)
  ) {
    return "duration";
  }
  return exercise.equipment === "bodyweight" ? "bodyweight" : "weight-reps";
}

export function createWorkoutSet(
  trackingType: ExerciseTrackingType,
  setNumber: number,
  previous?: Pick<LocalSet, "weight" | "reps" | "durationS">
): LocalSet {
  return {
    id: crypto.randomUUID(),
    setNumber,
    weight: trackingType === "duration" ? null : (previous?.weight ?? null),
    reps: trackingType === "duration" ? null : (previous?.reps ?? 8),
    durationS: trackingType === "duration" ? (previous?.durationS ?? null) : null,
    rpe: null,
    notes: null,
    completed: false,
  };
}

export type SetField = "weight" | "reps" | "durationS" | "rpe";
export type SetErrors = Partial<Record<SetField, string>>;

export function parseWorkoutNumber(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^-?\d+(?:\.\d*)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getSetErrors(set: LocalSet, trackingType: ExerciseTrackingType): SetErrors {
  const errors: SetErrors = {};
  if (trackingType === "duration") {
    if (
      set.durationS == null ||
      !Number.isInteger(set.durationS) ||
      set.durationS < 1 ||
      set.durationS > 86400
    ) {
      errors.durationS = "Укажи цілу кількість секунд від 1 до 86 400.";
    }
  } else {
    const minimumWeight = trackingType === "bodyweight" ? 0 : 0.01;
    if (
      (trackingType === "weight-reps" && set.weight == null) ||
      (set.weight != null &&
        (!Number.isFinite(set.weight) ||
          set.weight < minimumWeight ||
          set.weight > 9999.99 ||
          Math.abs(set.weight * 100 - Math.round(set.weight * 100)) > 0.000001))
    ) {
      errors.weight =
        trackingType === "bodyweight"
          ? "Додаткова вага: від 0 до 9 999,99 кг. Можна залишити порожньою."
          : "Укажи вагу від 0,01 до 9 999,99 кг, до двох знаків після коми.";
    }
    if (set.reps == null || !Number.isInteger(set.reps) || set.reps < 1 || set.reps > 999) {
      errors.reps = "Укажи цілу кількість повторень від 1 до 999.";
    }
  }
  if (
    set.rpe != null &&
    (!Number.isFinite(set.rpe) || set.rpe < 6 || set.rpe > 10 || !Number.isInteger(set.rpe * 2))
  ) {
    errors.rpe = "Зусилля RPE: від 6 до 10 із кроком 0,5. Поле необов’язкове.";
  }
  const inputFields =
    trackingType === "duration" ? (["durationS"] as const) : (["weight", "reps"] as const);
  for (const field of inputFields) {
    const rawValue = set.inputValues?.[field];
    if (rawValue?.trim() && parseWorkoutNumber(rawValue) == null) {
      errors[field] =
        field === "weight" ? "Введи вагу числом, наприклад 17,5." : "Укажи ціле число.";
    }
  }
  return errors;
}

export function isSetValid(set: LocalSet, trackingType: ExerciseTrackingType) {
  return Object.keys(getSetErrors(set, trackingType)).length === 0;
}

export function getWorkoutReview(exercises: WorkoutExercise[]) {
  let completedSets = 0;
  let unfinishedSets = 0;
  const invalidSets: { exerciseIndex: number; setId: string; label: string }[] = [];
  for (const [exerciseIndex, exercise] of exercises.entries()) {
    for (const set of exercise.sets) {
      if (!set.completed) {
        unfinishedSets += 1;
      } else {
        completedSets += 1;
        if (!isSetValid(set, exercise.trackingType)) {
          invalidSets.push({
            exerciseIndex,
            setId: set.id,
            label: `${exercise.exercise.name}, підхід ${set.setNumber}`,
          });
        }
      }
    }
  }
  return {
    completedSets,
    unfinishedSets,
    invalidSets,
    completedExercises: exercises.filter((we) => we.sets.some((set) => set.completed)).length,
  };
}

export function formatSetSummary(
  set: Pick<LocalSet, "weight" | "reps" | "durationS">,
  trackingType: ExerciseTrackingType
) {
  if (trackingType === "duration") {
    if (set.durationS == null || set.durationS < 1) return null;
    return `${set.durationS} с`;
  }
  if (set.reps == null) return null;
  const weight = set.weight == null ? null : new Intl.NumberFormat("uk-UA").format(set.weight);
  if (trackingType === "bodyweight" && !set.weight) return `${set.reps} повт.`;
  return weight == null ? `${set.reps} повт.` : `${weight} кг × ${set.reps}`;
}
