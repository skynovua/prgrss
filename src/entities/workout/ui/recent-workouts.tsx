import { Link } from "@tanstack/react-router";
import { Badge } from "@/shared/ui";
import { ChevronRight } from "lucide-react";
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from "@/entities/workout";

interface RecentWorkout {
  id: string;
  name: string | null;
  started_at: string | null;
  setsCount: number;
  volume: number;
  muscleGroups: string[];
  duration: number | null;
}

export function RecentWorkouts({ workouts }: { workouts: RecentWorkout[] }) {
  if (workouts.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="text-muted-foreground mb-1 text-xs font-medium tracking-wider uppercase">
        Останні тренування
      </h2>
      <div className="bg-card divide-border divide-y rounded-xl">
        {workouts.map((workout) => (
          <WorkoutRow key={workout.id} workout={workout} />
        ))}
      </div>
    </div>
  );
}

function WorkoutRow({ workout }: { workout: RecentWorkout }) {
  const volumeLabel =
    workout.volume > 1000
      ? `${(workout.volume / 1000).toFixed(1)}т`
      : `${Math.round(workout.volume)} кг`;

  const meta: string[] = [];
  if (workout.started_at) {
    meta.push(
      new Date(workout.started_at).toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "short",
      })
    );
  }
  if (workout.duration) {
    meta.push(`${workout.duration} хв`);
  }
  meta.push(`${workout.setsCount} підх`);
  meta.push(volumeLabel);

  return (
    <Link
      to="/workout/$id"
      params={{ id: workout.id }}
      className="active:bg-accent/50 flex items-center gap-3 px-4 py-3 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{workout.name ?? "Тренування"}</span>
          {workout.muscleGroups.length > 0 && (
            <div className="flex gap-1">
              {workout.muscleGroups.slice(0, 2).map((mg) => (
                <Badge key={mg} variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
                  {MUSCLE_GROUP_LABELS[mg as MuscleGroup] ?? mg}
                </Badge>
              ))}
              {workout.muscleGroups.length > 2 && (
                <span className="text-muted-foreground text-[10px]">
                  +{workout.muscleGroups.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">{meta.join(" · ")}</p>
      </div>
      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
    </Link>
  );
}
