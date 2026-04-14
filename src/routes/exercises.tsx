import { useQuery } from "@tanstack/react-query";
import { ExerciseLibrary } from "@/src/components/exercises/exercise-library";
import { fetchExercises } from "@/src/lib/api/exercises";

export default function ExercisesPage() {
  const { data: exercises, isLoading } = useQuery({
    queryKey: ["exercises"],
    queryFn: fetchExercises,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-x-0 top-0 z-[100]">
        <div className="bg-primary h-0.5 animate-pulse" />
      </div>
    );
  }

  return <ExerciseLibrary exercises={exercises ?? []} />;
}
