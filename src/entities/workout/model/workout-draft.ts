import { generateId } from "./reducer";
import type { RestClock } from "./rest-clock";
import type { WorkoutExercise, WorkoutProgramSource } from "./types";
import { getExerciseTrackingType } from "./workout-logging";

const ACTIVE_WORKOUT_STORAGE_KEY = "prgrss.activeWorkout";
const ACTIVE_WORKOUT_DRAFT_EVENT = "prgrss-active-workout-draft";

function draftKey(userId: string) {
  return `${ACTIVE_WORKOUT_STORAGE_KEY}:${userId}`;
}

function canRestoreLegacyDraft(userId: string) {
  const current = localStorage.getItem(draftKey(userId));
  if (!current) return true;
  try {
    const draft = JSON.parse(current);
    return (
      Array.isArray(draft.exercises) &&
      draft.exercises.length === 0 &&
      !draft.name &&
      !draft.notes &&
      !draft.programSource
    );
  } catch {
    return false;
  }
}

export function hasLegacyWorkoutDraft(userId: string | undefined) {
  if (!userId) return false;
  try {
    return canRestoreLegacyDraft(userId) && !!localStorage.getItem(ACTIVE_WORKOUT_STORAGE_KEY);
  } catch {
    return false;
  }
}

export function restoreLegacyWorkoutDraft(userId: string | undefined) {
  if (!userId) return false;
  try {
    const legacy = localStorage.getItem(ACTIVE_WORKOUT_STORAGE_KEY);
    if (!legacy || !canRestoreLegacyDraft(userId)) return false;
    const parsed = JSON.parse(legacy);
    if (!Array.isArray(parsed?.exercises) || typeof parsed.startedAt !== "string") return false;
    localStorage.setItem(draftKey(userId), legacy);
    localStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
    window.dispatchEvent(new Event(ACTIVE_WORKOUT_DRAFT_EVENT));
    return true;
  } catch {
    return false;
  }
}

export interface ActiveWorkoutDraft {
  workoutId: string;
  exercises: WorkoutExercise[];
  startedAt: string;
  restClock: RestClock | null;
  name: string;
  notes: string;
  programSource: WorkoutProgramSource | null;
  updatedAt: string;
}

export function saveActiveWorkoutDraft({
  userId,
  exercises,
  startedAt,
  workoutId,
  restClock,
  name,
  notes,
  programSource = null,
}: {
  userId: string | undefined;
  workoutId: string;
  exercises: WorkoutExercise[];
  startedAt: string;
  restClock: RestClock | null;
  name: string;
  notes: string;
  programSource?: WorkoutProgramSource | null;
}) {
  if (!userId) return;
  try {
    const draft: ActiveWorkoutDraft = {
      exercises,
      startedAt,
      workoutId,
      restClock,
      name,
      notes,
      programSource,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(draftKey(userId), JSON.stringify(draft));
    window.dispatchEvent(new Event(ACTIVE_WORKOUT_DRAFT_EVENT));
  } catch {
    // Чернетка не блокує збереження тренування через Supabase.
  }
}

export function restoreActiveWorkoutDraft(userId: string | undefined): ActiveWorkoutDraft | null {
  if (!userId) return null;
  try {
    const rawDraft = localStorage.getItem(draftKey(userId));
    if (!rawDraft) return null;

    const draft = JSON.parse(rawDraft) as Partial<ActiveWorkoutDraft>;
    if (!Array.isArray(draft.exercises) || typeof draft.startedAt !== "string") {
      return null;
    }

    return {
      workoutId: typeof draft.workoutId === "string" ? draft.workoutId : generateId(),
      exercises: draft.exercises.map((exercise) => ({
        ...exercise,
        instanceId: exercise.instanceId ?? generateId(),
        trackingType:
          exercise.trackingType ?? getExerciseTrackingType(exercise.exercise, exercise.sets),
        restSeconds: exercise.restSeconds ?? 90,
      })),
      startedAt: draft.startedAt,
      restClock: draft.restClock ?? null,
      name: typeof draft.name === "string" ? draft.name : "",
      notes: typeof draft.notes === "string" ? draft.notes : "",
      programSource:
        draft.programSource &&
        typeof draft.programSource.id === "string" &&
        typeof draft.programSource.name === "string" &&
        Array.isArray(draft.programSource.template)
          ? draft.programSource
          : null,
      updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : draft.startedAt,
    };
  } catch {
    return null;
  }
}

export function clearActiveWorkoutDraft(userId: string | undefined, expectedWorkoutId?: string) {
  if (!userId) return false;
  try {
    if (expectedWorkoutId) {
      const rawDraft = localStorage.getItem(draftKey(userId));
      if (rawDraft && JSON.parse(rawDraft).workoutId !== expectedWorkoutId) return false;
    }
    localStorage.removeItem(draftKey(userId));
    window.dispatchEvent(new Event(ACTIVE_WORKOUT_DRAFT_EVENT));
    return true;
  } catch {
    return false;
  }
}

export { ACTIVE_WORKOUT_DRAFT_EVENT };
