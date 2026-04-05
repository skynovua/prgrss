"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { SetRow } from "@/components/workout/set-row";
import { RestTimer } from "@/components/workout/rest-timer";
import { Timer, Plus, Square } from "lucide-react";
import {
  type Exercise,
  type WorkoutExercise,
  type LocalSet,
  MUSCLE_GROUP_LABELS,
  type MuscleGroup,
} from "@/lib/types";
import { db } from "@/lib/offline/db";
import { createClient } from "@/lib/supabase/client";

interface WorkoutLoggerProps {
  exercises: Exercise[];
}

function generateId() {
  return crypto.randomUUID();
}

export function WorkoutLogger({ exercises }: WorkoutLoggerProps) {
  const router = useRouter();
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    []
  );
  const [startedAt] = useState(() => new Date().toISOString());
  const [timerOpen, setTimerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAddExercise = useCallback((exercise: Exercise) => {
    setWorkoutExercises((prev) => [
      ...prev,
      {
        exercise,
        sets: [
          {
            id: generateId(),
            setNumber: 1,
            weight: null,
            reps: null,
            rpe: null,
            durationS: null,
            completed: false,
          },
        ],
      },
    ]);
  }, []);

  const handleAddSet = useCallback((exerciseIndex: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exerciseIndex] };
      ex.sets = [
        ...ex.sets,
        {
          id: generateId(),
          setNumber: ex.sets.length + 1,
          weight: ex.sets.length > 0 ? ex.sets[ex.sets.length - 1].weight : null,
          reps: ex.sets.length > 0 ? ex.sets[ex.sets.length - 1].reps : null,
          rpe: null,
          durationS: null,
          completed: false,
        },
      ];
      updated[exerciseIndex] = ex;
      return updated;
    });
  }, []);

  const handleUpdateSet = useCallback(
    (exerciseIndex: number, updatedSet: LocalSet) => {
      setWorkoutExercises((prev) => {
        const updated = [...prev];
        const ex = { ...updated[exerciseIndex] };
        ex.sets = ex.sets.map((s) => (s.id === updatedSet.id ? updatedSet : s));
        updated[exerciseIndex] = ex;
        return updated;
      });
    },
    []
  );

  const handleCompleteSet = useCallback(
    (exerciseIndex: number, updatedSet: LocalSet) => {
      handleUpdateSet(exerciseIndex, updatedSet);
      if (updatedSet.completed) {
        setTimerOpen(true);
      }
    },
    [handleUpdateSet]
  );

  const handleDeleteSet = useCallback(
    (exerciseIndex: number, setId: string) => {
      setWorkoutExercises((prev) => {
        const updated = [...prev];
        const ex = { ...updated[exerciseIndex] };
        ex.sets = ex.sets
          .filter((s) => s.id !== setId)
          .map((s, i) => ({ ...s, setNumber: i + 1 }));
        // Якщо не залишилось сетів — видаляємо вправу
        if (ex.sets.length === 0) {
          return updated.filter((_, i) => i !== exerciseIndex);
        }
        updated[exerciseIndex] = ex;
        return updated;
      });
    },
    []
  );

  const handleRemoveExercise = useCallback((exerciseIndex: number) => {
    setWorkoutExercises((prev) => prev.filter((_, i) => i !== exerciseIndex));
  }, []);

  const handleFinish = async () => {
    if (workoutExercises.length === 0) return;

    setSaving(true);
    const supabase = createClient();
    const finishedAt = new Date().toISOString();
    const workoutId = generateId();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.push("/login");
      return;
    }

    // Спробуємо зберегти в Supabase
    const { error: workoutError } = await supabase.from("workouts").insert({
      id: workoutId,
      user_id: user.id,
      started_at: startedAt,
      finished_at: finishedAt,
      name: workoutExercises
        .map((we) => we.exercise.name)
        .slice(0, 3)
        .join(", "),
    });

    if (workoutError) {
      // Offline — зберігаємо в Dexie
      await db.pendingWorkouts.add({
        uuid: workoutId,
        name: workoutExercises
          .map((we) => we.exercise.name)
          .slice(0, 3)
          .join(", "),
        startedAt,
        finishedAt,
        notes: null,
        programId: null,
        syncedAt: null,
      });

      for (const we of workoutExercises) {
        for (const set of we.sets.filter((s) => s.completed)) {
          await db.pendingSets.add({
            uuid: generateId(),
            workoutUuid: workoutId,
            exerciseId: we.exercise.id,
            setNumber: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            rpe: set.rpe,
            durationS: set.durationS,
            notes: null,
            syncedAt: null,
          });
        }
      }
    } else {
      // Online — зберігаємо сети
      const setsToInsert = workoutExercises.flatMap((we) =>
        we.sets
          .filter((s) => s.completed)
          .map((set) => ({
            workout_id: workoutId,
            exercise_id: we.exercise.id,
            set_number: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            rpe: set.rpe,
            duration_s: set.durationS,
          }))
      );

      if (setsToInsert.length > 0) {
        await supabase.from("sets").insert(setsToInsert);
      }
    }

    setSaving(false);
    router.push("/dashboard");
  };

  const totalSets = workoutExercises.reduce(
    (acc, we) => acc + we.sets.filter((s) => s.completed).length,
    0
  );
  const totalVolume = workoutExercises.reduce(
    (acc, we) =>
      acc +
      we.sets
        .filter((s) => s.completed)
        .reduce((a, s) => a + (s.weight ?? 0) * (s.reps ?? 0), 0),
    0
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      {/* Хедер */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Тренування</h1>
          <p className="text-sm text-muted-foreground">
            {totalSets} підходів · {Math.round(totalVolume)} кг об&apos;єм
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTimerOpen(true)}
        >
          <Timer className="h-5 w-5" />
        </Button>
      </div>

      <Separator />

      {/* Вправи */}
      {workoutExercises.map((we, exerciseIndex) => (
        <Card key={`${we.exercise.id}-${exerciseIndex}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{we.exercise.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {we.exercise.muscle_group &&
                    MUSCLE_GROUP_LABELS[
                      we.exercise.muscle_group as MuscleGroup
                    ]}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => handleRemoveExercise(exerciseIndex)}
              >
                Видалити
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {/* Заголовки колонок */}
            <div className="flex items-center gap-2 px-2 pb-1 text-xs font-medium text-muted-foreground">
              <span className="w-8 text-center">#</span>
              <span className="w-20 text-center">Вага</span>
              <span className="w-16 text-center">Повт</span>
              <span className="w-16 text-center">RPE</span>
              <span className="w-10" />
              <span className="w-10" />
            </div>

            {we.sets.map((set) => (
              <SetRow
                key={set.id}
                set={set}
                onUpdate={(s) => handleUpdateSet(exerciseIndex, s)}
                onComplete={(s) => handleCompleteSet(exerciseIndex, s)}
                onDelete={(id) => handleDeleteSet(exerciseIndex, id)}
              />
            ))}

            <Button
              variant="ghost"
              size="sm"
              className="mt-1 gap-1"
              onClick={() => handleAddSet(exerciseIndex)}
            >
              <Plus className="h-3 w-3" />
              Додати підхід
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Додати вправу */}
      <ExercisePicker exercises={exercises} onSelect={handleAddExercise} />

      {/* Таймер відпочинку */}
      <RestTimer open={timerOpen} onOpenChange={setTimerOpen} />

      {/* Завершити тренування */}
      {workoutExercises.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4"
        >
          <div className="mx-auto max-w-lg rounded-2xl border border-border/80 bg-background/95 p-3 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80">
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleFinish}
              disabled={saving || totalSets === 0}
            >
              <Square className="h-4 w-4" />
              {saving ? "Зберігаю..." : "Завершити тренування"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
