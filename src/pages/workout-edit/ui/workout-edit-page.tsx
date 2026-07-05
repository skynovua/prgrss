import { useParams, useNavigate } from "@tanstack/react-router";
import { WorkoutEditor } from "@/entities/workout";
import { useWorkoutDetail, usePreviousSets } from "@/entities/workout";
import { useExercises } from "@/entities/exercise";
import { isWorkoutEditable } from "@/entities/workout";
import { LoaderBar } from "@/shared/ui";

export default function WorkoutEditPage() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();

  const { data, isLoading } = useWorkoutDetail(id);
  const { data: allExercises } = useExercises();
  const { data: previousSets } = usePreviousSets();

  if (isLoading) {
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

  if (!allExercises) {
    return <LoaderBar />;
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
