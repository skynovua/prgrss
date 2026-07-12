import { useParams, useNavigate } from "@tanstack/react-router";
import { WorkoutEditor } from "@/entities/workout";
import { useWorkoutDetail, usePreviousSets } from "@/entities/workout";
import { useExercises } from "@/entities/exercise";
import { isWorkoutEditable } from "@/entities/workout";
import { Button, LoaderBar } from "@/shared/ui";

export default function WorkoutEditPage() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();

  const { data, isLoading: isWorkoutLoading } = useWorkoutDetail(id);
  const {
    data: allExercises,
    isPending: isExercisesPending,
    isError: isExercisesError,
    refetch: refetchExercises,
  } = useExercises();
  const { data: previousSets } = usePreviousSets();

  if (isWorkoutLoading) {
    return <LoaderBar />;
  }

  if (!data) {
    navigate({ to: "/dashboard" });
    return null;
  }

  // Перевірка: редагування доступне тільки протягом 24 годин
  if (!isWorkoutEditable(data.workout.started_at)) {
    navigate({ to: "/workout/$id", params: { id: id! } });
    return null;
  }

  if (isExercisesPending) {
    return <LoaderBar />;
  }

  if (isExercisesError || !allExercises) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-muted-foreground text-lg">Не вдалося завантажити вправи</p>
        <p className="text-muted-foreground text-sm">Перевірте з'єднання з інтернетом</p>
        <Button variant="outline" onClick={() => void refetchExercises()}>
          Спробувати ще раз
        </Button>
      </div>
    );
  }

  return (
    <WorkoutEditor
      workout={data.workout}
      exercises={data.exercises}
      allExercises={allExercises}
      previousSets={previousSets ?? {}}
    />
  );
}
