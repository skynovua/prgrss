import type { Json } from "@/shared/db";

import type { WorkoutExercise } from "../model/types";
import { getWorkoutReview } from "../model/workout-logging";

interface SaveWorkoutPayloadOptions {
  workoutId?: string;
  workoutExercises: WorkoutExercise[];
  startedAt: string;
  finishedAt: string;
  name?: string;
  notes?: string | null;
  programId?: string | null;
  enforceEditWindow?: boolean;
}

export function buildWorkoutName(workoutExercises: WorkoutExercise[]) {
  return workoutExercises
    .filter((we) => we.sets.some((set) => set.completed))
    .map((we) => we.exercise.name)
    .slice(0, 3)
    .join(", ");
}

export function buildWorkoutSetsPayload(workoutExercises: WorkoutExercise[]) {
  const review = getWorkoutReview(workoutExercises);
  if (review.invalidSets.length > 0 || review.completedSets === 0) {
    throw new Error("Дані тренування не пройшли перевірку: перевір виконані підходи.");
  }
  return workoutExercises.flatMap((we) =>
    we.sets
      .filter((set) => set.completed)
      .map((set, index) => ({
        exercise_id: we.exercise.id,
        set_number: index + 1,
        reps: we.trackingType === "duration" ? null : set.reps,
        weight: we.trackingType === "duration" ? null : set.weight,
        rpe: set.rpe,
        duration_s: we.trackingType === "duration" ? set.durationS : null,
        notes: set.notes?.trim() || null,
      }))
  );
}

export function buildSaveWorkoutPayload({
  workoutId,
  workoutExercises,
  startedAt,
  finishedAt,
  name,
  notes = null,
  programId = null,
  enforceEditWindow = false,
}: SaveWorkoutPayloadOptions): Json {
  return {
    workout_id: workoutId ?? null,
    started_at: startedAt,
    finished_at: finishedAt,
    name: name?.trim() || buildWorkoutName(workoutExercises),
    notes,
    program_id: programId,
    enforce_edit_window: enforceEditWindow,
    sets: buildWorkoutSetsPayload(workoutExercises),
  };
}

export function isLikelyNetworkError(error: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /failed to fetch|networkerror|network request failed/i.test(error.message);
}

type WorkoutOperation = "save" | "update" | "delete" | "sync";

interface PostgrestLikeError {
  code?: string | null;
  message?: string | null;
  details?: string | null;
}

export class WorkoutOperationError extends Error {
  kind: "network" | "auth" | "edit-window" | "validation" | "not-found" | "unknown";
  operation: WorkoutOperation;
  retryable: boolean;

  constructor({
    message,
    operation,
    kind,
    retryable,
  }: {
    message: string;
    operation: WorkoutOperation;
    kind: WorkoutOperationError["kind"];
    retryable: boolean;
  }) {
    super(message);
    this.name = "WorkoutOperationError";
    this.operation = operation;
    this.kind = kind;
    this.retryable = retryable;
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as PostgrestLikeError).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return "Невідома помилка";
}

export function toWorkoutOperationError(error: unknown, operation: WorkoutOperation) {
  if (error instanceof WorkoutOperationError) {
    return error;
  }

  if (isLikelyNetworkError(error)) {
    return new WorkoutOperationError({
      operation,
      kind: "network",
      retryable: true,
      message:
        operation === "sync" ? "Немає мережі для синхронізації" : "Немає з'єднання з інтернетом",
    });
  }

  const message = getErrorMessage(error);
  const normalizedMessage = message.toLowerCase();
  const code =
    error && typeof error === "object" && "code" in error
      ? ((error as PostgrestLikeError).code ?? null)
      : null;

  if (
    normalizedMessage.includes("not authenticated") ||
    normalizedMessage.includes("не авторизовано")
  ) {
    return new WorkoutOperationError({
      operation,
      kind: "auth",
      retryable: false,
      message: "Потрібно увійти в акаунт",
    });
  }

  if (
    normalizedMessage.includes("edit window expired") ||
    normalizedMessage.includes("24 години") ||
    normalizedMessage.includes("delete window expired")
  ) {
    return new WorkoutOperationError({
      operation,
      kind: "edit-window",
      retryable: false,
      message: "Час редагування або видалення вичерпано",
    });
  }

  if (normalizedMessage.includes("workout not found")) {
    return new WorkoutOperationError({
      operation,
      kind: "not-found",
      retryable: false,
      message: "Тренування не знайдено",
    });
  }

  if (
    code === "23514" ||
    normalizedMessage.includes("payload") ||
    normalizedMessage.includes("array")
  ) {
    return new WorkoutOperationError({
      operation,
      kind: "validation",
      retryable: false,
      message: "Дані тренування не пройшли перевірку",
    });
  }

  return new WorkoutOperationError({
    operation,
    kind: "unknown",
    retryable: false,
    message,
  });
}
