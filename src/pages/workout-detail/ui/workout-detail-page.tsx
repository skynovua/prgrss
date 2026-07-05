import { useParams, useNavigate } from "@tanstack/react-router";
import { WorkoutDetail } from "@/entities/workout";
import { useWorkoutDetail } from "@/entities/workout";
import { LoaderBar } from "@/shared/ui";

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
