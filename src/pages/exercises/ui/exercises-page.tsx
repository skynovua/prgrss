import { ExerciseLibrary } from "@/entities/exercise";
import { useExercises } from "@/entities/exercise";
import { PageError, PageLoading, RefreshNotice } from "@/shared/ui";

export default function ExercisesPage() {
  const { data: exercises, isPending, isError, refetch } = useExercises();

  if (isPending) return <PageLoading title="Вправи" layout="list" onRetry={() => void refetch()} />;

  if (!exercises)
    return <PageError title="Вправи не завантажилися" onRetry={() => void refetch()} />;

  return (
    <>
      {isError && <RefreshNotice onRetry={() => void refetch()} />}
      <ExerciseLibrary exercises={exercises} />
    </>
  );
}
