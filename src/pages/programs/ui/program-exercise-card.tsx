import { useId, useState } from "react";

import {
  ExerciseCardActions,
  ExerciseCardHeading,
  usesDoubleWeight,
  type WorkoutExercise,
} from "@/entities/workout";
import { cn } from "@/shared/lib";
import { Card, CardContent } from "@/shared/ui";

export function ProgramExerciseCard({
  exercise,
  onOpenDetails,
}: {
  exercise: WorkoutExercise;
  onOpenDetails: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const timed = exercise.trackingType === "duration";
  const grid = timed
    ? "grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-2"
    : "grid grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1fr)] items-start gap-2";
  const cell =
    "bg-background/60 border-border flex h-11 min-w-0 items-center justify-center rounded-lg border px-2 text-center text-sm font-medium tabular-nums";
  const weightLabel =
    exercise.trackingType === "bodyweight"
      ? "Дод. кг"
      : usesDoubleWeight(exercise.exercise)
        ? "кг / гантель"
        : "кг";

  return (
    <Card size="sm" className="gap-0 rounded-2xl data-[size=sm]:gap-0 data-[size=sm]:py-2">
      <ExerciseCardHeading
        name={exercise.exercise.name}
        timed={timed}
        expanded={expanded}
        panelId={panelId}
        sets={exercise.sets.map(() => false)}
        planned
        onOpenDetails={onOpenDetails}
        onToggle={() => setExpanded((value) => !value)}
        actions={
          <ExerciseCardActions
            exerciseId={exercise.exercise.id}
            exerciseName={exercise.exercise.name}
          />
        }
      />
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-250 ease-out motion-reduce:transition-none",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
        aria-hidden={!expanded}
        inert={!expanded}
      >
        <div className="min-h-0 overflow-hidden">
          <CardContent className="flex flex-col gap-1 pt-3 group-data-[size=sm]/card:px-3">
            <div
              className={cn(grid, "text-muted-foreground px-1 text-center text-xs font-medium")}
              aria-hidden="true"
            >
              <span>Сет</span>
              <span>{timed ? "Час, с" : weightLabel}</span>
              {!timed && <span>Повт.</span>}
            </div>
            {exercise.sets.map((set, index) => (
              <div key={set.id} className="bg-accent/50 rounded-xl px-1 py-2">
                <div className={grid}>
                  <span className={cell} aria-label={`Підхід ${index + 1}`}>
                    {index + 1}
                  </span>
                  {timed ? (
                    <span
                      className={cell}
                      aria-label={`Тривалість: ${set.durationS ?? "не вказано"} секунд`}
                    >
                      {set.durationS ?? "—"}
                    </span>
                  ) : (
                    <>
                      <span
                        className={cell}
                        aria-label={`${weightLabel}: ${set.weight == null ? "не вказано" : new Intl.NumberFormat("uk-UA").format(set.weight)}`}
                      >
                        {set.weight == null
                          ? "—"
                          : new Intl.NumberFormat("uk-UA").format(set.weight)}
                      </span>
                      <span className={cell} aria-label={`Повторення: ${set.reps ?? "не вказано"}`}>
                        {set.reps ?? "—"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
