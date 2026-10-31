import type { ExerciseTrackingType } from "./types";

const STORAGE_KEY = "prgrss.exerciseLogPreferences";

export function clearExerciseLogPreferences() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Локальне сховище може бути недоступним.
  }
}

export interface ExerciseLogPreferences {
  trackingType?: ExerciseTrackingType;
  restSeconds?: number;
}

function readPreferences(): Record<string, ExerciseLogPreferences> {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function getExerciseLogPreferences(exerciseId: string): ExerciseLogPreferences {
  const preferences = readPreferences()[exerciseId];
  return {
    trackingType: ["duration", "bodyweight", "weight-reps"].includes(
      preferences?.trackingType ?? ""
    )
      ? preferences.trackingType
      : undefined,
    restSeconds:
      preferences?.restSeconds != null &&
      Number.isInteger(preferences.restSeconds) &&
      preferences.restSeconds >= 0 &&
      preferences.restSeconds <= 600
        ? preferences.restSeconds
        : undefined,
  };
}

export function saveExerciseLogPreferences(
  exerciseId: string,
  preferences: ExerciseLogPreferences
) {
  try {
    const all = readPreferences();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, [exerciseId]: preferences }));
  } catch {
    // Налаштування поточної чернетки працюють і без browser storage.
  }
}
