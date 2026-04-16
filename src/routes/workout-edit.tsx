import { useParams, useNavigate } from "@tanstack/react-router";
import { WorkoutEditor } from "@/src/components/workout/workout-editor";
import { useWorkoutDetail, usePreviousSets } from "@/src/lib/hooks/use-workouts";
import { useExercises } from "@/src/lib/hooks/use-exercises";
import { isWorkoutEditable } from "@/src/lib/api/workouts";

export default function WorkoutEditPage() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();

  const { data, isLoading } = useWorkoutDetail(id);
  const { data: allExercises } = useExercises();
  const { data: previousSets } = usePreviousSets();

  if (isLoading) {
    return (
      <div className="fixed inset-x-0 top-0 z-100">
        <div className="bg-primary h-0.5 animate-pulse" />
      </div>
    );
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
    return (
      <div className="fixed inset-x-0 top-0 z-100">
        <div className="bg-primary h-0.5 animate-pulse" />
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
