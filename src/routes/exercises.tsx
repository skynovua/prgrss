import { ExerciseLibrary } from "@/src/components/exercises/exercise-library";
import { useExercises } from "@/src/lib/hooks/use-exercises";
import { LoaderBar } from "@/src/components/ui/loader-bar";

export default function ExercisesPage() {
  const { data: exercises, isLoading } = useExercises();

  if (isLoading) {
    return <LoaderBar />;
  }

  return <ExerciseLibrary exercises={exercises ?? []} />;
}
