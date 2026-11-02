import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { toast } from "sonner";

import type { Exercise, PreviousSetsMap, SavedWorkoutContext } from "@/entities/workout";
import { toWorkoutOperationError } from "@/entities/workout";
import { useAuth } from "@/shared/auth";

import { getExerciseLogPreferences } from "./exercise-log-preferences";
import { getWorkoutVolume } from "./metrics";
import { finishWorkout } from "./persistence";
import { createInitialState, workoutReducer } from "./reducer";
import {
  clearActiveWorkoutDraft,
  restoreActiveWorkoutDraft,
  saveActiveWorkoutDraft,
} from "./workout-draft";
import { getWorkoutReview, isSetValid } from "./workout-logging";

export function useWorkout(
  previousSets?: PreviousSetsMap,
  onWorkoutSaved?: (context: SavedWorkoutContext) => boolean
) {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(workoutReducer, undefined, () => {
    const initialState = createInitialState();
    const draft = restoreActiveWorkoutDraft(userId);

    if (!draft) {
      return initialState;
    }

    return {
      ...initialState,
      exercises: draft.exercises,
      startedAt: draft.startedAt,
      workoutId: draft.workoutId,
      restClock: draft.restClock,
      name: draft.name,
      notes: draft.notes,
      programSource: draft.programSource,
    };
  });
  const draftClosed = useRef(false);
  const {
    exercises: workoutExercises,
    startedAt,
    workoutId,
    timerOpen,
    restClock,
    saving,
    name,
    notes,
    programSource,
  } = state;

  useEffect(() => {
    if (draftClosed.current) return;
    saveActiveWorkoutDraft({
      userId,
      exercises: workoutExercises,
      startedAt,
      workoutId,
      restClock,
      name,
      notes,
      programSource,
    });
  }, [userId, startedAt, workoutExercises, workoutId, restClock, name, notes, programSource]);

  const addExercise = useCallback(
    (exercise: Exercise) => {
      dispatch({
        type: "ADD_EXERCISE",
        exercise,
        previousSets: previousSets?.[exercise.id],
        preferences: getExerciseLogPreferences(userId, exercise.id),
      });
    },
    [previousSets, userId]
  );

  const cancelWorkout = () => {
    if (saving) return;
    if (!clearActiveWorkoutDraft(userId, workoutId)) {
      toast.error("Не вдалося скасувати тренування", {
        description: "Перевір доступ до сховища або онови тренування на цьому пристрої.",
      });
      return;
    }
    draftClosed.current = true;
    void navigate({ to: "/dashboard" });
  };

  const handleFinish = async (details?: { name?: string; notes?: string }) => {
    const review = getWorkoutReview(workoutExercises);
    if (saving || review.completedSets === 0 || review.invalidSets.length > 0) return;

    dispatch({ type: "SET_SAVING", saving: true });

    try {
      const result = await finishWorkout(
        userId,
        workoutExercises,
        startedAt,
        workoutId,
        details,
        programSource?.id
      );

      if (!result.success) {
        navigate({ to: result.redirectTo });
        return;
      }

      draftClosed.current = true;

      toast.success("Тренування збережено");
      if (programSource && !result.programLinked) {
        toast.warning("Тренування збережено без зв’язку з шаблоном", {
          description: "Шаблон видалено або він тимчасово недоступний.",
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["calendar"] });
      await queryClient.invalidateQueries({ queryKey: ["achievements"] });
      await queryClient.invalidateQueries({ queryKey: ["previousSets"] });
      await queryClient.invalidateQueries({ queryKey: ["progress"] });

      if (
        !onWorkoutSaved?.({
          workoutId,
          exercises: workoutExercises,
          programSource: result.programLinked ? programSource : null,
        })
      ) {
        navigate({ to: result.redirectTo });
      }
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
    (acc, we) => acc + we.sets.filter((s) => s.completed && isSetValid(s, we.trackingType)).length,
    0
  );

  const totalVolume = getWorkoutVolume(workoutExercises);

  return {
    state,
    dispatch,
    workoutExercises,
    startedAt,
    timerOpen,
    restClock,
    saving,
    totalSets,
    totalVolume,
    addExercise,
    cancelWorkout,
    handleFinish,
  };
}
