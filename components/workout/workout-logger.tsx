"use client";

import { useReducer, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { SetRow } from "@/components/workout/set-row";
import { RestTimer } from "@/components/workout/rest-timer";
import { Timer, Plus, Square } from "lucide-react";
import {
  type Exercise,
  type WorkoutExercise,
  type LocalSet,
  MUSCLE_GROUP_LABELS,
  type MuscleGroup,
} from "@/lib/types";
import { db } from "@/lib/offline/db";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// --- Reducer ---

interface WorkoutState {
  exercises: WorkoutExercise[];
  startedAt: string;
  timerOpen: boolean;
  saving: boolean;
}

type WorkoutAction =
  | { type: "ADD_EXERCISE"; exercise: Exercise }
  | { type: "REMOVE_EXERCISE"; index: number }
  | { type: "ADD_SET"; exerciseIndex: number }
  | { type: "UPDATE_SET"; exerciseIndex: number; set: LocalSet }
  | { type: "COMPLETE_SET"; exerciseIndex: number; set: LocalSet }
  | { type: "DELETE_SET"; exerciseIndex: number; setId: string }
  | { type: "SET_TIMER_OPEN"; open: boolean }
  | { type: "SET_SAVING"; saving: boolean };

function generateId() {
  return crypto.randomUUID();
}

function workoutReducer(state: WorkoutState, action: WorkoutAction): WorkoutState {
  switch (action.type) {
    case "ADD_EXERCISE":
      return {
        ...state,
        exercises: [
          ...state.exercises,
          {
            exercise: action.exercise,
            sets: [
              {
                id: generateId(),
                setNumber: 1,
                weight: null,
                reps: null,
                rpe: null,
                durationS: null,
                completed: false,
              },
            ],
          },
        ],
      };

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
                reps: lastSet?.reps ?? null,
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
                sets: we.sets.map((s) =>
                  s.id === action.set.id ? action.set : s
                ),
              }
        ),
      };

    case "COMPLETE_SET":
      return {
        ...state,
        timerOpen: action.set.completed,
        exercises: state.exercises.map((we, i) =>
          i !== action.exerciseIndex
            ? we
            : {
                ...we,
                sets: we.sets.map((s) =>
                  s.id === action.set.id ? action.set : s
                ),
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

function createInitialState(): WorkoutState {
  return {
    exercises: [],
    startedAt: new Date().toISOString(),
    timerOpen: false,
    saving: false,
  };
}

// --- Memoized Exercise Card ---

interface ExerciseCardProps {
  we: WorkoutExercise;
  exerciseIndex: number;
  dispatch: React.ActionDispatch<[action: WorkoutAction]>;
}

const ExerciseCard = memo(function ExerciseCard({
  we,
  exerciseIndex,
  dispatch,
}: ExerciseCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{we.exercise.name}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {we.exercise.muscle_group &&
                MUSCLE_GROUP_LABELS[we.exercise.muscle_group as MuscleGroup]}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() =>
              dispatch({ type: "REMOVE_EXERCISE", index: exerciseIndex })
            }
          >
            Видалити
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex items-center gap-2 px-2 pb-1 text-xs font-medium text-muted-foreground">
          <span className="w-8 text-center">#</span>
          <span className="w-20 text-center">Вага</span>
          <span className="w-16 text-center">Повт</span>
          <span className="w-16 text-center">RPE</span>
          <span className="w-10" />
          <span className="w-10" />
        </div>

        {we.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            onUpdate={(s) =>
              dispatch({ type: "UPDATE_SET", exerciseIndex, set: s })
            }
            onComplete={(s) =>
              dispatch({ type: "COMPLETE_SET", exerciseIndex, set: s })
            }
            onDelete={(id) =>
              dispatch({ type: "DELETE_SET", exerciseIndex, setId: id })
            }
          />
        ))}

        <Button
          variant="ghost"
          size="sm"
          className="mt-1 gap-1"
          onClick={() => dispatch({ type: "ADD_SET", exerciseIndex })}
        >
          <Plus className="h-3 w-3" />
          Додати підхід
        </Button>
      </CardContent>
    </Card>
  );
});

// --- Main Component ---

interface WorkoutLoggerProps {
  exercises: Exercise[];
}

