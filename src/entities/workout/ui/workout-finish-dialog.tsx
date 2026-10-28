import { Check } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from "@/shared/ui";

import { buildWorkoutName } from "../api/workout-rpc";
import { getWorkoutVolume } from "../model/metrics";
import type { WorkoutExercise } from "../model/types";
import { getWorkoutReview } from "../model/workout-logging";

interface WorkoutFinishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: WorkoutExercise[];
  saving: boolean;
  onSave: (details: { name: string; notes: string }) => void;
  onReturn: () => void;
  initialName?: string;
  initialNotes?: string | null;
  editing?: boolean;
  onDetailsChange?: (details: { name: string; notes: string }) => void;
}

export function WorkoutFinishDialog({
  open,
  onOpenChange,
  exercises,
  saving,
  onSave,
  onReturn,
  initialName,
  initialNotes,
  editing = false,
  onDetailsChange,
}: WorkoutFinishDialogProps) {
  const [name, setName] = useState(initialName ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const review = getWorkoutReview(exercises);
  const canSave = review.completedSets > 0 && review.invalidSets.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!saving) onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        showCloseButton={!saving}
      >
        <DialogHeader>
          <DialogTitle>{editing ? "Зберегти зміни?" : "Завершити тренування?"}</DialogTitle>
          <DialogDescription>Перевір, що потрапить до історії.</DialogDescription>
        </DialogHeader>
        <dl className="bg-muted/50 grid grid-cols-3 gap-3 rounded-2xl p-4 text-center">
          <div>
            <dt className="text-muted-foreground text-xs">Вправи</dt>
            <dd className="mt-1 text-xl font-medium tabular-nums">{review.completedExercises}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Підходи</dt>
            <dd className="mt-1 text-xl font-medium tabular-nums">{review.completedSets}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Об’єм, кг</dt>
            <dd className="mt-1 text-xl font-medium tabular-nums">
              {new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(
                getWorkoutVolume(exercises)
              )}
            </dd>
          </div>
        </dl>
        {review.unfinishedSets > 0 && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Незавершених підходів:{" "}
            <strong className="text-foreground font-medium">{review.unfinishedSets}</strong>. Вони
            не потраплять до історії. Можеш повернутися до запису або зберегти лише виконане.
          </p>
        )}
        {review.invalidSets.length > 0 && (
          <div role="alert" className="text-destructive text-sm leading-relaxed">
            <p>Виправ дані у виконаних підходах:</p>
            <ul className="mt-2 list-inside list-disc">
              {review.invalidSets.map((issue) => (
                <li key={issue.setId}>{issue.label}</li>
              ))}
            </ul>
          </div>
        )}
        {review.completedSets === 0 && (
          <p className="text-muted-foreground text-sm">
            Спочатку познач хоча б один підхід виконаним.
          </p>
        )}
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave && !saving) onSave({ name, notes });
          }}
        >
          <FieldGroup>
            <Field data-disabled={saving}>
              <FieldLabel htmlFor="workout-name">Назва · необов’язково</FieldLabel>
              <Input
                id="workout-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  onDetailsChange?.({ name: event.target.value, notes });
                }}
                placeholder={buildWorkoutName(exercises)}
                maxLength={200}
                disabled={saving}
              />
            </Field>
            <Field data-disabled={saving}>
              <FieldLabel htmlFor="workout-notes">Нотатка · необов’язково</FieldLabel>
              <Textarea
                id="workout-notes"
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  onDetailsChange?.({ name, notes: event.target.value });
                }}
                placeholder="Як пройшло тренування?"
                maxLength={4000}
                rows={2}
                disabled={saving}
              />
            </Field>
          </FieldGroup>
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={!canSave || saving}>
              <Check data-icon="inline-start" />
              {saving
                ? "Зберігаю…"
                : review.unfinishedSets > 0
                  ? "Зберегти виконане"
                  : editing
                    ? "Зберегти зміни"
                    : "Зберегти тренування"}
            </Button>
            <Button type="button" variant="outline" disabled={saving} onClick={onReturn}>
              Повернутися до {editing ? "редагування" : "тренування"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
