import { ExerciseLibrary } from "@/entities/exercise";
import { useExercises } from "@/entities/exercise";
import { LoaderBar } from "@/shared/ui";

export default function ExercisesPage() {
  const { data: exercises, isLoading } = useExercises();

  if (isLoading) {
    return <LoaderBar />;
  }

  return <ExerciseLibrary exercises={exercises ?? []} />;
}
