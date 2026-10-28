import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Timer } from "lucide-react";
import { useReducer, useState } from "react";
import { toast } from "sonner";

import { useProfile } from "@/entities/profile";
import { Button } from "@/shared/ui";

import { useUpdateWorkout } from "../hooks/use-workouts";
import { getExerciseLogPreferences } from "../model/exercise-log-preferences";
import { getWorkoutVolume } from "../model/metrics";
import { createInitialState, workoutReducer } from "../model/reducer";
import type {
  Exercise,
  ExerciseData,
  PreviousSetsMap,
  SetData,
  WorkoutExercise,
  WorkoutWithSets,
} from "../model/types";
import { getExerciseTrackingType, getWorkoutReview } from "../model/workout-logging";
import { ExercisePicker } from "./exercise-picker";
import { RestTimer } from "./rest-timer";
import { WorkoutExerciseCard } from "./workout-exercise-card";
import { WorkoutFinishDialog } from "./workout-finish-dialog";

function workoutToEditorState(
  workout: WorkoutWithSets,
  exercises: ExerciseData[]
): WorkoutExercise[] {
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const grouped = new Map<string, SetData[]>();
  for (const set of workout.sets)
    grouped.set(set.exercise_id, [...(grouped.get(set.exercise_id) ?? []), set]);
  return Array.from(grouped, ([exerciseId, sets]) => {
    const exercise = exerciseMap.get(exerciseId) ?? {
      id: exerciseId,
      name: "Невідома вправа",
      muscle_group: null,
      equipment: null,
    };
    const localSets = [...sets]
      .sort((a, b) => a.set_number - b.set_number)
      .map((set) => ({
        id: set.id,
        setNumber: set.set_number,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
        durationS: set.duration_s,
        notes: set.notes,
        completed: true,
      }));
    return {
      instanceId: crypto.randomUUID(),
      exercise,
      sets: localSets,
      // В історії показуємо фактично записані метрики, незалежно від типових полів каталогу.
      trackingType: getExerciseTrackingType({ ...exercise, catalog_key: null }, localSets),
      restSeconds: getExerciseLogPreferences(exerciseId).restSeconds ?? 90,
    };
  });
}

interface WorkoutEditorProps {
  workout: WorkoutWithSets;
  exercises: ExerciseData[];
  allExercises: Exercise[];
  previousSets?: PreviousSetsMap;
}

export function WorkoutEditor({
  workout,
  exercises,
  allExercises,
  previousSets,
}: WorkoutEditorProps) {
  const navigate = useNavigate();
  const updateMutation = useUpdateWorkout();
  const { data: profile } = useProfile();
  const [state, dispatch] = useReducer(workoutReducer, undefined, () => ({
    ...createInitialState(),
    workoutId: workout.id,
    exercises: workoutToEditorState(workout, exercises),
    startedAt: workout.started_at ?? new Date().toISOString(),
    name: workout.name ?? "",
    notes: workout.notes ?? "",
  }));
  const workoutExercises = state.exercises;
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(workoutExercises.map((we) => [we.instanceId, true]))
  );
  const [reviewOpen, setReviewOpen] = useState(false);
  const review = getWorkoutReview(workoutExercises);

  const handleSave = async (details: { name: string; notes: string }) => {
    if (state.saving || review.completedSets === 0 || review.invalidSets.length > 0) return;
    dispatch({ type: "SET_SAVING", saving: true });
    try {
      await updateMutation.mutateAsync({
        workoutId: workout.id,
        exercises: workoutExercises,
        ...details,
      });
      toast.success("Тренування оновлено");
      navigate({ to: "/workout/$id", params: { id: workout.id } });
    } catch {
      // Помилка показується в мутації; введені значення залишаються у формі.
    } finally {
      dispatch({ type: "SET_SAVING", saving: false });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 pb-[calc(17rem+env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-2 border-b pb-4">
        <Button
          variant="ghost"
          size="icon"
          render={<Link to="/workout/$id" params={{ id: workout.id }} />}
          nativeButton={false}
          aria-label="Повернутися до тренування"
        >
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-medium">Редагування</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Підходи: {review.completedSets} ·{" "}
            {new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(
              getWorkoutVolume(workoutExercises)
            )}{" "}
            кг
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch({ type: "SET_TIMER_OPEN", open: true })}
          aria-label="Відкрити таймер відпочинку"
        >
          <Timer />
        </Button>
      </header>
      {workoutExercises.map((we, exerciseIndex) => (
        <WorkoutExerciseCard
          key={we.instanceId}
          we={we}
          exerciseIndex={exerciseIndex}
          previousSets={previousSets?.[we.exercise.id]}
          autoRestTimer={profile?.autoRestTimer ?? true}
          isCollapsed={collapsedCards[we.instanceId] ?? false}
          onToggleCollapse={(id) =>
            setCollapsedCards((current) => ({ ...current, [id]: !current[id] }))
          }
          dispatch={dispatch}
        />
      ))}
      <ExercisePicker
        exercises={allExercises}
        onSelect={(exercise) =>
          dispatch({
            type: "ADD_EXERCISE",
            exercise,
            previousSets: previousSets?.[exercise.id],
            preferences: getExerciseLogPreferences(exercise.id),
          })
        }
      />
      <RestTimer
        open={state.timerOpen}
        clock={state.restClock}
        dispatch={dispatch}
        aboveSaveButton
      />
      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4">
        <div className="border-border bg-background/95 mx-auto max-w-lg rounded-2xl border p-3 shadow-lg backdrop-blur">
          <Button
            className="w-full"
            size="lg"
            disabled={state.saving}
            onClick={() => setReviewOpen(true)}
          >
            <Check data-icon="inline-start" />
            Перевірити й зберегти
          </Button>
        </div>
      </div>
      <WorkoutFinishDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        exercises={workoutExercises}
        saving={state.saving}
        onSave={(details) => void handleSave(details)}
        initialName={workout.name ?? ""}
        initialNotes={workout.notes}
        editing
        onReturn={() => {
          setReviewOpen(false);
          setCollapsedCards((current) => ({
            ...current,
            ...Object.fromEntries(
              review.invalidSets.map((issue) => [
                workoutExercises[issue.exerciseIndex].instanceId,
                false,
              ])
            ),
          }));
          if (review.invalidSets[0])
            window.requestAnimationFrame(() =>
              document
                .getElementById(`workout-set-${review.invalidSets[0].setId}`)
                ?.scrollIntoView({ block: "center", behavior: "smooth" })
            );
        }}
      />
    </div>
  );
}
