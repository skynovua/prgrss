import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { Dumbbell, Ellipsis, Flag, Layers3, Plus, Settings2, Timer, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { useProfile, useUpdateProfile } from "@/entities/profile";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Switch,
} from "@/shared/ui";

import type {
  Exercise,
  ExerciseData,
  PreviousSetsMap,
  SavedWorkoutContext,
  WorkoutExercise,
  WorkoutProgramSource,
} from "../model/types";
import { useWorkout } from "../model/use-workout";
import { getWorkoutReview } from "../model/workout-logging";
import { ExercisePicker } from "./exercise-picker";
import { RestTimer } from "./rest-timer";
import { WorkoutExerciseList } from "./workout-exercise-list";
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
  exercises?: Exercise[];
  exercisesPending: boolean;
  onRetryExercises: () => void;
  previousSets?: PreviousSetsMap;
  historyUnavailable?: boolean;
  onOpenExerciseDetails: (exercise: ExerciseData) => void;
  onWorkoutSaved?: (context: SavedWorkoutContext) => boolean;
  renderTemplatePicker?: (props: WorkoutTemplatePickerProps) => ReactNode;
}

export interface WorkoutTemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasExercises: boolean;
  onSelect: (template: {
    name: string;
    exercises: WorkoutExercise[];
    programSource: WorkoutProgramSource;
  }) => void;
}

export function WorkoutLogger({
  exercises,
  exercisesPending,
  onRetryExercises,
  previousSets,
  historyUnavailable = false,
  onOpenExerciseDetails,
  onWorkoutSaved,
  renderTemplatePicker,
}: WorkoutLoggerProps) {
  const { data: profile, isPending: profileLoading, fetchStatus, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
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
    cancelWorkout,
    handleFinish,
  } = useWorkout(previousSets, onWorkoutSaved);
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const hasExercises = workoutExercises.length > 0;

  const toggleCollapse = (id: string) =>
    setCollapsedCards((current) => ({ ...current, [id]: !current[id] }));
  const handleAddExercises = (exercises: Exercise[]) => {
    const previousExercise = workoutExercises.at(-1);
    if (previousExercise?.sets.every((set) => set.completed)) {
      setCollapsedCards((current) => ({ ...current, [previousExercise.instanceId]: true }));
    }
    exercises.forEach(addExercise);
  };
  const exercisePicker = (
    <ExercisePicker
      exercises={exercises ?? []}
      isLoading={exercisesPending}
      isUnavailable={!exercises && !exercisesPending}
      onRetry={onRetryExercises}
      onSelect={handleAddExercises}
      trigger={
        hasExercises ? undefined : (
          <Button variant="primary" size="lg">
            <Plus data-icon="inline-start" />
            Додати вправу
          </Button>
        )
      }
    />
  );
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
    <div className="flex min-w-0 flex-1 flex-col gap-5 px-4 pb-[calc(11rem+env(safe-area-inset-bottom))] sm:px-5 md:px-8">
      <header className="border-border/30 bg-background/50 before:bg-background sticky top-[env(safe-area-inset-top,0px)] z-30 -mx-4 flex items-center justify-between gap-3 border-b px-4 pt-4 pb-3 backdrop-blur-md before:pointer-events-none before:absolute before:inset-x-0 before:-top-[env(safe-area-inset-top,0px)] before:h-[env(safe-area-inset-top,0px)] before:content-[''] sm:-mx-5 sm:px-5 md:-mx-8 md:px-8">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            render={
              <Button
                variant="secondary"
                size="icon-lg"
                className="rounded-full"
                aria-label="Меню тренування"
                disabled={saving}
              />
            }
          >
            <Ellipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              {renderTemplatePicker && (
                <DropdownMenuItem onClick={() => setTemplatePickerOpen(true)}>
                  <Layers3 /> Обрати шаблон
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => dispatch({ type: "SET_TIMER_OPEN", open: true })}>
                <Timer /> Таймер відпочинку
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings2 /> Налаштування
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setCancelOpen(true)}>
                <X /> Скасувати тренування
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <h1 className="text-muted-foreground text-xs font-medium">Тренування</h1>
          <div className="h-8 overflow-hidden text-2xl leading-8 tracking-tight">
            <WorkoutDurationTimer startedAt={startedAt} />
          </div>
        </div>
        <Button
          variant="secondary"
          size="icon-lg"
          className="rounded-full"
          onClick={() => setReviewOpen(true)}
          disabled={saving || !hasExercises}
          aria-label="Перевірити й завершити тренування"
        >
          <Flag />
        </Button>
      </header>
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
            <EmptyDescription>Додай вправи або обери готовий шаблон.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {exercisePicker}
            {renderTemplatePicker && (
              <Button variant="outline" onClick={() => setTemplatePickerOpen(true)}>
                <Layers3 data-icon="inline-start" /> Обрати шаблон
              </Button>
            )}
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
          <WorkoutExerciseList
            exercises={workoutExercises}
            previousSets={previousSets}
            autoRestTimer={profile?.autoRestTimer ?? true}
            collapsedCards={collapsedCards}
            onToggleCollapse={toggleCollapse}
            onOpenExerciseDetails={onOpenExerciseDetails}
            onCollapseAll={() =>
              setCollapsedCards(
                Object.fromEntries(workoutExercises.map((we) => [we.instanceId, true]))
              )
            }
            dispatch={dispatch}
          />
          {exercisePicker}
          <p className="text-muted-foreground px-1 text-center text-xs leading-relaxed">
            Чернетка зберігається на цьому пристрої
          </p>
        </>
      )}
      <RestTimer open={timerOpen} clock={restClock} dispatch={dispatch} />
      {templatePickerOpen &&
        renderTemplatePicker?.({
          open: templatePickerOpen,
          onOpenChange: setTemplatePickerOpen,
          hasExercises,
          onSelect: (template) => {
            dispatch({ type: "APPLY_TEMPLATE", ...template });
            setCollapsedCards({});
            setTemplatePickerOpen(false);
          },
        })}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Налаштування тренувань</DialogTitle>
            <DialogDescription>
              Це налаштування зберігається у профілі для наступних тренувань.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="workout-auto-rest" className="text-sm font-medium">
              Автоматичний таймер відпочинку
            </label>
            <Switch
              id="workout-auto-rest"
              checked={profile?.autoRestTimer ?? false}
              disabled={!profile || updateProfile.isPending}
              onCheckedChange={(checked) => updateProfile.mutate({ auto_rest_timer: checked })}
            />
          </div>
          {!profile && (
            <div className="flex flex-col items-start gap-3">
              <p className="text-muted-foreground text-sm">
                {profileLoading && fetchStatus !== "paused"
                  ? "Завантажуємо налаштування..."
                  : "Не вдалося завантажити налаштування."}
              </p>
              {(!profileLoading || fetchStatus === "paused") && (
                <Button variant="outline" size="sm" onClick={() => void refetch()}>
                  Спробувати ще
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Скасувати тренування?"
        description="Чернетку й записані підходи буде видалено без збереження."
        confirmText="Скасувати"
        cancelText="Продовжити"
        isDestructive
        onConfirm={cancelWorkout}
      />
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
