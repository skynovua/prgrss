import type { ExerciseMuscleTarget } from "./exercise-catalog";

const TRICEPS_HEAD_KEYS = new Set(["triceps_long_head", "triceps_lateral_head"]);

export function isTricepsHead(key: string) {
  return TRICEPS_HEAD_KEYS.has(key);
}

// Старі розмітки можуть містити окремі головки. У показі об’єднуємо їх,
// зберігаючи найбільшу оцінку та не змінюючи записи користувача в базі.
export function combineTricepsTargets(muscles: ExerciseMuscleTarget[]) {
  const result = new Map<string, ExerciseMuscleTarget>();
  for (const muscle of muscles) {
    const target = isTricepsHead(muscle.muscleKey)
      ? { ...muscle, muscleKey: "triceps_brachii", name: "Трицепси", sortOrder: 4 }
      : muscle;
    const previous = result.get(target.muscleKey);
    if (!previous || target.activationScore > previous.activationScore) {
      result.set(target.muscleKey, target);
    }
  }
  return [...result.values()];
}
