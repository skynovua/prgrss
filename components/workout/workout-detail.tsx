"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowLeft, Trash2, Clock, Dumbbell, TrendingUp } from "lucide-react";
import Link from "next/link";
import {
  MUSCLE_GROUP_LABELS,
  type MuscleGroup,
  type SetData,
  type ExerciseData,
  type WorkoutWithSets,
} from "@/lib/types";
import { deleteWorkout, deleteSetFromWorkout } from "@/lib/actions/workout";
import { calc1RM } from "@/lib/utils/calc";
import { toast } from "sonner";

interface WorkoutDetailProps {
  workout: WorkoutWithSets;
  exercises: ExerciseData[];
}

export function WorkoutDetail({ workout, exercises }: WorkoutDetailProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteWorkout(workout.id);
    } catch (err) {
      toast.error("Не вдалося видалити тренування", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
      setDeleting(false);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    try {
      await deleteSetFromWorkout(setId, workout.id);
      router.refresh();
    } catch (err) {
      toast.error("Не вдалося видалити підхід", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Хедер */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
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
              <Clock className="text-muted-foreground mb-1 h-4 w-4" />
              <span className="text-lg font-bold">{duration}</span>
              <span className="text-muted-foreground text-xs">хв</span>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <Dumbbell className="text-muted-foreground mb-1 h-4 w-4" />
            <span className="text-lg font-bold">{totalSets}</span>
            <span className="text-muted-foreground text-xs">підходів</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <TrendingUp className="text-muted-foreground mb-1 h-4 w-4" />
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
                <span className="w-12 text-center">RPE</span>
                <span className="flex-1 text-center">1RM</span>
                <span className="w-8" />
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-7 w-7"
                      onClick={() => handleDeleteSet(set.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}

              {/* Best set підсвічення */}
              {bestSet.rm > 0 && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Найкращий підхід: est. 1RM ≈ {Math.round(bestSet.rm)} кг
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
        isLoading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
