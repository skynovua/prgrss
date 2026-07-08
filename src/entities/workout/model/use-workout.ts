import { useReducer, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Exercise, PreviousSetsMap } from "@/entities/workout";
import { toWorkoutOperationError } from "@/entities/workout";
import { workoutReducer, createInitialState } from "./reducer";
import { getWorkoutVolume } from "./metrics";
import {
  clearActiveWorkoutDraft,
  finishWorkout,
  restoreActiveWorkoutDraft,
  saveActiveWorkoutDraft,
} from "./persistence";

export function useWorkout(previousSets?: PreviousSetsMap) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(workoutReducer, undefined, () => {
    const initialState = createInitialState();
    const draft = restoreActiveWorkoutDraft();

    if (!draft?.exercises.length) {
      return initialState;
    }

    return {
      ...initialState,
      exercises: draft.exercises,
      startedAt: draft.startedAt,
    };
  });
  const { exercises: workoutExercises, startedAt, timerOpen, saving } = state;

  useEffect(() => {
    if (workoutExercises.length === 0) {
      clearActiveWorkoutDraft();
      return;
    }

    saveActiveWorkoutDraft({ exercises: workoutExercises, startedAt });
  }, [startedAt, workoutExercises]);

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

    try {
      const result = await finishWorkout(workoutExercises, startedAt);

      if (!result.success) {
        navigate({ to: result.redirectTo });
        return;
      }

      toast.success("Тренування збережено");

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
    workoutExercises,
    timerOpen,
    saving,
    totalSets,
    totalVolume,
    addExercise,
    handleFinish,
  };
}
