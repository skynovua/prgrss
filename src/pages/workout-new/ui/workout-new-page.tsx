import { useExercises } from "@/entities/exercise";
import { WorkoutLoading, WorkoutLogger } from "@/entities/workout";
import { usePreviousSets } from "@/entities/workout";
import { PageError, RefreshNotice } from "@/shared/ui";

export default function WorkoutNewPage() {
  const { data: exercises, isPending, isError, refetch } = useExercises();

  const {
    data: previousSets,
    isPending: historyPending,
    isError: historyUnavailable,
  } = usePreviousSets();

  if (isPending) return <WorkoutLoading view="new" onRetry={() => void refetch()} />;

  if (!exercises)
    return <PageError title="Вправи не завантажилися" onRetry={() => void refetch()} />;
  if (exercises.length === 0)
    return (
      <PageError
        title="У бібліотеці ще немає вправ"
        description="Додай вправу в бібліотеці, щоб почати тренування."
      />
    );

  return (
    <>
      {isError && <RefreshNotice onRetry={() => void refetch()} />}
      <WorkoutLogger
        exercises={exercises}
        previousSets={previousSets ?? {}}
        historyUnavailable={historyUnavailable}
        historyPending={historyPending}
      />
    </>
  );
}
