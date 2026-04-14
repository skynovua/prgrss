import { useQuery } from "@tanstack/react-query";
import { WorkoutLogger } from "@/src/components/workout/workout-logger";
import { fetchExercises } from "@/src/lib/api/exercises";
import { fetchPreviousSets } from "@/src/lib/api/workouts";

export default function WorkoutNewPage() {
  const { data: exercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: fetchExercises,
  });

  const { data: previousSets } = useQuery({
    queryKey: ["previousSets"],
    queryFn: fetchPreviousSets,
  });

  if (!exercises) {
    return (
      <div className="fixed inset-x-0 top-0 z-[100]">
        <div className="bg-primary h-0.5 animate-pulse" />
      </div>
    );
  }

  return <WorkoutLogger exercises={exercises} previousSets={previousSets ?? {}} />;
}
