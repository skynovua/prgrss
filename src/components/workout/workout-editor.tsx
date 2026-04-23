import { memo, useReducer, useCallback, useMemo, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { Separator } from "@/src/components/ui/separator";
import { ExerciseCardActions } from "@/src/components/workout/exercise-card-actions";
import { ExercisePicker } from "@/src/components/workout/exercise-picker";
import { ExerciseSetIndicators } from "@/src/components/workout/exercise-set-indicators";
import { SetRow } from "@/src/components/workout/set-row";
import { RestTimer } from "@/src/components/workout/rest-timer";
import { WeightUnitLabel } from "@/src/components/workout/weight-display";
import { ArrowLeft, Timer, Plus, Check } from "lucide-react";
import {
  type Exercise,
  type WorkoutExercise,
  type PreviousSetsMap,
  type PreviousSetData,
  type SetData,
  type ExerciseData,
  type WorkoutWithSets,
} from "@/src/lib/types";
import { workoutReducer, type WorkoutAction } from "@/src/lib/workout/reducer";
import { useUpdateWorkout } from "@/src/lib/hooks/use-workouts";
import { useProfile } from "@/src/lib/hooks/use-profile";
import { getWorkoutVolume, usesDoubleWeight } from "@/src/lib/workout/metrics";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";

// --- Memoized Exercise Card ---

interface ExerciseCardProps {
  cardId: string;
  we: WorkoutExercise;
  exerciseIndex: number;
  previousSets?: PreviousSetData[];
  autoRestTimer: boolean;
  isCollapsed: boolean;
  onToggleCollapse: (cardId: string) => void;
  dispatch: React.ActionDispatch<[action: WorkoutAction]>;
}

const ExerciseCard = memo(function ExerciseCard({
  cardId,
  we,
  exerciseIndex,
  previousSets,
  autoRestTimer,
  isCollapsed,
  onToggleCollapse,
  dispatch,
}: ExerciseCardProps) {
  const setGridClassName =
    "grid grid-cols-[2rem_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem_2.75rem] items-center gap-2";
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Card
      size="sm"
      className={cn(
        "transition-[gap,padding] duration-300 ease-out",
        isCollapsed && "cursor-pointer",
        isCollapsed ? "gap-0 py-3" : "py-4"
      )}
    >
      <CardHeader
        className={cn("transition-[padding] duration-300 ease-out", isCollapsed ? "pb-0" : "pb-3")}
      >
        <div className="flex items-start justify-between gap-3">
          {isCollapsed ? (
            <button
              type="button"
              className="focus-visible:ring-ring flex min-w-0 flex-1 items-start gap-3 rounded-md text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              onClick={() => onToggleCollapse(cardId)}
              aria-expanded={!isCollapsed}
              aria-label={`Розгорнути вправу ${we.exercise.name}`}
            >
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-base">{we.exercise.name}</CardTitle>
                <div className="animate-in fade-in-0 slide-in-from-top-2 mt-2 duration-200">
                  <ExerciseSetIndicators sets={we.sets} />
                </div>
              </div>
            </button>
          ) : (
            <button
              type="button"
              className="focus-visible:ring-ring flex min-w-0 flex-1 items-start gap-3 rounded-md text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              onClick={() => onToggleCollapse(cardId)}
              aria-expanded={!isCollapsed}
              aria-label={`Згорнути вправу ${we.exercise.name}`}
            >
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-base">{we.exercise.name}</CardTitle>
              </div>
            </button>
          )}
          <ExerciseCardActions
            exerciseId={we.exercise.id}
            exerciseName={we.exercise.name}
            onDelete={() => setConfirmOpen(true)}
          />
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="flex flex-col gap-1" onClick={(event) => event.stopPropagation()}>
          <div
            className={`${setGridClassName} text-muted-foreground px-2 pb-1 text-xs font-medium`}
          >
            <span className="text-center">Сет</span>
            <WeightUnitLabel
              isDoubleWeight={usesDoubleWeight(we.exercise)}
              className="text-center text-xs font-medium"
            />
            <span className="text-center">Повт.</span>
            <span className="text-center" title="Складність підходу від 6 до 10">
              Зусилля
            </span>
            <span />
            <span />
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
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Видалити вправу?"
        description={`Вправа "${we.exercise.name}" буде видалена разом з усіма її сетами.`}
        confirmText="Видалити"
        isDestructive
        onConfirm={() => {
          dispatch({ type: "REMOVE_EXERCISE", index: exerciseIndex });
          setConfirmOpen(false);
        }}
      />
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
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

  const { exercises: workoutExercises, timerOpen } = state;
  const defaultCollapsedCards = useMemo(
    () =>
      Object.fromEntries(
        workoutExercises
          .map((exercise, index) => [
            `${exercise.exercise.id}-${index}`,
            exercise.sets.length > 0 && exercise.sets.every((set) => set.completed),
          ])
          .filter(([, shouldCollapse]) => shouldCollapse)
      ) as Record<string, boolean>,
    [workoutExercises]
  );

  const addExercise = useCallback(
    (exercise: Exercise) => {
      const previousExerciseIndex = workoutExercises.length - 1;
      const previousExercise = workoutExercises[previousExerciseIndex];

      if (previousExercise && previousExercise.sets.length > 0) {
        const allSetsCompleted = previousExercise.sets.every((set) => set.completed);
        if (allSetsCompleted) {
          const previousCardId = `${previousExercise.exercise.id}-${previousExerciseIndex}`;
          setCollapsedCards((current) => ({
            ...current,
            [previousCardId]: true,
          }));
        }
      }

      dispatch({
        type: "ADD_EXERCISE",
        exercise,
        previousSets: previousSets?.[exercise.id],
      });
    },
    [previousSets, workoutExercises]
  );

  const toggleCollapse = (cardId: string) => {
    setCollapsedCards((current) => ({
      ...current,
      [cardId]: !(current[cardId] ?? defaultCollapsedCards[cardId] ?? false),
    }));
  };

  const totalSets = workoutExercises.reduce(
    (acc, we) => acc + we.sets.filter((s) => s.completed).length,
    0
  );

  const totalVolume = getWorkoutVolume(workoutExercises);

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
          cardId={`${we.exercise.id}-${exerciseIndex}`}
          we={we}
          exerciseIndex={exerciseIndex}
          previousSets={previousSets?.[we.exercise.id]}
          autoRestTimer={autoRestTimer}
          isCollapsed={
            collapsedCards[`${we.exercise.id}-${exerciseIndex}`] ??
            defaultCollapsedCards[`${we.exercise.id}-${exerciseIndex}`] ??
            false
          }
          onToggleCollapse={toggleCollapse}
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
