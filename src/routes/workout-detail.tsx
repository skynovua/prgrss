import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { WorkoutDetail } from "@/src/components/workout/workout-detail";
import { fetchWorkoutDetail } from "@/src/lib/api/workouts";

export default function WorkoutDetailPage() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["workout", id],
    queryFn: () => fetchWorkoutDetail(id!),
    enabled: !!id,
  });

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
