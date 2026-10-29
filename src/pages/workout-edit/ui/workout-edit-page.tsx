import { Navigate, useParams, useSearch } from "@tanstack/react-router";

import { useExercises } from "@/entities/exercise";
import { WorkoutEditor } from "@/entities/workout";
import { usePreviousSets, useWorkoutDetail } from "@/entities/workout";
import { isWorkoutEditable } from "@/entities/workout";
import { PageError, PageLoading, RefreshNotice } from "@/shared/ui";

export default function WorkoutEditPage() {
  const { id } = useParams({ strict: false });
  const { from } = useSearch({ from: "/app/workout/$id/edit" });

  const {
    data,
    isPending: isWorkoutPending,
    isError: isWorkoutError,
    refetch: refetchWorkout,
  } = useWorkoutDetail(id);
  const {
    data: allExercises,
    isPending: isExercisesPending,
    isError: isExercisesError,
    refetch: refetchExercises,
  } = useExercises();
  const { data: previousSets } = usePreviousSets();

  if (!id)
    return (
      <PageError title="Тренування не знайдено" description="Перевір посилання на тренування." />
    );
  if (isWorkoutPending)
    return (
      <PageLoading
        key={id}
        title="Редагування тренування"
        layout="form"
        onRetry={() => void refetchWorkout()}
      />
    );
  if (isWorkoutError && !data)
    return <PageError title="Тренування не завантажилося" onRetry={() => void refetchWorkout()} />;

  if (!data) {
    return (
      <PageError
        title="Тренування не знайдено"
        description="Його видалено або воно недоступне для цього акаунта."
      />
    );
  }

  // Перевірка: редагування доступне тільки протягом 24 годин
  if (!isWorkoutEditable(data.workout.started_at)) {
    return <Navigate to="/workout/$id" params={{ id }} search={{ from }} replace />;
  }

  if (isExercisesPending) {
    return (
      <PageLoading
        key={id}
        title="Редагування тренування"
        layout="form"
        onRetry={() => void refetchExercises()}
      />
    );
  }

  if (!allExercises)
    return <PageError title="Вправи не завантажилися" onRetry={() => void refetchExercises()} />;

  return (
    <>
      {(isWorkoutError || isExercisesError) && (
        <RefreshNotice
          onRetry={() => {
            void refetchWorkout();
            void refetchExercises();
          }}
        />
      )}
      <WorkoutEditor
        key={id}
        workout={data.workout}
        exercises={data.exercises}
        allExercises={allExercises}
        previousSets={previousSets ?? {}}
        returnSearch={{ from }}
      />
    </>
  );
}
