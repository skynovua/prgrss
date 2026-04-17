import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { ArrowLeft, Trash2, Clock, Dumbbell, TrendingUp, Pencil } from "lucide-react";
import {
  MUSCLE_GROUP_LABELS,
  type MuscleGroup,
  type SetData,
  type ExerciseData,
  type WorkoutWithSets,
} from "@/src/lib/types";
import { useDeleteWorkout } from "@/src/lib/hooks/use-workouts";
import { isWorkoutEditable } from "@/src/lib/api/workouts";
import { calc1RM } from "@/src/lib/utils/calc";

interface WorkoutDetailProps {
  workout: WorkoutWithSets;
  exercises: ExerciseData[];
}

export function WorkoutDetail({ workout, exercises }: WorkoutDetailProps) {
  const navigate = useNavigate();
  const deleteWorkoutMutation = useDeleteWorkout();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
  const totalVolume = workout.sets.reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0);

  const duration =
    workout.started_at && workout.finished_at
      ? Math.round(
          (new Date(workout.finished_at).getTime() - new Date(workout.started_at).getTime()) / 60000
        )
      : null;

  const handleDelete = () => {
    deleteWorkoutMutation.mutate(workout.id, {
      onSuccess: () => navigate({ to: "/dashboard" }),
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Хедер */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{workout.name ?? "Тренування"}</h1>
          <p className="text-muted-foreground text-sm">
            {workout.started_at &&
              new Date(workout.started_at).toLocaleDateString("uk-UA", {
                weekday: "short",
                day: "numeric",
                month: "long",
              })}
          </p>
        </div>
        {canEdit && (
          <Link to="/workout/$id/edit" params={{ id: workout.id }}>
            <Button variant="ghost" size="icon">
              <Pencil className="h-5 w-5" />
            </Button>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-3">
        {duration !== null && (
          <Card>
            <CardContent className="flex flex-col items-center p-3">
              <Clock className="text-muted-foreground mb-1 h-5 w-5" />
              <span className="text-lg font-bold">{duration}</span>
              <span className="text-muted-foreground text-xs">хв</span>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <Dumbbell className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-lg font-bold">{totalSets}</span>
            <span className="text-muted-foreground text-xs">підходів</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <TrendingUp className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-lg font-bold">
              {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}т` : Math.round(totalVolume)}
            </span>
            <span className="text-muted-foreground text-xs">кг</span>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Вправи з підходами */}
      {Array.from(grouped.entries()).map(([exerciseId, sets]) => {
        const exercise = exerciseMap.get(exerciseId);
        const sortedSets = [...sets].sort((a, b) => a.set_number - b.set_number);
        const bestSet = sortedSets.reduce(
          (best, s) => {
            const rm = s.weight && s.reps ? calc1RM(s.weight, s.reps) : 0;
            return rm > (best.rm ?? 0) ? { set: s, rm } : best;
          },
          { set: null as SetData | null, rm: 0 }
        );

        return (
          <Card key={exerciseId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{exercise?.name ?? "Невідома вправа"}</CardTitle>
              {exercise?.muscle_group && (
                <p className="text-muted-foreground text-xs">
                  {MUSCLE_GROUP_LABELS[exercise.muscle_group as MuscleGroup]}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {/* Заголовки */}
              <div className="text-muted-foreground flex items-center gap-2 px-1 pb-2 text-xs font-medium">
                <span className="w-8 text-center">#</span>
                <span className="w-16 text-center">Вага</span>
                <span className="w-12 text-center">Повт</span>
                <span className="w-12 text-center" title="Складність підходу від 1 до 10">
                  Зусилля
                </span>
                <span className="flex-1 text-center">Оц. 1RM</span>
              </div>

              {sortedSets.map((set) => {
                const estimated1RM =
                  set.weight && set.reps ? Math.round(calc1RM(set.weight, set.reps)) : null;
                const isBest = bestSet.set?.id === set.id && sortedSets.length > 1;

                return (
                  <div
                    key={set.id}
                    className={`flex items-center gap-2 rounded-lg px-1 py-1.5 ${
                      isBest ? "bg-accent/50" : ""
                    }`}
                  >
                    <span className="text-muted-foreground w-8 text-center text-sm">
                      {set.set_number}
                    </span>
                    <span className="w-16 text-center text-sm font-medium">
                      {set.weight ?? "—"}
                    </span>
                    <span className="w-12 text-center text-sm">{set.reps ?? "—"}</span>
                    <span className="text-muted-foreground w-12 text-center text-sm">
                      {set.rpe ?? "—"}
                    </span>
                    <span className="text-muted-foreground flex-1 text-center text-sm">
                      {estimated1RM ?? "—"}
                    </span>
                  </div>
                );
              })}

              {/* Best set підсвічення */}
              {bestSet.rm > 0 && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Найкращий підхід: оц. 1RM ≈ {Math.round(bestSet.rm)} кг
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Нотатки */}
      {workout.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">{workout.notes}</p>
          </CardContent>
        </Card>
      )}

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
