import { useBlocker } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useExercises } from "@/entities/exercise";
import {
  createWorkoutSet,
  ExerciseCardActions,
  ExercisePicker,
  type ExerciseTrackingType,
  formatRestTime,
  getExerciseLogPreferences,
  type LocalSet,
  TRACKING_TYPES,
  type WorkoutExercise,
} from "@/entities/workout";
import { exerciseForProgram } from "@/features/program";
import { useAuth } from "@/shared/auth";
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
  Input,
  PageHeader,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

import { moveProgramExercise, updateProgramExerciseOptions } from "../model/program-editor";
import { ProgramMuscles } from "./program-muscles";

interface ProgramEditorProps {
  initialName?: string;
  initialExercises?: WorkoutExercise[];
  saving: boolean;
  onSave: (name: string, exercises: WorkoutExercise[]) => Promise<void>;
  onBack: () => void;
}

export function ProgramEditor({
  initialName = "",
  initialExercises = [],
  saving,
  onSave,
  onBack,
}: ProgramEditorProps) {
  const { user } = useAuth();
  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState(initialExercises);
  const [initialState] = useState(() =>
    JSON.stringify({ name: initialName, exercises: initialExercises })
  );
  const [closeRequested, setCloseRequested] = useState(false);
  const [optionsTarget, setOptionsTarget] = useState<string | null>(null);
  const [optionsDirty, setOptionsDirty] = useState(false);
  const allowExit = useRef(false);
  const isDirty = optionsDirty || JSON.stringify({ name, exercises }) !== initialState;
  const blocker = useBlocker({
    shouldBlockFn: () => (isDirty || saving) && !allowExit.current,
    enableBeforeUnload: () => (isDirty || saving) && !allowExit.current,
    disabled: !isDirty && !saving,
    withResolver: true,
  });
  const blockerRef = useRef(blocker);
  useEffect(() => {
    blockerRef.current = blocker;
  }, [blocker]);
  const catalog = useExercises();
  const optionsExercise = exercises.find((exercise) => exercise.instanceId === optionsTarget);
  const closeEditor = () => {
    allowExit.current = true;
    if (blockerRef.current.status === "blocked") blockerRef.current.reset();
    onBack();
  };
  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: "weight" | "reps" | "durationS",
    value: string
  ) => {
    setExercises((current) =>
      current.map((exercise, index) =>
        index !== exerciseIndex
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set, i) =>
                i !== setIndex ? set : { ...set, [field]: value === "" ? null : Number(value) }
              ),
            }
      )
    );
  };
  const updateSets = (
    exerciseIndex: number,
    update: (sets: LocalSet[], exercise: WorkoutExercise) => LocalSet[]
  ) => {
    setExercises((current) =>
      current.map((exercise, index) =>
        index !== exerciseIndex
          ? exercise
          : {
              ...exercise,
              sets: update(exercise.sets, exercise),
            }
      )
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 pb-8 md:px-8">
      <PageHeader className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          onClick={() => (isDirty ? setCloseRequested(true) : onBack())}
          disabled={saving}
          aria-label="Повернутися до програм"
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-medium tracking-tight">
          {initialName ? "Програма тренування" : "Нова програма"}
        </h1>
      </PageHeader>
      <form
        className="flex flex-col gap-6"
        aria-busy={saving}
        inert={saving}
        onSubmit={async (event) => {
          event.preventDefault();
          if (!name.trim() || !exercises.length || saving) return;
          try {
            await onSave(name, exercises);
            closeEditor();
          } catch {
            // Помилка збереження показується мутацією; введені дані залишаються у формі.
          }
        }}
      >
        <Field>
          <FieldLabel htmlFor="program-name">Назва програми</FieldLabel>
          <Input
            id="program-name"
            placeholder="Наприклад, Верх тіла"
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <ProgramMuscles exercises={exercises} />
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold">Вправи та підходи</h2>
            <p className="text-muted-foreground text-sm">
              Значення підходів можна заповнити пізніше, під час тренування.
            </p>
          </div>
          {exercises.map((exercise, exerciseIndex) => (
            <Card key={exercise.instanceId} size="sm">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <h3 className="min-w-0 flex-1 text-sm font-semibold">{exercise.exercise.name}</h3>
                  <ExerciseCardActions
                    exerciseId={exercise.exercise.id}
                    exerciseName={exercise.exercise.name}
                    onSettings={() => setOptionsTarget(exercise.instanceId)}
                    onMoveUp={
                      exerciseIndex > 0
                        ? () =>
                            setExercises((current) =>
                              moveProgramExercise(current, exerciseIndex, exerciseIndex - 1)
                            )
                        : undefined
                    }
                    onMoveDown={
                      exerciseIndex < exercises.length - 1
                        ? () =>
                            setExercises((current) =>
                              moveProgramExercise(current, exerciseIndex, exerciseIndex + 1)
                            )
                        : undefined
                    }
                    onDelete={() =>
                      setExercises((current) => current.filter((_, i) => i !== exerciseIndex))
                    }
                  />
                </div>
                {exercise.sets.map((set, setIndex) => (
                  <div key={set.id} className="flex items-end gap-2">
                    <span className="text-muted-foreground flex h-11 w-7 shrink-0 items-center justify-center text-sm tabular-nums">
                      {setIndex + 1}
                    </span>
                    {exercise.trackingType === "duration" ? (
                      <Field className="min-w-0">
                        <FieldLabel htmlFor={`${set.id}-duration`}>Секунди</FieldLabel>
                        <Input
                          id={`${set.id}-duration`}
                          type="number"
                          min="1"
                          max="86400"
                          step="1"
                          value={set.durationS ?? ""}
                          onChange={(event) =>
                            updateSet(exerciseIndex, setIndex, "durationS", event.target.value)
                          }
                        />
                      </Field>
                    ) : (
                      <>
                        <Field className="min-w-0">
                          <FieldLabel htmlFor={`${set.id}-weight`}>Кг</FieldLabel>
                          <Input
                            id={`${set.id}-weight`}
                            type="number"
                            min="0"
                            max="9999.99"
                            step="0.01"
                            value={set.weight ?? ""}
                            onChange={(event) =>
                              updateSet(exerciseIndex, setIndex, "weight", event.target.value)
                            }
                          />
                        </Field>
                        <Field className="min-w-0">
                          <FieldLabel htmlFor={`${set.id}-reps`}>Повторення</FieldLabel>
                          <Input
                            id={`${set.id}-reps`}
                            type="number"
                            min="1"
                            max="999"
                            step="1"
                            value={set.reps ?? ""}
                            onChange={(event) =>
                              updateSet(exerciseIndex, setIndex, "reps", event.target.value)
                            }
                          />
                        </Field>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={exercise.sets.length === 1}
                      aria-label={`Видалити підхід ${setIndex + 1} вправи ${exercise.exercise.name}`}
                      onClick={() =>
                        updateSets(exerciseIndex, (sets) =>
                          sets
                            .filter((_, i) => i !== setIndex)
                            .map((item, i) => ({ ...item, setNumber: i + 1 }))
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    updateSets(exerciseIndex, (sets, item) => [
                      ...sets,
                      createWorkoutSet(item.trackingType, sets.length + 1, sets.at(-1)),
                    ])
                  }
                >
                  <Plus data-icon="inline-start" /> Додати підхід
                </Button>
              </CardContent>
            </Card>
          ))}
          <ExercisePicker
            trigger={
              <Button type="button" variant="outline" className="w-full">
                <Plus data-icon="inline-start" /> Додати вправу
              </Button>
            }
            exercises={catalog.data ?? []}
            isLoading={catalog.isPending}
            isUnavailable={catalog.isError && !catalog.data}
            onRetry={() => void catalog.refetch()}
            onSelect={(items) =>
              setExercises((current) => {
                const existing = new Set(current.map((entry) => entry.exercise.id));
                return [
                  ...current,
                  ...items
                    .filter((item) => !existing.has(item.id))
                    .map((item) => {
                      const exercise = exerciseForProgram(item);
                      const preferences = getExerciseLogPreferences(user?.id, item.id);
                      return updateProgramExerciseOptions(
                        exercise,
                        preferences.trackingType ?? exercise.trackingType,
                        preferences.restSeconds ?? exercise.restSeconds
                      );
                    }),
                ];
              })
            }
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={saving || !name.trim() || exercises.length === 0}
        >
          {saving ? "Зберігаю..." : "Зберегти програму"}
        </Button>
      </form>
      {saving && <p role="status">Зберігаємо програму...</p>}
      {optionsExercise && (
        <ProgramExerciseOptions
          key={optionsExercise.instanceId}
          exercise={optionsExercise}
          onClose={() => {
            setOptionsTarget(null);
            setOptionsDirty(false);
          }}
          onDirtyChange={setOptionsDirty}
          onSave={(trackingType, restSeconds) => {
            setExercises((current) =>
              current.map((item) =>
                item.instanceId === optionsExercise.instanceId
                  ? updateProgramExerciseOptions(item, trackingType, restSeconds)
                  : item
              )
            );
            setOptionsTarget(null);
            setOptionsDirty(false);
          }}
        />
      )}
      <ConfirmDialog
        open={closeRequested || blocker.status === "blocked"}
        onOpenChange={(open) => {
          if (!open) {
            setCloseRequested(false);
            if (blocker.status === "blocked") blocker.reset();
          }
        }}
        title="Вийти без збереження?"
        description="Зміни в шаблоні буде втрачено."
        confirmText="Вийти"
        isDestructive
        isLoading={saving}
        onConfirm={() => {
          if (blocker.status === "blocked") blocker.proceed();
          else closeEditor();
        }}
      />
    </div>
  );
}

function ProgramExerciseOptions({
  exercise,
  onClose,
  onDirtyChange,
  onSave,
}: {
  exercise: WorkoutExercise;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onSave: (trackingType: ExerciseTrackingType, restSeconds: number) => void;
}) {
  const [trackingType, setTrackingType] = useState(exercise.trackingType);
  const [restSeconds, setRestSeconds] = useState(exercise.restSeconds);
  const trackingOptions = TRACKING_TYPES.filter(
    (item) =>
      item.value === "duration" ||
      item.value === exercise.trackingType ||
      item.value === (exercise.exercise.equipment === "bodyweight" ? "bodyweight" : "weight-reps")
  );
  const restOptions = [...new Set([0, 60, 90, 120, 180, 300, 600, exercise.restSeconds])]
    .sort((left, right) => left - right)
    .map((seconds) => ({
      value: seconds,
      label: seconds === 0 ? "Без автоматичного таймера" : formatRestTime(seconds),
    }));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Налаштування вправи</DialogTitle>
          <DialogDescription>{exercise.exercise.name}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(trackingType, restSeconds);
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`program-tracking-${exercise.instanceId}`}>
                Формат запису
              </FieldLabel>
              <Select
                items={trackingOptions}
                value={trackingType}
                onValueChange={(value) => {
                  if (value) {
                    setTrackingType(value);
                    onDirtyChange(
                      value !== exercise.trackingType || restSeconds !== exercise.restSeconds
                    );
                  }
                }}
              >
                <SelectTrigger id={`program-tracking-${exercise.instanceId}`}>
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
            </Field>
            <Field>
              <FieldLabel htmlFor={`program-rest-${exercise.instanceId}`}>
                Відпочинок після підходу
              </FieldLabel>
              <Select
                items={restOptions}
                value={restSeconds}
                onValueChange={(value) => {
                  if (value != null) {
                    setRestSeconds(value);
                    onDirtyChange(
                      trackingType !== exercise.trackingType || value !== exercise.restSeconds
                    );
                  }
                }}
              >
                <SelectTrigger id={`program-rest-${exercise.instanceId}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {restOptions.map((item) => (
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
          <Button type="submit">Зберегти налаштування</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
