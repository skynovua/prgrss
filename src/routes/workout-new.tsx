import { WorkoutLogger } from "@/src/components/workout/workout-logger";
import { useExercises } from "@/src/lib/hooks/use-exercises";
import { usePreviousSets } from "@/src/lib/hooks/use-workouts";

export default function WorkoutNewPage() {
  const { data: exercises } = useExercises();

  const { data: previousSets } = usePreviousSets();

  if (!exercises) {
    return (
      <div className="fixed inset-x-0 top-0 z-100">
        <div className="bg-primary h-0.5 animate-pulse" />
      </div>
    );
  }

  return <WorkoutLogger exercises={exercises} previousSets={previousSets ?? {}} />;
}
