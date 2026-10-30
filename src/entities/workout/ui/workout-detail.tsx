import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { type ReactNode, useId, useState } from "react";

import { ExerciseDetailsById } from "@/entities/exercise/@x/workout";
import { ExerciseCardActions } from "@/entities/workout";
import { type ExerciseData, type SetData, type WorkoutWithSets } from "@/entities/workout";
import { useDeleteWorkout } from "@/entities/workout";
import { isWorkoutEditable } from "@/entities/workout";
import { getSetVolume, usesDoubleWeight } from "@/entities/workout";
import { calc1RM, cn } from "@/shared/lib";
import { Button } from "@/shared/ui";
import { Card, CardContent } from "@/shared/ui";
import { ConfirmDialog } from "@/shared/ui";

import { getExerciseTrackingType } from "../model/workout-logging";
import { ExerciseCardHeading } from "./exercise-card-heading";
import { SET_ROW_GRID, TIMED_SET_ROW_GRID } from "./set-row";

interface WorkoutDetailProps {
  workout: WorkoutWithSets;
  exercises: ExerciseData[];
  onBack?: () => void;
  returnSearch?: { from?: string };
  children?: ReactNode;
}

export function WorkoutDetail({
  workout,
  exercises,
  onBack,
  returnSearch,
  children,
}: WorkoutDetailProps) {
  const navigate = useNavigate();
  const deleteWorkoutMutation = useDeleteWorkout();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState<ExerciseData | null>(null);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(() => new Set());
  const panelIdPrefix = useId();
  const canEdit = isWorkoutEditable(workout.started_at);

  // Групуємо сети по вправах
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
  const grouped = new Map<string, SetData[]>();
  for (const set of workout.sets) {
    const existing = grouped.get(set.exercise_id) ?? [];
    existing.push(set);
    grouped.set(set.exercise_id, existing);
  }

  // Статистика
  const totalSets = workout.sets.length;
  const totalVolume = workout.sets.reduce((acc, set) => {
    const exercise = exerciseMap.get(set.exercise_id);
    return acc + getSetVolume(set, exercise);
  }, 0);

  const duration =
    workout.started_at && workout.finished_at
      ? Math.round(
          (new Date(workout.finished_at).getTime() - new Date(workout.started_at).getTime()) / 60000
        )
      : null;

  const handleDelete = () => {
    deleteWorkoutMutation.mutate(workout.id, {
      onSuccess: () => (onBack ? onBack() : navigate({ to: "/dashboard" })),
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-5 p-4">
      <header className="border-border/30 bg-background/50 before:bg-background sticky top-[env(safe-area-inset-top,0px)] z-30 -mx-4 -mt-4 grid grid-cols-[5.5rem_minmax(0,1fr)_5.5rem] items-center border-b px-4 pt-4 pb-3 backdrop-blur-md before:pointer-events-none before:absolute before:inset-x-0 before:-top-[env(safe-area-inset-top,0px)] before:h-[env(safe-area-inset-top,0px)] before:content-['']">
        <Button
          variant="secondary"
          size="icon-lg"
          className="rounded-full"
          aria-label={onBack ? "Повернутися до календаря" : "На головну"}
          onClick={() => (onBack ? onBack() : navigate({ to: "/dashboard" }))}
        >
          <ChevronLeft />
        </Button>
        <span className="text-center text-lg font-medium">Тренування</span>
        {canEdit && (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              render={
                <Link to="/workout/$id/edit" params={{ id: workout.id }} search={returnSearch} />
              }
              nativeButton={false}
              aria-label="Редагувати тренування"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              aria-label="Видалити тренування"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </header>

      {detailsTarget && (
        <ExerciseDetailsById exercise={detailsTarget} onClose={() => setDetailsTarget(null)} />
      )}

      {/* Назва та дата */}
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          {workout.started_at &&
            new Date(workout.started_at).toLocaleDateString("uk-UA", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
        </p>
        <h1 className="text-lg leading-tight font-bold tracking-tight">
          {workout.name ?? "Тренування"}
        </h1>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-3">
        {duration !== null && (
          <Card className="p-0">
            <CardContent className="flex flex-col items-center px-3 py-4">
              <span className="text-xl font-bold tabular-nums">{duration}</span>
              <span className="text-muted-foreground text-xs">хв</span>
            </CardContent>
          </Card>
        )}
        <Card className="p-0">
          <CardContent className="flex flex-col items-center px-3 py-4">
            <span className="text-xl font-bold tabular-nums">{totalSets}</span>
            <span className="text-muted-foreground text-xs">підходів</span>
          </CardContent>
        </Card>
        <Card className="p-0">
          <CardContent className="flex flex-col items-center px-3 py-4">
            <span className="text-xl font-bold tabular-nums">
              {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}` : Math.round(totalVolume)}
            </span>
            <span className="text-muted-foreground text-xs">{totalVolume > 1000 ? "т" : "кг"}</span>
          </CardContent>
        </Card>
      </div>

      {/* Вправи з підходами */}
      <div className="flex flex-col gap-3">
        {Array.from(grouped.entries()).map(([exerciseId, sets]) => {
          const exercise = exerciseMap.get(exerciseId);
          const exerciseName = exercise?.name ?? "Невідома вправа";
          const isExpanded = expandedExercises.has(exerciseId);
          const panelId = `${panelIdPrefix}-${exerciseId}`;
          const sortedSets = [...sets].sort((a, b) => a.set_number - b.set_number);
          const trackingType = getExerciseTrackingType(
            { equipment: exercise?.equipment ?? null, catalog_key: null },
            sortedSets.map((set) => ({ durationS: set.duration_s }))
          );
          const bestSet = sortedSets.reduce(
            (best, s) => {
              const rm = s.weight && s.reps ? calc1RM(s.weight, s.reps) : 0;
              return rm > (best.rm ?? 0) ? { set: s, rm } : best;
            },
            { set: null as SetData | null, rm: 0 }
          );

          return (
            <Card
              key={exerciseId}
              size="sm"
              className="gap-0 rounded-2xl data-[size=sm]:gap-0 data-[size=sm]:py-2"
            >
              <ExerciseCardHeading
                name={exerciseName}
                timed={trackingType === "duration"}
                expanded={isExpanded}
                panelId={panelId}
                sets={sets.map(() => true)}
                onOpenDetails={() =>
                  setDetailsTarget(
                    exercise ?? {
                      id: exerciseId,
                      name: exerciseName,
                      equipment: null,
                      muscle_group: null,
                    }
                  )
                }
                onToggle={() =>
                  setExpandedExercises((previous) => {
                    const next = new Set(previous);
                    if (next.has(exerciseId)) next.delete(exerciseId);
                    else next.add(exerciseId);
                    return next;
                  })
                }
                actions={
                  <ExerciseCardActions exerciseId={exerciseId} exerciseName={exerciseName} />
                }
              />
              <div
                id={panelId}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-250 ease-out motion-reduce:transition-none",
                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
                aria-hidden={!isExpanded}
                inert={!isExpanded}
              >
                <div className="min-h-0 overflow-hidden">
                  <CardContent className="flex flex-col gap-1 pt-3 group-data-[size=sm]/card:px-3">
                    <div
                      className={cn(
                        trackingType === "duration" ? TIMED_SET_ROW_GRID : SET_ROW_GRID,
                        "text-muted-foreground px-1 text-center text-xs font-medium"
                      )}
                      aria-hidden="true"
                    >
                      <span>Сет</span>
                      <span>
                        {trackingType === "duration"
                          ? "Час, с"
                          : trackingType === "bodyweight"
                            ? "Дод. кг"
                            : usesDoubleWeight(exercise)
                              ? "кг / гантель"
                              : "кг"}
                      </span>
                      {trackingType !== "duration" && <span>Повт.</span>}
                      <span className="sr-only">Виконано</span>
                    </div>

                    {sortedSets.map((set) => {
                      const estimated1RM =
                        trackingType === "weight-reps" && set.weight && set.reps
                          ? Math.round(calc1RM(set.weight, set.reps))
                          : null;
                      const isBest = bestSet.set?.id === set.id && sortedSets.length > 1;
                      const weight =
                        set.weight == null
                          ? "—"
                          : new Intl.NumberFormat("uk-UA").format(set.weight);
                      const cell =
                        "bg-background/60 border-border flex h-11 min-w-0 items-center justify-center rounded-lg border px-2 text-center text-sm font-medium tabular-nums";

                      return (
                        <div key={set.id} className="bg-accent/50 rounded-xl px-1 py-2">
                          <div
                            className={
                              trackingType === "duration" ? TIMED_SET_ROW_GRID : SET_ROW_GRID
                            }
                          >
                            <span className={cell} aria-label={`Підхід ${set.set_number}`}>
                              {set.set_number}
                            </span>
                            {trackingType === "duration" ? (
                              <span
                                className={cell}
                                aria-label={`Тривалість: ${set.duration_s ?? "немає даних"} секунд`}
                              >
                                {set.duration_s ?? "—"}
                              </span>
                            ) : (
                              <>
                                <span className={cell} aria-label={`Вага: ${weight} кг`}>
                                  {weight}
                                </span>
                                <span
                                  className={cell}
                                  aria-label={`Повторення: ${set.reps ?? "немає даних"}`}
                                >
                                  {set.reps ?? "—"}
                                </span>
                              </>
                            )}
                            <span
                              className="bg-foreground text-background flex size-11 items-center justify-center rounded-lg"
                              role="img"
                              aria-label="Виконано"
                            >
                              <Check className="size-4" aria-hidden="true" />
                            </span>
                          </div>
                          {(isBest || set.rpe != null || estimated1RM != null) && (
                            <p className="text-muted-foreground px-1 pt-1.5 text-xs leading-relaxed">
                              {[
                                isBest ? "Найкращий підхід" : null,
                                set.rpe != null
                                  ? `RPE ${new Intl.NumberFormat("uk-UA").format(set.rpe)}`
                                  : null,
                                estimated1RM != null ? `Оц. 1ПМ: ${estimated1RM} кг` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                          {set.notes && (
                            <p className="text-muted-foreground px-1 pt-1 text-xs leading-relaxed whitespace-pre-wrap">
                              {set.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Нотатки */}
      {workout.notes && (
        <Card size="sm" className="py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-sm">{workout.notes}</p>
          </CardContent>
        </Card>
      )}

      {children}

      {/* Діалог видалення */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Видалити тренування?"
        description="Це видалить тренування та всі підходи. Цю дію неможливо скасувати."
        confirmText="Видалити"
        isDestructive
        isLoading={deleteWorkoutMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
