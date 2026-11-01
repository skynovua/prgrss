import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { useExercises } from "@/entities/exercise";
import {
  createWorkoutSet,
  ExercisePicker,
  type LocalSet,
  type WorkoutExercise,
} from "@/entities/workout";
import { exerciseForProgram } from "@/features/program";
import { Button, Card, CardContent, Field, FieldLabel, Input, PageHeader } from "@/shared/ui";

interface ProgramEditorProps {
  initialName?: string;
  initialExercises?: WorkoutExercise[];
  saving: boolean;
  onSave: (name: string, exercises: WorkoutExercise[]) => void;
  onBack: () => void;
}

export function ProgramEditor({
  initialName = "",
  initialExercises = [],
  saving,
  onSave,
  onBack,
}: ProgramEditorProps) {
  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState(initialExercises);
  const catalog = useExercises();
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
          onClick={onBack}
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
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim() && exercises.length) onSave(name, exercises);
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
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold">Вправи та підходи</h2>
            <p className="text-muted-foreground text-sm">
              Вага й повторення необов’язкові — їх можна заповнити під час тренування.
            </p>
          </div>
          {exercises.map((exercise, exerciseIndex) => (
            <Card key={exercise.instanceId} size="sm">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <h3 className="min-w-0 flex-1 text-sm font-semibold">{exercise.exercise.name}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Видалити вправу ${exercise.exercise.name} з програми`}
                    onClick={() =>
                      setExercises((current) => current.filter((_, i) => i !== exerciseIndex))
                    }
                  >
                    <Trash2 />
                  </Button>
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
                  ...items.filter((item) => !existing.has(item.id)).map(exerciseForProgram),
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
    </div>
  );
}
