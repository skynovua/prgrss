import { memo, useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { Separator } from "@/src/components/ui/separator";
import { ExercisePicker } from "@/src/components/workout/exercise-picker";
import { ExerciseSetIndicators } from "@/src/components/workout/exercise-set-indicators";
import { SetRow } from "@/src/components/workout/set-row";
import { RestTimer } from "@/src/components/workout/rest-timer";
import { WeightUnitLabel } from "@/src/components/workout/weight-display";
import { Timer, Plus, Check, Dumbbell, Trash2 } from "lucide-react";
import {
  type Exercise,
  type WorkoutExercise,
  type PreviousSetsMap,
  type PreviousSetData,
} from "@/src/lib/types";
import type { WorkoutAction } from "@/src/lib/workout/reducer";
import { useWorkout } from "@/src/lib/workout/use-workout";
import { useProfile } from "@/src/lib/hooks/use-profile";
import { usesDoubleWeight } from "@/src/lib/workout/metrics";
import { cn } from "@/src/lib/utils";

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
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={`Видалити вправу ${we.exercise.name}`}
            onClick={(event) => {
              event.stopPropagation();
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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

// --- Main Component ---

interface WorkoutLoggerProps {
  exercises: Exercise[];
  previousSets?: PreviousSetsMap;
}

export function WorkoutLogger({ exercises, previousSets }: WorkoutLoggerProps) {
  const { data: profile } = useProfile();
  const autoRestTimer = profile?.autoRestTimer ?? true;
  const {
    dispatch,
    workoutExercises,
    timerOpen,
    saving,
    totalSets,
    totalVolume,
    addExercise,
    handleFinish,
  } = useWorkout(previousSets);
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
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

  const toggleCollapse = (cardId: string) => {
    setCollapsedCards((current) => ({
      ...current,
      [cardId]: !current[cardId],
    }));
  };

  const handleAddExercise = (exercise: Exercise) => {
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

    addExercise(exercise);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      {/* Хедер */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Тренування</h1>
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
      {workoutExercises.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
          <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full">
            <Dumbbell className="text-muted-foreground h-8 w-8" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-lg font-semibold">Почнемо!</p>
            <p className="text-muted-foreground text-sm">Додай першу вправу до тренування</p>
          </div>
          <ExercisePicker
            exercises={exercises}
            onSelect={handleAddExercise}
            trigger={
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Додати вправу
              </Button>
            }
          />
        </div>
      ) : (
        <>
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
          <ExercisePicker exercises={exercises} onSelect={handleAddExercise} />
        </>
      )}

      {/* Таймер відпочинку */}
      <RestTimer
        open={timerOpen}
        onOpenChange={(open) => dispatch({ type: "SET_TIMER_OPEN", open })}
      />

      {/* Завершити тренування */}
      {workoutExercises.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4">
          <div className="border-border/80 bg-background/95 supports-backdrop-filter:bg-background/80 mx-auto max-w-lg rounded-2xl border p-3 shadow-lg backdrop-blur">
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleFinish}
              disabled={saving || totalSets === 0}
            >
              <Check className="h-5 w-5" />
              {saving ? "Зберігаю..." : "Завершити тренування"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
