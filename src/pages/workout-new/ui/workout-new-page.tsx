import { useExercises } from "@/entities/exercise";
import { WorkoutLogger } from "@/entities/workout";
import { usePreviousSets } from "@/entities/workout";
import { RefreshNotice } from "@/shared/ui";

export default function WorkoutNewPage() {
  const { data: exercises, isPending, isError, refetch } = useExercises();

  const { data: previousSets, isError: historyUnavailable } = usePreviousSets();

  return (
    <>
      {isError && exercises && <RefreshNotice onRetry={() => void refetch()} />}
      <WorkoutLogger
        exercises={exercises}
        exercisesPending={isPending}
        onRetryExercises={() => void refetch()}
        previousSets={previousSets ?? {}}
        historyUnavailable={historyUnavailable}
      />
    </>
  );
}
