import { useParams, useNavigate } from "@tanstack/react-router";
import { WorkoutDetail } from "@/src/components/workout/workout-detail";
import { useWorkoutDetail } from "@/src/lib/hooks/use-workouts";
import { LoaderBar } from "@/src/components/ui/loader-bar";

export default function WorkoutDetailPage() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();

  const { data, isLoading } = useWorkoutDetail(id);

  if (isLoading) {
    return <LoaderBar />;
  }

  if (!data) {
    navigate({ to: "/dashboard" });
    return null;
  }

  return <WorkoutDetail workout={data.workout} exercises={data.exercises} />;
}
