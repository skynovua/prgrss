import { Clock3, Plus, Settings2 } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";

import { ExerciseDetailsById } from "@/entities/exercise/@x/workout";
import { cn } from "@/shared/lib";
import {
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

import { saveExerciseLogPreferences } from "../model/exercise-log-preferences";
import { usesDoubleWeight } from "../model/metrics";
import type { WorkoutAction } from "../model/reducer";
import { formatRestTime } from "../model/rest-clock";
import type { ExerciseTrackingType, PreviousSetData, WorkoutExercise } from "../model/types";
import { TRACKING_TYPES } from "../model/workout-logging";
import { ExerciseCardActions } from "./exercise-card-actions";
import { ExerciseCardHeading } from "./exercise-card-heading";
import { SET_ROW_GRID, SetRow, TIMED_SET_ROW_GRID } from "./set-row";

const REST_OPTIONS = [
  { value: 0, label: "Без автоматичного таймера" },
  ...[60, 90, 120, 180, 300, 600].map((seconds) => ({
    value: seconds,
    label: formatRestTime(seconds),
  })),
];

function ExerciseOptions({
  we,
  onSave,
}: {
  we: WorkoutExercise;
  onSave: (trackingType: ExerciseTrackingType, restSeconds: number) => void;
}) {
  const [trackingType, setTrackingType] = useState(we.trackingType);
  const [restSeconds, setRestSeconds] = useState(we.restSeconds);
  const hasCompletedSets = we.sets.some((set) => set.completed);
  const trackingOptions = TRACKING_TYPES.filter(
    (item) =>
      item.value === "duration" ||
      item.value === (we.exercise.equipment === "bodyweight" ? "bodyweight" : "weight-reps")
  );
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(trackingType, restSeconds);
      }}
    >
      <FieldGroup>
        <Field data-disabled={hasCompletedSets}>
          <FieldLabel htmlFor={`tracking-${we.instanceId}`}>Формат запису</FieldLabel>
          <Select
            items={trackingOptions}
            value={trackingType}
            onValueChange={(value) => {
              if (value) setTrackingType(value);
            }}
            disabled={hasCompletedSets}
          >
            <SelectTrigger id={`tracking-${we.instanceId}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {trackingOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {hasCompletedSets && (
            <FieldDescription>Формат можна змінити до виконання підходів.</FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor={`rest-${we.instanceId}`}>Відпочинок після підходу</FieldLabel>
          <Select
            items={REST_OPTIONS}
            value={restSeconds}
            onValueChange={(value) => {
              if (value != null) setRestSeconds(value);
            }}
          >
            <SelectTrigger id={`rest-${we.instanceId}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {REST_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            Цей час використовується, коли автоматичний таймер увімкнений у профілі.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <Button type="submit">Застосувати</Button>
    </form>
  );
}

