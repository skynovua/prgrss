import { useNavigate, useParams, useSearch } from "@tanstack/react-router";

import { WorkoutDetail } from "@/entities/workout";
import { useWorkoutDetail } from "@/entities/workout";
import { LoaderBar } from "@/shared/ui";

export default function WorkoutDetailPage() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const { from } = useSearch({ from: "/app/workout/$id" });

  const { data, isLoading } = useWorkoutDetail(id);

  if (isLoading) {
    return <LoaderBar />;
  }

  if (!data) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const calendarParams = from ? new URL(from, "https://prgrss.local").searchParams : null;
  return (
    <WorkoutDetail
      workout={data.workout}
      exercises={data.exercises}
      returnSearch={{ from }}
      onBack={
        calendarParams
          ? () => {
              void navigate({
                to: "/calendar",
                search: {
                  date: calendarParams.get("date") ?? undefined,
                  view: calendarParams.get("view") === "week" ? "week" : undefined,
                  day: calendarParams.get("day") === "true" ? true : undefined,
                },
              });
            }
          : undefined
      }
    />
  );
}
