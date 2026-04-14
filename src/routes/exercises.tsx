import { ExerciseLibrary } from "@/src/components/exercises/exercise-library";
import { useExercises } from "@/src/lib/hooks/use-exercises";

export default function ExercisesPage() {
  const { data: exercises, isLoading } = useExercises();

  if (isLoading) {
    return (
      <div className="fixed inset-x-0 top-0 z-100">
        <div className="bg-primary h-0.5 animate-pulse" />
      </div>
    );
  }

  return <ExerciseLibrary exercises={exercises ?? []} />;
}
