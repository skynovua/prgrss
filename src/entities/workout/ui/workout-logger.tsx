import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { Check, Clock3, Dumbbell, Plus, Timer } from "lucide-react";
import { useEffect, useState } from "react";

import { useProfile } from "@/entities/profile";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui";

import type { Exercise, PreviousSetsMap } from "../model/types";
import { useWorkout } from "../model/use-workout";
import { getWorkoutReview } from "../model/workout-logging";
import { ExercisePicker } from "./exercise-picker";
import { RestTimer } from "./rest-timer";
import { WorkoutExerciseCard } from "./workout-exercise-card";
import { WorkoutFinishDialog } from "./workout-finish-dialog";

function WorkoutDurationTimer({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  return (
    <NumberFlowGroup>
      <span
        className="inline-flex items-baseline font-medium tabular-nums"
        aria-label={`Тривалість ${hours > 0 ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`}
      >
        {hours > 0 && <NumberFlow trend={1} value={hours} />}
        <NumberFlow
          prefix={hours > 0 ? ":" : ""}
          trend={1}
          value={minutes}
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

interface WorkoutLoggerProps {
  exercises: Exercise[];
  previousSets?: PreviousSetsMap;
  historyUnavailable?: boolean;
  historyPending?: boolean;
}

export function WorkoutLogger({
  exercises,
  previousSets,
  historyUnavailable = false,
  historyPending = false,
}: WorkoutLoggerProps) {
  const { data: profile } = useProfile();
  const {
    state,
    dispatch,
    workoutExercises,
    startedAt,
    timerOpen,
    restClock,
    saving,
    totalSets,
    totalVolume,
    addExercise,
    handleFinish,
  } = useWorkout(previousSets);
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const hasExercises = workoutExercises.length > 0;

  const toggleCollapse = (id: string) =>
    setCollapsedCards((current) => ({ ...current, [id]: !current[id] }));
  const handleAddExercise = (exercise: Exercise) => {
    const previousExercise = workoutExercises.at(-1);
    if (previousExercise?.sets.every((set) => set.completed)) {
      setCollapsedCards((current) => ({ ...current, [previousExercise.instanceId]: true }));
    }
    addExercise(exercise);
  };
  const returnToWorkout = () => {
    setReviewOpen(false);
    const issues = getWorkoutReview(workoutExercises).invalidSets;
    if (issues.length > 0) {
      setCollapsedCards((current) => ({
        ...current,
        ...Object.fromEntries(
          issues.map((issue) => [workoutExercises[issue.exerciseIndex].instanceId, false])
        ),
      }));
      window.requestAnimationFrame(() => {
        const row = document.getElementById(`workout-set-${issues[0].setId}`);
        row?.scrollIntoView({ block: "center", behavior: "smooth" });
        row?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus();
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-[calc(11rem+env(safe-area-inset-bottom))] sm:px-5 md:px-8">
      <header className="bg-background/95 sticky top-0 z-30 -mx-1 flex items-center justify-between gap-2 border-b px-1 pt-5 pb-4 backdrop-blur">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium tracking-tight">Тренування</h1>
          {hasExercises && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
              <Clock3 className="size-3.5" />
              <WorkoutDurationTimer startedAt={startedAt} />
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={() => dispatch({ type: "SET_TIMER_OPEN", open: true })}
            aria-label="Відкрити таймер відпочинку"
          >
            <Timer />
          </Button>
          {hasExercises && (
            <Button variant="outline" onClick={() => setReviewOpen(true)} disabled={saving}>
              <Check data-icon="inline-start" />
              Завершити
            </Button>
          )}
        </div>
      </header>
      {historyPending && (
        <p role="status" className="text-muted-foreground text-sm">
          Підвантажуємо минулі підходи. Уже можна додавати вправи й записувати значення вручну.
        </p>
      )}
      {historyUnavailable && (
        <p role="status" className="text-muted-foreground text-sm">
          Історію підходів не вдалося завантажити. Можна записати тренування вручну.
        </p>
      )}
      {!hasExercises ? (
        <Empty className="px-4 py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Dumbbell />
            </EmptyMedia>
            <EmptyTitle>Твоє наступне тренування</EmptyTitle>
            <EmptyDescription>
              Обери першу вправу — тоді почнеться відлік часу. Якщо історія вже завантажена,
              підставимо минулі підходи під час додавання вправи.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <ExercisePicker
              exercises={exercises}
              onSelect={handleAddExercise}
              trigger={
                <Button size="lg">
                  <Plus data-icon="inline-start" />
                  Почати тренування
                </Button>
              }
            />
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div
            className="text-muted-foreground flex items-center justify-between gap-3 px-1 text-xs"
            aria-label="Підсумок сесії"
          >
            <span>
              Вправи: {workoutExercises.length} · Підходи: {totalSets}
            </span>
            <span className="tabular-nums">
              {new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(totalVolume)} кг
              об’єму
            </span>
          </div>
          {workoutExercises.map((we, exerciseIndex) => (
            <WorkoutExerciseCard
              key={we.instanceId}
              we={we}
              exerciseIndex={exerciseIndex}
              previousSets={previousSets?.[we.exercise.id]}
              autoRestTimer={profile?.autoRestTimer ?? true}
              isCollapsed={collapsedCards[we.instanceId] ?? false}
              onToggleCollapse={toggleCollapse}
              dispatch={dispatch}
            />
          ))}
          <ExercisePicker exercises={exercises} onSelect={handleAddExercise} />
          <p className="text-muted-foreground px-1 text-center text-xs leading-relaxed">
            Чернетка зберігається на цьому пристрої
          </p>
        </>
      )}
      <RestTimer open={timerOpen} clock={restClock} dispatch={dispatch} />
      <WorkoutFinishDialog
        key={state.workoutId}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        exercises={workoutExercises}
        saving={saving}
        onSave={(details) => void handleFinish(details)}
        onReturn={returnToWorkout}
        initialName={state.name}
        initialNotes={state.notes}
        onDetailsChange={(details) => dispatch({ type: "SET_WORKOUT_DETAILS", ...details })}
      />
    </div>
  );
}
