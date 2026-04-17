import { memo, useReducer, useCallback } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { ExercisePicker } from "@/src/components/workout/exercise-picker";
import { SetRow } from "@/src/components/workout/set-row";
import { RestTimer } from "@/src/components/workout/rest-timer";
import { ArrowLeft, Timer, Plus, Check } from "lucide-react";
import {
  type Exercise,
  type WorkoutExercise,
  type PreviousSetsMap,
  type PreviousSetData,
  type SetData,
  type ExerciseData,
  type WorkoutWithSets,
  MUSCLE_GROUP_LABELS,
  type MuscleGroup,
} from "@/src/lib/types";
import { workoutReducer, type WorkoutAction } from "@/src/lib/workout/reducer";
import { useUpdateWorkout } from "@/src/lib/hooks/use-workouts";
import { useProfile } from "@/src/lib/hooks/use-profile";
import { toast } from "sonner";

// --- Memoized Exercise Card ---

interface ExerciseCardProps {
  we: WorkoutExercise;
  exerciseIndex: number;
  previousSets?: PreviousSetData[];
  autoRestTimer: boolean;
  dispatch: React.ActionDispatch<[action: WorkoutAction]>;
}

const ExerciseCard = memo(function ExerciseCard({
  we,
  exerciseIndex,
  previousSets,
  autoRestTimer,
  dispatch,
}: ExerciseCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{we.exercise.name}</CardTitle>
            <p className="text-muted-foreground text-xs">
              {we.exercise.muscle_group &&
                MUSCLE_GROUP_LABELS[we.exercise.muscle_group as MuscleGroup]}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground text-xs"
            onClick={() => dispatch({ type: "REMOVE_EXERCISE", index: exerciseIndex })}
          >
            Видалити
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="text-muted-foreground flex items-center gap-2 px-2 pb-1 text-xs font-medium">
          <span className="w-8 text-center">#</span>
          <span className="w-20 text-center">Вага</span>
          <span className="w-16 text-center">Повт</span>
          <span className="w-16 text-center" title="Складність підходу від 6 до 10">
            Зусилля
          </span>
          <span className="w-11" />
          <span className="w-11" />
        </div>

        {we.sets.map((set) => {
          const prev = previousSets?.find((ps) => ps.setNumber === set.setNumber);
          return (
            <SetRow
              key={set.id}
              set={set}
              previousWeight={prev?.weight}
              previousReps={prev?.reps}
              onUpdate={(s) => dispatch({ type: "UPDATE_SET", exerciseIndex, set: s })}
              onComplete={(s) =>
                dispatch({
                  type: "COMPLETE_SET",
                  exerciseIndex,
                  set: s,
                  autoTimer: autoRestTimer,
                })
              }
              onDelete={(id) => dispatch({ type: "DELETE_SET", exerciseIndex, setId: id })}
            />
          );
        })}

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

// --- Конвертація DB-даних у WorkoutExercise[] ---

function workoutToEditorState(
  workout: WorkoutWithSets,
  exercises: ExerciseData[]
): WorkoutExercise[] {
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
  const grouped = new Map<string, SetData[]>();

  for (const set of workout.sets) {
    const existing = grouped.get(set.exercise_id) ?? [];
    existing.push(set);
    grouped.set(set.exercise_id, existing);
  }

  return Array.from(grouped.entries()).map(([exerciseId, sets]) => {
    const exercise = exerciseMap.get(exerciseId);
    const sortedSets = [...sets].sort((a, b) => a.set_number - b.set_number);

    return {
      exercise: {
        id: exerciseId,
        name: exercise?.name ?? "Невідома вправа",
        muscle_group: exercise?.muscle_group ?? null,
        equipment: exercise?.equipment ?? null,
        user_id: null,
        is_custom: false,
      },
      sets: sortedSets.map((s) => ({
        id: s.id,
        setNumber: s.set_number,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
        durationS: s.duration_s,
        completed: true,
      })),
    };
  });
}

// --- Main Component ---

interface WorkoutEditorProps {
  workout: WorkoutWithSets;
  exercises: ExerciseData[];
  allExercises: Exercise[];
  previousSets?: PreviousSetsMap;
}

export function WorkoutEditor({
  workout,
  exercises,
  allExercises,
  previousSets,
}: WorkoutEditorProps) {
  const navigate = useNavigate();
  const updateMutation = useUpdateWorkout();
  const { data: profile } = useProfile();
  const autoRestTimer = profile?.autoRestTimer ?? true;

  const [state, dispatch] = useReducer(workoutReducer, {
    exercises: workoutToEditorState(workout, exercises),
    startedAt: workout.started_at ?? new Date().toISOString(),
    timerOpen: false,
    saving: false,
  });

  const { exercises: workoutExercises, timerOpen } = state;

  const addExercise = useCallback(
    (exercise: Exercise) => {
      dispatch({
        type: "ADD_EXERCISE",
        exercise,
        previousSets: previousSets?.[exercise.id],
      });
    },
    [previousSets]
  );

  const totalSets = workoutExercises.reduce(
    (acc, we) => acc + we.sets.filter((s) => s.completed).length,
    0
  );

  const totalVolume = workoutExercises.reduce(
    (acc, we) =>
      acc +
      we.sets.filter((s) => s.completed).reduce((a, s) => a + (s.weight ?? 0) * (s.reps ?? 0), 0),
    0
  );

  const handleSave = async () => {
    dispatch({ type: "SET_SAVING", saving: true });

    try {
      await updateMutation.mutateAsync({
        workoutId: workout.id,
        exercises: workoutExercises,
        notes: workout.notes,
      });

      toast.success("Тренування оновлено");
      navigate({ to: "/workout/$id", params: { id: workout.id } });
    } catch {
      // toast обробляється в мутації
    } finally {
      dispatch({ type: "SET_SAVING", saving: false });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      {/* Хедер */}
      <div className="flex items-center gap-3">
        <Link to="/workout/$id" params={{ id: workout.id }}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Редагування</h1>
          <p className="text-muted-foreground text-sm">
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
          previousSets={previousSets?.[we.exercise.id]}
          autoRestTimer={autoRestTimer}
          dispatch={dispatch}
        />
      ))}

      {/* Додати вправу */}
      <ExercisePicker exercises={allExercises} onSelect={addExercise} />

      {/* Таймер відпочинку */}
      <RestTimer
        open={timerOpen}
        onOpenChange={(open) => dispatch({ type: "SET_TIMER_OPEN", open })}
      />

      {/* Зберегти */}
      {workoutExercises.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4">
          <div className="border-border/80 bg-background/95 supports-backdrop-filter:bg-background/80 mx-auto max-w-lg rounded-2xl border p-3 shadow-lg backdrop-blur">
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleSave}
              disabled={state.saving || totalSets === 0}
            >
              <Check className="h-5 w-5" />
              {state.saving ? "Зберігаю..." : "Зберегти зміни"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
