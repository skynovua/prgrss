import { memo, useEffect, useState } from "react";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { Button } from "@/shared/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { ConfirmDialog } from "@/shared/ui";
import { ExerciseCardActions } from "@/entities/workout";
import { ExercisePicker } from "@/entities/workout";
import { ExerciseSetIndicators } from "@/entities/workout";
import { SetRow } from "@/entities/workout";
import { RestTimer } from "@/entities/workout";
import { WeightUnitLabel } from "@/entities/workout";
import { Timer, Plus, Check, Dumbbell, Clock3, Layers3, Flame } from "lucide-react";
import {
  type Exercise,
  type WorkoutExercise,
  type PreviousSetsMap,
  type PreviousSetData,
} from "@/entities/workout";
import type { WorkoutAction } from "@/entities/workout";
import { useWorkout } from "@/entities/workout";
import { useProfile } from "@/entities/profile";
import { usesDoubleWeight } from "@/entities/workout";
import { cn } from "@/shared/lib";

function getElapsedSeconds(startedAt: string, now: number) {
  const started = new Date(startedAt).getTime();
  if (!Number.isFinite(started)) return 0;

  return Math.max(0, Math.floor((now - started) / 1000));
}

function formatWorkoutDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(
      2,
      "0"
    )}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function WorkoutDurationTimer({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  const seconds = getElapsedSeconds(startedAt, now);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <NumberFlowGroup>
      <span
        className="flex items-baseline text-3xl font-bold text-orange-500 tabular-nums"
        style={{ fontVariantNumeric: "tabular-nums" }}
        aria-label={formatWorkoutDuration(seconds)}
      >
        {hours > 0 && <NumberFlow trend={1} value={hours} />}
        <NumberFlow
          prefix={hours > 0 ? ":" : ""}
          trend={1}
          value={minutes}
          digits={{ 1: { max: hours > 0 ? 5 : 9 } }}
          format={{ minimumIntegerDigits: 2 }}
        />
        <NumberFlow
          prefix=":"
          trend={1}
          value={remainingSeconds}
          digits={{ 1: { max: 5 } }}
          format={{ minimumIntegerDigits: 2 }}
        />
      </span>
    </NumberFlowGroup>
  );
}

function WorkoutStat({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="bg-background/70 rounded-xl border px-3 py-3">
      <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="truncate text-lg font-semibold tabular-nums">{value}</span>
        <span className="text-muted-foreground pb-0.5 text-xs">{helper}</span>
      </div>
    </div>
  );
}

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
            className="mt-1"
            onClick={() => dispatch({ type: "ADD_SET", exerciseIndex })}
          >
            <Plus data-icon="inline-start" />
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
    startedAt,
    timerOpen,
    saving,
    totalSets,
    totalVolume,
    addExercise,
    handleFinish,
  } = useWorkout(previousSets);
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

  const toggleCollapse = (cardId: string) => {
    setCollapsedCards((current) => ({
      ...current,
      [cardId]: !(current[cardId] ?? false),
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
    <div className="flex flex-1 flex-col gap-5 p-4 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      <div className="flex items-start justify-between gap-3 px-1 pt-1">
        <div className="min-w-0">
          <p className="text-primary text-[10px] font-semibold tracking-[0.16em] uppercase">
            Active session
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-bold tracking-tight">Тренування</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Записуй підходи, об&apos;єм і темп сесії.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => dispatch({ type: "SET_TIMER_OPEN", open: true })}
          aria-label="Відкрити таймер відпочинку"
        >
          <Timer />
        </Button>
      </div>

      <Card className="p-0">
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs">
                <Clock3 className="size-3.5" />
                <span>Тривалість</span>
              </div>
              <WorkoutDurationTimer startedAt={startedAt} />
            </div>
            <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
              <Dumbbell className="size-5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <WorkoutStat
              icon={<Layers3 className="size-3.5" />}
              label="Підходи"
              value={`${totalSets}`}
              helper="готово"
            />
            <WorkoutStat
              icon={<Flame className="size-3.5" />}
              label="Об'єм"
              value={`${Math.round(totalVolume)}`}
              helper="кг"
            />
            <WorkoutStat
              icon={<Dumbbell className="size-3.5" />}
              label="Вправи"
              value={`${workoutExercises.length}`}
              helper="у сесії"
            />
          </div>
        </CardContent>
      </Card>

      {/* Вправи */}
      {workoutExercises.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-14 text-center">
          <div className="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-full">
            <Dumbbell className="size-8" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-xl font-semibold">Почнемо</p>
            <p className="text-muted-foreground max-w-64 text-sm">
              Додай першу вправу, а таймер тривалості вже рахує сесію.
            </p>
          </div>
          <ExercisePicker
            exercises={exercises}
            onSelect={handleAddExercise}
            trigger={
              <Button size="lg">
                <Plus data-icon="inline-start" />
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
                collapsedCards[`${we.exercise.id}-${exerciseIndex}`] ?? false
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
              <Check data-icon="inline-start" />
              {saving ? "Зберігаю..." : "Завершити тренування"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
