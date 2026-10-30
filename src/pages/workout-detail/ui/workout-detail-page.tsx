import { useNavigate, useParams, useSearch } from "@tanstack/react-router";

import { WorkoutDetail, WorkoutLoading } from "@/entities/workout";
import { useWorkoutDetail } from "@/entities/workout";
import { PageError, RefreshNotice } from "@/shared/ui";

import { WorkoutMuscleDetails } from "./workout-muscle-details";

export default function WorkoutDetailPage() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const { from } = useSearch({ from: "/app/workout/$id" });

  const { data, isPending, isError, refetch } = useWorkoutDetail(id);

  if (!id)
    return (
      <PageError title="Тренування не знайдено" description="Перевір посилання на тренування." />
    );
  if (isPending) return <WorkoutLoading key={id} view="detail" onRetry={() => void refetch()} />;
  if (isError && !data)
    return <PageError title="Тренування не завантажилося" onRetry={() => void refetch()} />;

  if (!data) {
    return (
      <PageError
        title="Тренування не знайдено"
        description="Його видалено або воно недоступне для цього акаунта."
      />
    );
  }

  const calendarParams = from ? new URL(from, "https://prgrss.local").searchParams : null;
  return (
    <>
      {isError && <RefreshNotice onRetry={() => void refetch()} />}
      <WorkoutDetail
        key={id}
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
      >
        <WorkoutMuscleDetails
          muscles={data.muscles}
          hasUnmappedExercises={data.hasUnmappedExercises}
        />
      </WorkoutDetail>
    </>
  );
}
