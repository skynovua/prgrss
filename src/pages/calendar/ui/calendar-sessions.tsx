import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { MUSCLE_GROUP_LABELS } from "@/shared/config";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/shared/ui";

import { type CalendarWorkout, formatCalendarDuration } from "../model/calendar";

export function CalendarSessions({
  workouts,
  returnTo,
  week = false,
}: {
  workouts: CalendarWorkout[];
  returnTo: string;
  week?: boolean;
}) {
  if (workouts.length === 0)
    return (
      <Empty className="px-3 py-10">
        <EmptyHeader>
          <EmptyTitle>
            {week ? "За цей тиждень немає записів" : "На цей день немає записів"}
          </EmptyTitle>
          <EmptyDescription>Тут з’являються збережені тренування.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );

  return (
    <div className="flex flex-col gap-3">
      {workouts.map((workout) => (
        <Link
          key={workout.id}
          to="/workout/$id"
          params={{ id: workout.id }}
          search={{ from: returnTo }}
          className="group focus-visible:ring-ring rounded-2xl outline-none focus-visible:ring-2"
          aria-label={`Відкрити тренування ${workout.name || "Тренування"}`}
        >
          <Card size="sm" className="group-hover:bg-muted/40 gap-2 py-4 transition-colors">
            <CardHeader className="gap-1.5">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="line-clamp-2 text-base leading-snug">
                  {workout.name || "Тренування"}
                </CardTitle>
                <ChevronRight className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              </div>
              <CardDescription className="flex flex-wrap gap-x-2 gap-y-1 tabular-nums">
                <time dateTime={workout.started_at ?? undefined}>
                  {workout.started_at
                    ? new Date(workout.started_at).toLocaleTimeString("uk-UA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Час не вказаний"}
                </time>
                <span aria-hidden="true">·</span>
                <span>{formatCalendarDuration(workout.durationMinutes)}</span>
              </CardDescription>
              <p className="text-muted-foreground text-xs">
                Вправи: {workout.exerciseCount} · Підходи: {workout.setsCount}
              </p>
            </CardHeader>
            {workout.muscleGroups.length > 0 && (
              <CardContent className="flex flex-wrap gap-1.5">
                {workout.muscleGroups.map((group) => (
                  <Badge key={group} variant="secondary">
                    {MUSCLE_GROUP_LABELS[group as keyof typeof MUSCLE_GROUP_LABELS] ?? group}
                  </Badge>
                ))}
              </CardContent>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}