interface WorkoutExerciseCardProps {
  we: WorkoutExercise;
  exerciseIndex: number;
  previousSets?: PreviousSetData[];
  autoRestTimer: boolean;
  isCollapsed: boolean;
  collapseImmediately?: boolean;
  onToggleCollapse: (id: string) => void;
  dispatch: React.ActionDispatch<[action: WorkoutAction]>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const WorkoutExerciseCard = memo(function WorkoutExerciseCard({
  we,
  exerciseIndex,
  previousSets,
  autoRestTimer,
  isCollapsed,
  collapseImmediately = false,
  onToggleCollapse,
  dispatch,
  onMoveUp,
  onMoveDown,
}: WorkoutExerciseCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const timed = we.trackingType === "duration";
  const panelId = `exercise-panel-${we.instanceId}`;
  const weightLabel =
    we.trackingType === "bodyweight"
      ? "Дод. кг"
      : usesDoubleWeight(we.exercise)
        ? "кг / гантель"
        : "кг";

  return (
    <Card size="sm" className="gap-0 rounded-2xl data-[size=sm]:gap-0 data-[size=sm]:py-2">
      <ExerciseCardHeading
        name={we.exercise.name}
        timed={timed}
        expanded={!isCollapsed}
        panelId={panelId}
        sets={we.sets.map((set) => set.completed)}
        onOpenDetails={() => setDetailsOpen(true)}
        onToggle={() => onToggleCollapse(we.instanceId)}
        actions={
          <ExerciseCardActions
            exerciseId={we.exercise.id}
            exerciseName={we.exercise.name}
            onDelete={() => setConfirmOpen(true)}
            onSettings={() => setOptionsOpen(true)}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />
        }
      />
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-250 ease-out motion-reduce:transition-none",
          collapseImmediately && "transition-none",
          isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        )}
        aria-hidden={isCollapsed}
        inert={isCollapsed}
      >
        <div className="min-h-0 overflow-hidden">
          <CardContent className="flex flex-col gap-1 pt-3 group-data-[size=sm]/card:px-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
              <span className="text-muted-foreground text-xs">
                {timed
                  ? "Тривалість у секундах"
                  : we.trackingType === "bodyweight"
                    ? "Додаткова вага необов’язкова"
                    : usesDoubleWeight(we.exercise)
                      ? "Вага однієї гантелі"
                      : "Вага снаряда"}
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => setOptionsOpen(true)}
                aria-label={`Налаштувати відпочинок · ${we.exercise.name}`}
              >
                <Clock3 data-icon="inline-start" />
                {we.restSeconds > 0 ? formatRestTime(we.restSeconds) : "Без таймера"}
              </Button>
            </div>
            <div
              className={cn(
                timed ? TIMED_SET_ROW_GRID : SET_ROW_GRID,
                "text-muted-foreground px-1 text-center text-xs font-medium"
              )}
              aria-hidden="true"
            >
              <span>Сет</span>
              <span>{timed ? "Час, с" : weightLabel}</span>
              {!timed && <span>Повт.</span>}
              <span className="sr-only">Виконано</span>
            </div>
            {we.sets.map((set) => (
              <SetRow
                key={`${set.id}-${we.trackingType}`}
                set={set}
                trackingType={we.trackingType}
                exerciseName={we.exercise.name}
                previousSet={previousSets?.find((previous) => previous.setNumber === set.setNumber)}
                onUpdate={(updated) =>
                  dispatch({ type: "UPDATE_SET", exerciseIndex, set: updated })
                }
                onComplete={(updated) =>
                  dispatch({
                    type: "COMPLETE_SET",
                    exerciseIndex,
                    set: updated,
                    autoTimer: autoRestTimer,
                  })
                }
                onDelete={() => {
                  dispatch({ type: "DELETE_SET", exerciseIndex, setId: set.id });
                  toast("Підхід видалено", {
                    action: {
                      label: "Скасувати",
                      onClick: () =>
                        dispatch({ type: "RESTORE_SET", exercise: we, exerciseIndex, set }),
                    },
                  });
                }}
              />
            ))}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-11 flex-1 rounded-full"
                onClick={() => dispatch({ type: "ADD_SET", exerciseIndex })}
              >
                <Plus data-icon="inline-start" />
                Додати підхід
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-full"
                onClick={() => setOptionsOpen(true)}
                aria-label={`Налаштування вправи ${we.exercise.name}`}
              >
                <Settings2 />
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
      {detailsOpen && (
        <ExerciseDetailsById exercise={we.exercise} onClose={() => setDetailsOpen(false)} />
      )}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Видалити вправу?"
        description={`Вправа «${we.exercise.name}» буде видалена з усіма її підходами.`}
        confirmText="Видалити"
        isDestructive
        onConfirm={() => {
          dispatch({ type: "REMOVE_EXERCISE", index: exerciseIndex });
          setConfirmOpen(false);
        }}
      />
      <Dialog open={optionsOpen} onOpenChange={setOptionsOpen}>
        {optionsOpen && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Налаштування вправи</DialogTitle>
              <DialogDescription>{we.exercise.name}</DialogDescription>
            </DialogHeader>
            <ExerciseOptions
              we={we}
              onSave={(trackingType, restSeconds) => {
                saveExerciseLogPreferences(we.exercise.id, { trackingType, restSeconds });
                dispatch({
                  type: "SET_EXERCISE_OPTIONS",
                  exerciseIndex,
                  preferences: { trackingType, restSeconds },
                });
                setOptionsOpen(false);
              }}
            />
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
});
