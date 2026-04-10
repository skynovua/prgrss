import { useReducer, useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Exercise } from "@/lib/types";
import { workoutReducer, createInitialState } from "./reducer";
import {
  saveActiveWorkout,
  clearActiveWorkout,
  restoreActiveWorkout,
  finishWorkout,
} from "./persistence";

export function useWorkout() {
  const router = useRouter();
  const [state, dispatch] = useReducer(workoutReducer, undefined, createInitialState);
  const [restored, setRestored] = useState(false);
  const isFinishing = useRef(false);
  const { exercises: workoutExercises, startedAt, timerOpen, saving } = state;

  // Відновлення з IndexedDB при маунті
  useEffect(() => {
    restoreActiveWorkout().then((active) => {
      if (active && active.exercises.length > 0) {
        dispatch({
          type: "RESTORE",
          exercises: active.exercises,
          startedAt: active.startedAt,
        });
        toast.info("Відновлено незавершене тренування");
      }
      setRestored(true);
    });
  }, []);

  // Автозбереження в IndexedDB при кожній зміні вправ
  useEffect(() => {
    if (!restored || isFinishing.current) return;
    if (workoutExercises.length > 0) {
      saveActiveWorkout(state);
    } else {
      clearActiveWorkout();
    }
  }, [workoutExercises, startedAt, restored, state]);

  const addExercise = useCallback((exercise: Exercise) => {
    dispatch({ type: "ADD_EXERCISE", exercise });
  }, []);

  const handleFinish = async () => {
    if (workoutExercises.length === 0) return;

    dispatch({ type: "SET_SAVING", saving: true });
    isFinishing.current = true;

    try {
      const result = await finishWorkout(workoutExercises, startedAt);

      if (!result.success) {
        router.push(result.redirectTo);
        return;
      }

      if (result.offline) {
        toast.info("Збережено офлайн", {
          description: "Синхронізується при появі інтернету",
        });
      } else {
        toast.success("Тренування збережено");
      }

      router.push(result.redirectTo);
    } catch {
      toast.error("Не вдалося зберегти тренування");
    } finally {
      dispatch({ type: "SET_SAVING", saving: false });
    }
  };

  const totalSets = workoutExercises.reduce(
    (acc, we) => acc + we.sets.filter((s) => s.completed).length,
    0
  );

  const totalVolume = workoutExercises.reduce(
    (acc, we) =>
      acc +
      we.sets.filter((s) => s.completed).reduce((a, s) => a + (s.weight ?? 0) * (s.reps ?? 0), 0),
    0
  );

  return {
    state,
    dispatch,
    workoutExercises,
    timerOpen,
    saving,
    totalSets,
    totalVolume,
    addExercise,
    handleFinish,
  };
}
