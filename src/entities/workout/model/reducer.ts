import type { Exercise, WorkoutExercise, LocalSet, PreviousSetData } from "@/entities/workout";

// --- State ---

export interface WorkoutState {
  exercises: WorkoutExercise[];
  startedAt: string;
  timerOpen: boolean;
  saving: boolean;
}

// --- Actions ---

export type WorkoutAction =
  | { type: "ADD_EXERCISE"; exercise: Exercise; previousSets?: PreviousSetData[] }
  | { type: "REMOVE_EXERCISE"; index: number }
  | { type: "ADD_SET"; exerciseIndex: number }
  | { type: "UPDATE_SET"; exerciseIndex: number; set: LocalSet }
  | { type: "COMPLETE_SET"; exerciseIndex: number; set: LocalSet; autoTimer: boolean }
  | { type: "DELETE_SET"; exerciseIndex: number; setId: string }
  | { type: "SET_TIMER_OPEN"; open: boolean }
  | { type: "SET_SAVING"; saving: boolean };

// --- Reducer ---

const DEFAULT_REPS = 8;

function generateId() {
  return crypto.randomUUID();
}

export function workoutReducer(state: WorkoutState, action: WorkoutAction): WorkoutState {
  switch (action.type) {
    case "ADD_EXERCISE": {
      const prev = action.previousSets;
      const sets: LocalSet[] =
        prev && prev.length > 0
          ? prev.map((ps, i) => ({
              id: generateId(),
              setNumber: i + 1,
              weight: ps.weight,
              reps: ps.reps ?? DEFAULT_REPS,
              rpe: null,
              durationS: null,
              completed: false,
            }))
          : [
              {
                id: generateId(),
                setNumber: 1,
                weight: null,
                reps: DEFAULT_REPS,
                rpe: null,
                durationS: null,
                completed: false,
              },
            ];

      return {
        ...state,
        exercises: [
          ...state.exercises,
          {
            exercise: action.exercise,
            sets,
          },
        ],
      };
    }

    case "REMOVE_EXERCISE":
      return {
        ...state,
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
            sets: [
              ...we.sets,
              {
                id: generateId(),
                setNumber: we.sets.length + 1,
                weight: lastSet?.weight ?? null,
                reps: lastSet?.reps ?? DEFAULT_REPS,
                rpe: null,
                durationS: null,
                completed: false,
              },
            ],
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

    case "COMPLETE_SET":
      return {
        ...state,
        timerOpen: action.autoTimer && action.set.completed,
        exercises: state.exercises.map((we, i) =>
          i !== action.exerciseIndex
            ? we
            : {
                ...we,
                sets: we.sets.map((s) => (s.id === action.set.id ? action.set : s)),
              }
        ),
      };

    case "DELETE_SET": {
      return {
        ...state,
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

    case "SET_TIMER_OPEN":
      return { ...state, timerOpen: action.open };

    case "SET_SAVING":
      return { ...state, saving: action.saving };

    default:
      return state;
  }
}

export function createInitialState(): WorkoutState {
  return {
    exercises: [],
    startedAt: new Date().toISOString(),
    timerOpen: false,
    saving: false,
  };
}

export { generateId };
