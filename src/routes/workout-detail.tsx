import { useParams, useNavigate } from "@tanstack/react-router";
import { WorkoutDetail } from "@/src/components/workout/workout-detail";
import { useWorkoutDetail } from "@/src/lib/hooks/use-workouts";

export default function WorkoutDetailPage() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();

  const { data, isLoading } = useWorkoutDetail(id);

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

  return <WorkoutDetail workout={data.workout} exercises={data.exercises} />;
}