export function WorkoutLogger({ exercises }: WorkoutLoggerProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(workoutReducer, undefined, createInitialState);
  const { exercises: workoutExercises, startedAt, timerOpen, saving } = state;

  const handleAddExercise = useCallback(
    (exercise: Exercise) => {
      dispatch({ type: "ADD_EXERCISE", exercise });
    },
    []
  );

  const handleFinish = async () => {
    if (workoutExercises.length === 0) return;

    dispatch({ type: "SET_SAVING", saving: true });
    const supabase = createClient();
    const finishedAt = new Date().toISOString();
    const workoutId = generateId();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      dispatch({ type: "SET_SAVING", saving: false });
      router.push("/login");
      return;
    }

    // Спробуємо зберегти в Supabase
    const { error: workoutError } = await supabase.from("workouts").insert({
      id: workoutId,
      user_id: user.id,
      started_at: startedAt,
      finished_at: finishedAt,
      name: workoutExercises
        .map((we) => we.exercise.name)
        .slice(0, 3)
        .join(", "),
    });

    if (workoutError) {
      // Offline — зберігаємо в Dexie
      try {
        await db.pendingWorkouts.add({
          uuid: workoutId,
          name: workoutExercises
            .map((we) => we.exercise.name)
            .slice(0, 3)
            .join(", "),
          startedAt,
          finishedAt,
          notes: null,
          programId: null,
          syncedAt: null,
        });

        for (const we of workoutExercises) {
          for (const set of we.sets.filter((s) => s.completed)) {
            await db.pendingSets.add({
              uuid: generateId(),
              workoutUuid: workoutId,
              exerciseId: we.exercise.id,
              setNumber: set.setNumber,
              reps: set.reps,
              weight: set.weight,
              rpe: set.rpe,
              durationS: set.durationS,
              notes: null,
              syncedAt: null,
            });
          }
        }
        toast.info("Збережено офлайн", {
          description: "Синхронізується при появі інтернету",
        });
      } catch {
        toast.error("Не вдалося зберегти тренування");
        dispatch({ type: "SET_SAVING", saving: false });
        return;
      }
    } else {
      // Online — зберігаємо сети
      const setsToInsert = workoutExercises.flatMap((we) =>
        we.sets
          .filter((s) => s.completed)
          .map((set) => ({
            workout_id: workoutId,
            exercise_id: we.exercise.id,
            set_number: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            rpe: set.rpe,
            duration_s: set.durationS,
          }))
      );

      if (setsToInsert.length > 0) {
        await supabase.from("sets").insert(setsToInsert);
      }
      toast.success("Тренування збережено");
    }

    dispatch({ type: "SET_SAVING", saving: false });
    router.push("/dashboard");
  };

  const totalSets = workoutExercises.reduce(
    (acc, we) => acc + we.sets.filter((s) => s.completed).length,
    0
  );
  const totalVolume = workoutExercises.reduce(
    (acc, we) =>
      acc +
      we.sets
        .filter((s) => s.completed)
        .reduce((a, s) => a + (s.weight ?? 0) * (s.reps ?? 0), 0),
    0
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      {/* Хедер */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Тренування</h1>
          <p className="text-sm text-muted-foreground">
            {totalSets} підходів · {Math.round(totalVolume)} кг об&apos;єм
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => dispatch({ type: "SET_TIMER_OPEN", open: true })}
        >
          <Timer className="h-5 w-5" />
        </Button>
      </div>

      <Separator />

      {/* Вправи */}
      {workoutExercises.map((we, exerciseIndex) => (
        <ExerciseCard
          key={`${we.exercise.id}-${exerciseIndex}`}
          we={we}
          exerciseIndex={exerciseIndex}
          dispatch={dispatch}
        />
      ))}

      {/* Додати вправу */}
      <ExercisePicker exercises={exercises} onSelect={handleAddExercise} />

      {/* Таймер відпочинку */}
      <RestTimer
        open={timerOpen}
        onOpenChange={(open) => dispatch({ type: "SET_TIMER_OPEN", open })}
      />

      {/* Завершити тренування */}
      {workoutExercises.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4"
        >
          <div className="mx-auto max-w-lg rounded-2xl border border-border/80 bg-background/95 p-3 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80">
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleFinish}
              disabled={saving || totalSets === 0}
            >
              <Square className="h-4 w-4" />
              {saving ? "Зберігаю..." : "Завершити тренування"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
