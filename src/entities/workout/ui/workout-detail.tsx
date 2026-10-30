import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
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

import { formatSetSummary, getExerciseTrackingType } from "../model/workout-logging";
import { ExerciseCardHeading } from "./exercise-card-heading";

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
  const setGridClassName = "grid grid-cols-[1.5rem_minmax(0,1fr)_2.5rem_3.5rem] items-center gap-2";

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
    <div className="flex flex-1 flex-col gap-6 p-4">
      {/* Навігація */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={onBack ? "Повернутися до календаря" : "На головну"}
            onClick={() => (onBack ? onBack() : navigate({ to: "/dashboard" }))}
          >
            <ChevronLeft />
          </Button>
          <span className="text-2xl font-bold">Тренування</span>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1">
            <Link to="/workout/$id/edit" params={{ id: workout.id }} search={returnSearch}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive h-8 w-8"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

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
              actions={<ExerciseCardActions exerciseId={exerciseId} exerciseName={exerciseName} />}
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
                  {/* Заголовки */}
                  <div
                    className={`${setGridClassName} text-muted-foreground px-2 pb-1 text-xs font-medium`}
                  >
                    <span className="text-center">Сет</span>
                    <span>
                      {trackingType === "duration"
                        ? "Тривалість"
                        : usesDoubleWeight(exercise)
                          ? "кг / гантель × повт."
                          : "Результат"}
                    </span>
                    <span className="text-center" title="Зусилля RPE від 6 до 10">
                      RPE
                    </span>
                    <span className="text-center">
                      {trackingType === "weight-reps" ? "Оц. 1ПМ" : ""}
                    </span>
                  </div>

                  {sortedSets.map((set) => {
                    const estimated1RM =
                      trackingType === "weight-reps" && set.weight && set.reps
                        ? Math.round(calc1RM(set.weight, set.reps))
                        : null;
                    const isBest = bestSet.set?.id === set.id && sortedSets.length > 1;

                    return (
                      <div
                        key={set.id}
                        className={`rounded-lg px-2 py-1.5 ${isBest ? "bg-accent/50" : ""}`}
                      >
                        <div className={setGridClassName}>
                          <span className="text-muted-foreground text-center text-sm">
                            {set.set_number}
                          </span>
                          <span className="text-sm font-medium tabular-nums">
                            {formatSetSummary(
                              { weight: set.weight, reps: set.reps, durationS: set.duration_s },
                              trackingType
                            ) ?? "—"}
                          </span>
                          <span className="text-muted-foreground text-center text-sm">
                            {set.rpe ?? "—"}
                          </span>
                          <span className="text-muted-foreground text-center text-sm">
                            {trackingType === "weight-reps" ? (estimated1RM ?? "—") : ""}
                          </span>
                        </div>
                        {set.notes && (
                          <p className="text-muted-foreground pt-1 pl-8 text-xs leading-relaxed whitespace-pre-wrap">
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
