import type { ExerciseLogPreferences } from "./exercise-log-preferences";
import { extendRestClock, type RestClock, startRestClock, toggleRestClock } from "./rest-clock";
import type { Exercise, LocalSet, PreviousSetData, WorkoutExercise } from "./types";
import { createWorkoutSet, getExerciseTrackingType, isSetValid } from "./workout-logging";

// --- State ---

export interface WorkoutState {
  exercises: WorkoutExercise[];
  workoutId: string;
  startedAt: string;
  timerOpen: boolean;
  restClock: RestClock | null;
  name: string;
  notes: string;
  saving: boolean;
}

// --- Actions ---

export type WorkoutAction =
  | {
      type: "ADD_EXERCISE";
      exercise: Exercise;
      previousSets?: PreviousSetData[];
      preferences?: ExerciseLogPreferences;
    }
  | { type: "REMOVE_EXERCISE"; index: number }
  | { type: "REORDER_EXERCISE"; instanceId: string; toIndex: number }
  | { type: "ADD_SET"; exerciseIndex: number }
  | { type: "UPDATE_SET"; exerciseIndex: number; set: LocalSet }
  | { type: "COMPLETE_SET"; exerciseIndex: number; set: LocalSet; autoTimer: boolean }
  | { type: "DELETE_SET"; exerciseIndex: number; setId: string }
  | { type: "RESTORE_SET"; exercise: WorkoutExercise; exerciseIndex: number; set: LocalSet }
  | { type: "SET_EXERCISE_OPTIONS"; exerciseIndex: number; preferences: ExerciseLogPreferences }
  | { type: "SET_TIMER_OPEN"; open: boolean }
  | { type: "START_REST_TIMER"; seconds: number; now: number }
  | { type: "TOGGLE_REST_TIMER"; now: number }
  | { type: "EXTEND_REST_TIMER"; seconds: number; now: number }
  | { type: "STOP_REST_TIMER" }
  | { type: "SET_WORKOUT_DETAILS"; name: string; notes: string }
  | { type: "SET_SAVING"; saving: boolean };

// --- Reducer ---

function generateId() {
  return crypto.randomUUID();
}

