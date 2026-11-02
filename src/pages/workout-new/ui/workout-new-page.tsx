import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { ExerciseDetailsById, useExercises } from "@/entities/exercise";
import {
  type ExerciseData,
  hasLegacyExerciseLogPreferences,
  hasLegacyWorkoutDraft,
  restoreLegacyExerciseLogPreferences,
  restoreLegacyWorkoutDraft,
  type SavedWorkoutContext,
  WorkoutLogger,
} from "@/entities/workout";
import { usePreviousSets } from "@/entities/workout";
import { hasProgramChanges, ProgramUpdateDialog } from "@/features/program";
import { useAuth } from "@/shared/auth";
import { Button, Card, CardContent, RefreshNotice } from "@/shared/ui";

export default function WorkoutNewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const [detailsTarget, setDetailsTarget] = useState<ExerciseData | null>(null);
  const [draftVersion, setDraftVersion] = useState(0);
  const [savedWorkout, setSavedWorkout] = useState<
    | (SavedWorkoutContext & { programSource: NonNullable<SavedWorkoutContext["programSource"]> })
    | null
  >(null);
  const [legacyAvailable, setLegacyAvailable] = useState(
    () => hasLegacyWorkoutDraft(userId) || hasLegacyExerciseLogPreferences(userId)
  );
  const { data: exercises, isPending, isError, refetch } = useExercises();

  const { data: previousSets, isError: historyUnavailable } = usePreviousSets();

  return (
    <>
      {isError && exercises && <RefreshNotice onRetry={() => void refetch()} />}
      {legacyAvailable && (
        <div className="px-4 pt-4 sm:px-5 md:px-8">
          <Card size="sm">
            <CardContent className="flex flex-col items-start gap-3">
              <p className="text-sm">
                На цьому пристрої залишилися дані тренування зі старої версії. Віднови їх, лише якщо
                вони твої.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  const restoredDraft = restoreLegacyWorkoutDraft(userId);
                  const restoredPreferences = restoreLegacyExerciseLogPreferences(userId);
                  if (restoredDraft) setDraftVersion((version) => version + 1);
                  if (restoredDraft || restoredPreferences)
                    toast.success("Локальні дані відновлено");
                  else toast.error("Не вдалося відновити локальні дані");
                  setLegacyAvailable(
                    hasLegacyWorkoutDraft(userId) || hasLegacyExerciseLogPreferences(userId)
                  );
                }}
              >
                Відновити мої дані
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {!savedWorkout && (
        <WorkoutLogger
          key={draftVersion}
          exercises={exercises}
          exercisesPending={isPending}
          onRetryExercises={() => void refetch()}
          previousSets={previousSets ?? {}}
          historyUnavailable={historyUnavailable}
          onOpenExerciseDetails={setDetailsTarget}
          onWorkoutSaved={(context) => {
            if (
              !context.programSource ||
              !hasProgramChanges(context.programSource.template, context.exercises)
            )
              return false;
            setSavedWorkout({ ...context, programSource: context.programSource });
            return true;
          }}
        />
      )}
      {savedWorkout && (
        <ProgramUpdateDialog
          programSource={savedWorkout.programSource}
          exercises={savedWorkout.exercises}
          onDone={() =>
            void navigate({ to: "/workout/$id", params: { id: savedWorkout.workoutId } })
          }
        />
      )}
      {detailsTarget && (
        <ExerciseDetailsById exercise={detailsTarget} onClose={() => setDetailsTarget(null)} />
      )}
    </>
  );
}
