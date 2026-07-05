import { useReducer, useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Exercise, PreviousSetsMap } from "@/entities/workout";
import { toWorkoutOperationError } from "@/entities/workout";
import { workoutReducer, createInitialState } from "./reducer";
import { getWorkoutVolume } from "./metrics";
import {
  saveActiveWorkout,
  clearActiveWorkout,
  restoreActiveWorkout,
  finishWorkout,
} from "./persistence";

function getInitialCollapsedCards(
  exercises: NonNullable<ReturnType<typeof createInitialState>["exercises"]>
) {
  return Object.fromEntries(
    exercises
      .map((exercise, index) => [
        `${exercise.exercise.id}-${index}`,
        exercise.sets.length > 0 && exercise.sets.every((set) => set.completed),
      ])
      .filter(([, shouldCollapse]) => shouldCollapse)
  ) as Record<string, boolean>;
}

export function useWorkout(previousSets?: PreviousSetsMap) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(workoutReducer, undefined, createInitialState);
  const [initialCollapsedCards, setInitialCollapsedCards] = useState<Record<string, boolean>>({});
  const [restored, setRestored] = useState(false);
  const isFinishing = useRef(false);
  const { exercises: workoutExercises, startedAt, timerOpen, saving } = state;

  // Відновлення з IndexedDB при маунті
  useEffect(() => {
    restoreActiveWorkout().then((active) => {
      if (active && active.exercises.length > 0) {
        setInitialCollapsedCards(getInitialCollapsedCards(active.exercises));
        dispatch({
          type: "RESTORE",
          exercises: active.exercises,
          startedAt: active.startedAt,
        });
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

  const addExercise = useCallback(
    (exercise: Exercise) => {
      dispatch({
        type: "ADD_EXERCISE",
        exercise,
        previousSets: previousSets?.[exercise.id],
      });
    },
    [previousSets]
  );

  const handleFinish = async () => {
    if (workoutExercises.length === 0) return;

    dispatch({ type: "SET_SAVING", saving: true });
    isFinishing.current = true;

    try {
      const result = await finishWorkout(workoutExercises, startedAt);

      if (!result.success) {
        navigate({ to: result.redirectTo });
        return;
      }

      if (result.offline) {
        toast.info("Збережено офлайн", {
          description: "Синхронізується при появі інтернету",
        });
      } else {
        toast.success("Тренування збережено");
      }

      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["achievements"] });
      await queryClient.invalidateQueries({ queryKey: ["previousSets"] });
      await queryClient.invalidateQueries({ queryKey: ["progress"] });

      navigate({ to: result.redirectTo });
    } catch (error) {
      const mappedError = toWorkoutOperationError(error, "save");
      toast.error("Не вдалося зберегти тренування", {
        description: mappedError.message,
      });
    } finally {
      dispatch({ type: "SET_SAVING", saving: false });
    }
  };

  const totalSets = workoutExercises.reduce(
    (acc, we) => acc + we.sets.filter((s) => s.completed).length,
    0
  );

  const totalVolume = getWorkoutVolume(workoutExercises);

  return {
    state,
    dispatch,
    initialCollapsedCards,
    restored,
    workoutExercises,
    timerOpen,
    saving,
    totalSets,
    totalVolume,
    addExercise,
    handleFinish,
  };
}