export function workoutReducer(state: WorkoutState, action: WorkoutAction): WorkoutState {
  switch (action.type) {
    case "ADD_EXERCISE": {
      const prev = action.previousSets;
      const trackingType =
        action.preferences?.trackingType ?? getExerciseTrackingType(action.exercise, prev);
      const sets: LocalSet[] =
        prev && prev.length > 0
          ? prev.map((ps, i) => createWorkoutSet(trackingType, i + 1, ps))
          : [createWorkoutSet(trackingType, 1)];

      return {
        ...state,
        startedAt: state.exercises.length === 0 ? new Date().toISOString() : state.startedAt,
        workoutId: state.exercises.length === 0 ? generateId() : state.workoutId,
        name: state.exercises.length === 0 ? "" : state.name,
        notes: state.exercises.length === 0 ? "" : state.notes,
        exercises: [
          ...state.exercises,
          {
            instanceId: generateId(),
            exercise: action.exercise,
            sets,
            trackingType,
            restSeconds: action.preferences?.restSeconds ?? 90,
          },
        ],
      };
    }

    case "REORDER_EXERCISE": {
      const fromIndex = state.exercises.findIndex((item) => item.instanceId === action.instanceId);
      if (
        fromIndex < 0 ||
        !Number.isInteger(action.toIndex) ||
        action.toIndex < 0 ||
        action.toIndex >= state.exercises.length ||
        fromIndex === action.toIndex
      )
        return state;

      const exercises = [...state.exercises];
      const [exercise] = exercises.splice(fromIndex, 1);
      exercises.splice(action.toIndex, 0, exercise);
      return { ...state, exercises };
    }

    case "REMOVE_EXERCISE":
      return {
        ...state,
        restClock: state.exercises.length === 1 ? null : state.restClock,
        exercises: state.exercises.filter((_, i) => i !== action.index),
      };

    case "ADD_SET": {
      return {
        ...state,
        exercises: state.exercises.map((we, i) => {
          if (i !== action.exerciseIndex) return we;
          const lastSet = we.sets[we.sets.length - 1];
          return {
            ...we,
            sets: [...we.sets, createWorkoutSet(we.trackingType, we.sets.length + 1, lastSet)],
          };
        }),
      };
    }

    case "UPDATE_SET":
      return {
        ...state,
        exercises: state.exercises.map((we, i) =>
          i !== action.exerciseIndex
            ? we
            : {
                ...we,
                sets: we.sets.map((s) => (s.id === action.set.id ? action.set : s)),
              }
        ),
      };

    case "COMPLETE_SET": {
      const exercise = state.exercises[action.exerciseIndex];
      if (!exercise || (action.set.completed && !isSetValid(action.set, exercise.trackingType))) {
        return state;
      }
      const previousSet = exercise.sets.find((set) => set.id === action.set.id);
      const shouldStartTimer =
        action.autoTimer &&
        action.set.completed &&
        !previousSet?.completed &&
        exercise.restSeconds > 0;
      return {
        ...state,
        restClock: shouldStartTimer
          ? startRestClock(exercise.restSeconds, Date.now())
          : state.restClock,
        exercises: state.exercises.map((we, i) =>
          i !== action.exerciseIndex
            ? we
            : {
                ...we,
                sets: we.sets.map((s) => (s.id === action.set.id ? action.set : s)),
              }
        ),
      };
    }

    case "DELETE_SET": {
      return {
        ...state,
        restClock:
          state.exercises.length === 1 && state.exercises[0].sets.length === 1
            ? null
            : state.restClock,
        exercises: state.exercises
          .map((we, i) => {
            if (i !== action.exerciseIndex) return we;
            const filtered = we.sets
              .filter((s) => s.id !== action.setId)
              .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
            return filtered.length === 0 ? null : { ...we, sets: filtered };
          })
          .filter((we): we is WorkoutExercise => we !== null),
      };
    }

    case "RESTORE_SET": {
      const existingIndex = state.exercises.findIndex(
        (exercise) => exercise.instanceId === action.exercise.instanceId
      );
      if (existingIndex === -1) {
        const exercises = [...state.exercises];
        exercises.splice(action.exerciseIndex, 0, { ...action.exercise, sets: [action.set] });
        return { ...state, exercises };
      }
      return {
        ...state,
        exercises: state.exercises.map((exercise, index) => {
          if (index !== existingIndex || exercise.sets.some((set) => set.id === action.set.id)) {
            return exercise;
          }
          const sets = [...exercise.sets];
          sets.splice(action.set.setNumber - 1, 0, action.set);
          return { ...exercise, sets: sets.map((set, i) => ({ ...set, setNumber: i + 1 })) };
        }),
      };
    }

    case "SET_EXERCISE_OPTIONS":
      return {
        ...state,
        exercises: state.exercises.map((exercise, index) => {
          if (index !== action.exerciseIndex) return exercise;
          const trackingType = action.preferences.trackingType ?? exercise.trackingType;
          const canChangeType = !exercise.sets.some((set) => set.completed);
          return {
            ...exercise,
            restSeconds: action.preferences.restSeconds ?? exercise.restSeconds,
            trackingType: canChangeType ? trackingType : exercise.trackingType,
            sets:
              canChangeType && trackingType !== exercise.trackingType
                ? exercise.sets.map((set) => ({
                    ...set,
                    inputValues: undefined,
                    weight: trackingType === "duration" ? null : set.weight,
                    reps: trackingType === "duration" ? null : (set.reps ?? 8),
                    durationS: trackingType === "duration" ? set.durationS : null,
                  }))
                : exercise.sets,
          };
        }),
      };

    case "SET_TIMER_OPEN":
      return { ...state, timerOpen: action.open };

    case "START_REST_TIMER":
      return { ...state, restClock: startRestClock(action.seconds, action.now), timerOpen: false };

    case "TOGGLE_REST_TIMER":
      return {
        ...state,
        restClock: state.restClock ? toggleRestClock(state.restClock, action.now) : null,
      };

    case "EXTEND_REST_TIMER":
      return {
        ...state,
        restClock: state.restClock
          ? extendRestClock(state.restClock, action.seconds, action.now)
          : null,
      };

    case "STOP_REST_TIMER":
      return { ...state, restClock: null, timerOpen: false };

    case "SET_SAVING":
      return { ...state, saving: action.saving };

    case "SET_WORKOUT_DETAILS":
      return { ...state, name: action.name, notes: action.notes };

    default:
      return state;
  }
}

export function createInitialState(): WorkoutState {
  return {
    exercises: [],
    workoutId: generateId(),
    startedAt: new Date().toISOString(),
    timerOpen: false,
    restClock: null,
    name: "",
    notes: "",
    saving: false,
  };
}

export { generateId };
