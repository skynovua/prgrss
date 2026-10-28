import { Check, MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/shared/lib";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from "@/shared/ui";

import type { ExerciseTrackingType, LocalSet, PreviousSetData } from "../model/types";
import {
  formatSetSummary,
  getSetErrors,
  parseWorkoutNumber,
  type SetField,
} from "../model/workout-logging";

export const SET_ROW_GRID =
  "grid grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-start gap-2";
export const TIMED_SET_ROW_GRID =
  "grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-start gap-2";

interface SetRowProps {
  set: LocalSet;
  trackingType: ExerciseTrackingType;
  exerciseName: string;
  previousSet?: PreviousSetData;
  onUpdate: (set: LocalSet) => void;
  onComplete: (set: LocalSet) => void;
  onDelete: (id: string) => void;
}

function SetDetails({ set, onSave }: { set: LocalSet; onSave: (set: LocalSet) => void }) {
  const [rpe, setRpe] = useState(set.rpe == null ? "" : String(set.rpe));
  const [notes, setNotes] = useState(set.notes ?? "");
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const value = parseWorkoutNumber(rpe);
        if (
          rpe.trim() &&
          (value == null || value < 6 || value > 10 || !Number.isInteger(value * 2))
        ) {
          setError("Укажи RPE від 6 до 10 із кроком 0,5 або залиш поле порожнім.");
          inputRef.current?.focus();
          return;
        }
        onSave({ ...set, rpe: value, notes: notes.trim() || null });
      }}
    >
      <FieldGroup>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor={`rpe-${set.id}`}>Зусилля RPE · необов’язково</FieldLabel>
          <Input
            ref={inputRef}
            id={`rpe-${set.id}`}
            inputMode="decimal"
            placeholder="6–10"
            value={rpe}
            onChange={(event) => {
              setRpe(event.target.value);
              setError(undefined);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? `rpe-error-${set.id}` : `rpe-help-${set.id}`}
          />
          {error ? (
            <FieldError id={`rpe-error-${set.id}`}>{error}</FieldError>
          ) : (
            <p id={`rpe-help-${set.id}`} className="text-muted-foreground text-xs leading-relaxed">
              6 — легко, 8 — ще приблизно 2 повторення в запасі, 10 — максимальне зусилля.
            </p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor={`notes-${set.id}`}>Нотатка до підходу</FieldLabel>
          <Textarea
            id={`notes-${set.id}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={2000}
            placeholder="Техніка, налаштування тренажера, відчуття…"
            rows={3}
          />
        </Field>
      </FieldGroup>
      <Button type="submit">Застосувати</Button>
    </form>
  );
}

export function SetRow({
  set,
  trackingType,
  exerciseName,
  previousSet,
  onUpdate,
  onComplete,
  onDelete,
}: SetRowProps) {
  const [attempted, setAttempted] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const inputRefs = useRef<Partial<Record<SetField, HTMLInputElement | null>>>({});
  const errors = getSetErrors(set, trackingType);
  const showErrors = attempted || set.completed;
  const timed = trackingType === "duration";
  const previousSummary = previousSet ? formatSetSummary(previousSet, trackingType) : null;

  const complete = () => {
    if (set.completed) {
      onComplete({ ...set, completed: false });
      return;
    }
    setAttempted(true);
    const firstError = Object.keys(errors)[0] as SetField | undefined;
    if (firstError) {
      if (firstError === "rpe") setDetailsOpen(true);
      else inputRefs.current[firstError]?.focus();
      return;
    }
    onComplete({ ...set, completed: true });
  };

  const numberField = (
    field: "weight" | "reps" | "durationS",
    label: string,
    placeholder: string
  ) => {
    const id = `set-${set.id}-${field}`;
    const error = showErrors ? errors[field] : undefined;
    return (
      <Field className="min-w-0 gap-1.5" data-invalid={!!error}>
        <FieldLabel htmlFor={id} className="sr-only">
          {label} · {exerciseName} · підхід {set.setNumber}
        </FieldLabel>
        <Input
          ref={(element) => {
            inputRefs.current[field] = element;
          }}
          id={id}
          type="text"
          inputMode={field === "weight" ? "decimal" : "numeric"}
          enterKeyHint={field === "weight" ? "next" : "done"}
          defaultValue={set.inputValues?.[field] ?? set[field] ?? ""}
          placeholder={placeholder}
          className="px-2 text-center font-medium tabular-nums"
          maxLength={10}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) =>
            onUpdate({
              ...set,
              [field]: parseWorkoutNumber(event.target.value),
              inputValues: { ...set.inputValues, [field]: event.target.value },
            })
          }
          onFocus={(event) => event.target.select()}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            if (field === "weight") inputRefs.current.reps?.focus();
            else if (!set.completed) complete();
            else event.currentTarget.blur();
          }}
        />
      </Field>
    );
  };

  return (
    <div
      id={`workout-set-${set.id}`}
      className={cn("rounded-xl px-1 py-2", set.completed && "bg-accent/50")}
    >
      <FieldGroup className={timed ? TIMED_SET_ROW_GRID : SET_ROW_GRID}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={`Дії для підходу ${set.setNumber} · ${exerciseName}`}
              />
            }
          >
            <span className="tabular-nums">{set.setNumber}</span>
            <MoreHorizontal className="text-muted-foreground size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setDetailsOpen(true)}>
                <PencilLine />
                Зусилля й нотатка
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(set.id)}>
                <Trash2 />
                Видалити підхід
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {timed ? (
          numberField("durationS", "Тривалість, секунди", "с")
        ) : (
          <>
            {numberField(
              "weight",
              trackingType === "bodyweight" ? "Додаткова вага, кг, необов’язково" : "Вага, кг",
              trackingType === "bodyweight" ? "—" : "кг"
            )}
            {numberField("reps", "Повторення", "повт.")}
          </>
        )}
        <Button
          type="button"
          variant={set.completed ? "default" : "outline"}
          size="icon"
          className="size-11"
          aria-label={`${set.completed ? "Скасувати виконання підходу" : "Завершити підхід"} ${set.setNumber} · ${exerciseName}`}
          aria-pressed={set.completed}
          onClick={complete}
        >
          <Check />
        </Button>
      </FieldGroup>
      {showErrors &&
        (["weight", "reps", "durationS"] as const).map(
          (field) =>
            errors[field] && (
              <FieldError
                key={field}
                id={`set-${set.id}-${field}-error`}
                className="px-1 pt-2 text-xs leading-relaxed"
              >
                {errors[field]}
              </FieldError>
            )
        )}
      {previousSummary && !set.completed && (
        <p className="text-muted-foreground pt-1.5 pr-12 pl-14 text-xs leading-relaxed">
          Минулого разу: {previousSummary}
        </p>
      )}
      {(set.rpe != null || set.notes || (showErrors && errors.rpe)) && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 ml-12 max-w-[calc(100%-3rem)] justify-start"
          onClick={() => setDetailsOpen(true)}
        >
          <PencilLine data-icon="inline-start" />
          <span className={cn("truncate", showErrors && errors.rpe && "text-destructive")}>
            {errors.rpe && showErrors
              ? "Перевір оцінку зусилля"
              : [set.rpe != null ? `RPE ${set.rpe}` : null, set.notes].filter(Boolean).join(" · ")}
          </span>
        </Button>
      )}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        {detailsOpen && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Підхід {set.setNumber}</DialogTitle>
              <DialogDescription>{exerciseName}</DialogDescription>
            </DialogHeader>
            <SetDetails
              set={set}
              onSave={(updated) => {
                onUpdate(updated);
                setDetailsOpen(false);
              }}
            />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
