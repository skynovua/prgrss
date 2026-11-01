import type { ExerciseTrackingType } from "./types";

const STORAGE_KEY = "prgrss.exerciseLogPreferences";

function preferencesKey(userId: string) {
  return `${STORAGE_KEY}:${userId}`;
}

export function hasLegacyExerciseLogPreferences(userId: string | undefined) {
  if (!userId) return false;
  try {
    return !localStorage.getItem(preferencesKey(userId)) && !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

export function restoreLegacyExerciseLogPreferences(userId: string | undefined) {
  if (!userId) return false;
  try {
    const legacy = localStorage.getItem(STORAGE_KEY);
    if (!legacy || localStorage.getItem(preferencesKey(userId))) return false;
    const parsed = JSON.parse(legacy);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    localStorage.setItem(preferencesKey(userId), legacy);
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    // Старі налаштування залишаються на пристрої, якщо перенесення не вдалося.
    return false;
  }
}

export function clearExerciseLogPreferences(userId: string | undefined) {
  if (!userId) return;
  try {
    localStorage.removeItem(preferencesKey(userId));
  } catch {
    // Локальне сховище може бути недоступним.
  }
}

export interface ExerciseLogPreferences {
  trackingType?: ExerciseTrackingType;
  restSeconds?: number;
}

function readPreferences(userId: string | undefined): Record<string, ExerciseLogPreferences> {
  if (!userId) return {};
  try {
    const value = JSON.parse(localStorage.getItem(preferencesKey(userId)) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function getExerciseLogPreferences(
  userId: string | undefined,
  exerciseId: string
): ExerciseLogPreferences {
  const preferences = readPreferences(userId)[exerciseId];
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
  userId: string | undefined,
  exerciseId: string,
  preferences: ExerciseLogPreferences
) {
  if (!userId) return;
  try {
    const all = readPreferences(userId);
    localStorage.setItem(
      preferencesKey(userId),
      JSON.stringify({ ...all, [exerciseId]: preferences })
    );
  } catch {
    // Налаштування поточної чернетки працюють і без browser storage.
  }
}
