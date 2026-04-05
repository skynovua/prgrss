"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Trash2,
  Clock,
  Dumbbell,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  MUSCLE_GROUP_LABELS,
  type MuscleGroup,
} from "@/lib/types";
import { deleteWorkout, deleteSetFromWorkout } from "@/lib/actions/workout";
import { calc1RM } from "@/lib/utils/calc";

interface SetData {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  duration_s: number | null;
  exercise_id: string;
}

interface ExerciseData {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
}

interface WorkoutData {
  id: string;
  name: string | null;
  started_at: string | null;
  finished_at: string | null;
  notes: string | null;
  sets: SetData[];
}

interface WorkoutDetailProps {
  workout: WorkoutData;
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
  const totalVolume = workout.sets.reduce(
    (acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0),
    0
  );

  const duration =
    workout.started_at && workout.finished_at
      ? Math.round(
          (new Date(workout.finished_at).getTime() -
            new Date(workout.started_at).getTime()) /
            60000
        )
      : null;

  const handleDelete = async () => {
    setDeleting(true);
    await deleteWorkout(workout.id);
  };

  const handleDeleteSet = async (setId: string) => {
    await deleteSetFromWorkout(setId, workout.id);
    router.refresh();
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
          <h1 className="text-xl font-bold">
            {workout.name ?? "Тренування"}
          </h1>
          <p className="text-sm text-muted-foreground">
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
              <Clock className="mb-1 h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold">{duration}</span>
              <span className="text-xs text-muted-foreground">хв</span>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <Dumbbell className="mb-1 h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold">{totalSets}</span>
            <span className="text-xs text-muted-foreground">підходів</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <TrendingUp className="mb-1 h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold">
              {totalVolume > 1000
                ? `${(totalVolume / 1000).toFixed(1)}т`
                : Math.round(totalVolume)}
            </span>
            <span className="text-xs text-muted-foreground">кг</span>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Вправи з підходами */}
      {Array.from(grouped.entries()).map(([exerciseId, sets]) => {
        const exercise = exerciseMap.get(exerciseId);
        const sortedSets = [...sets].sort(
          (a, b) => a.set_number - b.set_number
        );
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
              <CardTitle className="text-base">
                {exercise?.name ?? "Невідома вправа"}
              </CardTitle>
              {exercise?.muscle_group && (
                <p className="text-xs text-muted-foreground">
                  {MUSCLE_GROUP_LABELS[exercise.muscle_group as MuscleGroup]}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {/* Заголовки */}
              <div className="flex items-center gap-2 px-1 pb-2 text-xs font-medium text-muted-foreground">
                <span className="w-8 text-center">#</span>
                <span className="w-16 text-center">Вага</span>
                <span className="w-12 text-center">Повт</span>
                <span className="w-12 text-center">RPE</span>
                <span className="flex-1 text-center">1RM</span>
                <span className="w-8" />
              </div>

              {sortedSets.map((set) => {
                const estimated1RM =
                  set.weight && set.reps
                    ? Math.round(calc1RM(set.weight, set.reps))
                    : null;
                const isBest =
                  bestSet.set?.id === set.id && sortedSets.length > 1;

                return (
                  <div
                    key={set.id}
                    className={`flex items-center gap-2 rounded-lg px-1 py-1.5 ${
                      isBest ? "bg-accent/50" : ""
                    }`}
                  >
                    <span className="w-8 text-center text-sm text-muted-foreground">
                      {set.set_number}
                    </span>
                    <span className="w-16 text-center text-sm font-medium">
                      {set.weight ?? "—"}
                    </span>
                    <span className="w-12 text-center text-sm">
                      {set.reps ?? "—"}
                    </span>
                    <span className="w-12 text-center text-sm text-muted-foreground">
                      {set.rpe ?? "—"}
                    </span>
                    <span className="flex-1 text-center text-sm text-muted-foreground">
                      {estimated1RM ?? "—"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteSet(set.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}

              {/* Best set підсвічення */}
              {bestSet.rm > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
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
            <p className="text-sm text-muted-foreground">{workout.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Діалог видалення */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Видалити тренування?</DialogTitle>
            <DialogDescription>
              Це видалить тренування та всі підходи. Цю дію неможливо скасувати.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Скасувати
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Видаляю..." : "Видалити"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
