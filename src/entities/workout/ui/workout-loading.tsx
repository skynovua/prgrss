import { useState } from "react";

import { cn } from "@/shared/lib";
import { LoadingNotice, Skeleton } from "@/shared/ui";

import { restoreActiveWorkoutDraft } from "../model/persistence";

export function WorkoutExerciseListLoading({
  exercises,
  collapsedCards = {},
}: {
  exercises?: Array<{ instanceId: string; trackingType?: string; sets: Array<unknown> }>;
  collapsedCards?: Record<string, boolean>;
}) {
  const items: NonNullable<typeof exercises> =
    exercises ?? Array.from({ length: 3 }, (_, index) => ({ instanceId: String(index), sets: [] }));
  return (
    <div role="status" aria-label="Завантажуємо вправи тренування" aria-busy="true">
      <div className="flex flex-col gap-3" aria-hidden="true">
        {items.map((exercise) => (
          <div key={exercise.instanceId} className="bg-card ring-border rounded-2xl py-2 ring-1">
            <div className="flex h-16 items-center gap-2 px-3">
              <Skeleton className="size-11 shrink-0 rounded-xl" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4 max-w-56" />
                <Skeleton className="h-1 w-28 max-w-full rounded-full" />
              </div>
              <Skeleton className="size-8 shrink-0 rounded-lg" />
            </div>
            {exercises && !collapsedCards[exercise.instanceId] && (
              <div className="flex flex-col gap-2 px-3 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                {Array.from({ length: exercise.sets.length }, (_, index) => (
                  <div
                    key={index}
                    className={
                      exercise.trackingType === "duration"
                        ? "grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] gap-2 py-2"
                        : "grid grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-2 py-2"
                    }
                  >
                    <Skeleton className="h-11 rounded-lg" />
                    <Skeleton className="h-11 rounded-lg" />
                    {exercise.trackingType !== "duration" && (
                      <Skeleton className="h-11 rounded-lg" />
                    )}
                    <Skeleton className="h-11 rounded-lg" />
                  </div>
                ))}
                <Skeleton className="h-11 w-full rounded-full" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkoutLoading({
  view,
  onRetry,
}: {
  view: "new" | "edit" | "detail";
  onRetry?: () => void;
}) {
  const detail = view === "detail";
  const [draft] = useState(() => (view === "new" ? restoreActiveWorkoutDraft() : null));
  const emptyWorkout = view === "new" && !draft?.exercises.length;
  return (
    <section
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-5 px-4 pb-6",
        view === "new" && "sm:px-5 md:px-8"
      )}
      aria-label={view === "edit" ? "Редагування тренування" : "Тренування"}
    >
      <header
        className={cn(
          "border-border/30 -mx-4 flex min-h-20 items-center justify-between gap-3 border-b px-4 pt-4 pb-3",
          view === "new" && "sm:-mx-5 sm:px-5 md:-mx-8 md:px-8"
        )}
        aria-hidden="true"
      >
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-2",
            view === "edit" ? "items-start" : "items-center"
          )}
        >
          {view === "new" ? (
            <span className="text-muted-foreground text-xs font-medium">Тренування</span>
          ) : (
            <span className={view === "edit" ? "text-xl font-medium" : "text-lg font-medium"}>
              {view === "edit" ? "Редагування" : "Тренування"}
            </span>
          )}
          {view === "new" ? (
            <Skeleton className="h-7 w-20" />
          ) : view === "edit" ? (
            <Skeleton className="h-3 w-36 max-w-full" />
          ) : null}
        </div>
        <Skeleton className="size-11 shrink-0 rounded-full" />
      </header>
      <LoadingNotice onRetry={onRetry} />
      <div className="flex flex-col gap-5" aria-busy="true">
        {emptyWorkout ? (
          <div className="flex flex-col items-center gap-4 px-4 py-14" aria-hidden="true">
            <Skeleton className="mb-2 size-10 rounded-xl" />
            <Skeleton className="h-6 w-56 max-w-full" />
            <Skeleton className="h-4 w-full max-w-80" />
            <Skeleton className="h-4 w-3/4 max-w-64" />
            <Skeleton className="mt-2 h-12 w-44 rounded-xl" />
          </div>
        ) : (
          <>
            {detail ? (
              <>
                <div className="flex flex-col gap-2" aria-hidden="true">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-6 w-3/4 max-w-full" />
                </div>
                <div className="grid grid-cols-3 gap-3" aria-hidden="true">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="bg-card ring-border flex h-20 flex-col items-center justify-center gap-2 rounded-xl ring-1"
                    >
                      <Skeleton className="h-6 w-14" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                </div>
              </>
            ) : view === "new" ? (
              <div className="flex justify-between gap-3" aria-hidden="true">
                <Skeleton className="h-4 w-36 max-w-[55%]" />
                <Skeleton className="h-4 w-20 max-w-[40%]" />
              </div>
            ) : null}
            <WorkoutExerciseListLoading exercises={view === "new" ? draft?.exercises : undefined} />
            {detail ? (
              <div
                className="bg-card ring-border flex flex-col gap-4 rounded-3xl p-5 ring-1"
                aria-hidden="true"
              >
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="mx-auto aspect-[637/1242] w-full max-w-44 rounded-2xl" />
                  <Skeleton className="mx-auto aspect-[637/1242] w-full max-w-44 rounded-2xl" />
                </div>
              </div>
            ) : (
              <Skeleton className="h-11 w-full rounded-full" aria-hidden="true" />
            )}
          </>
        )}
      </div>
    </section>
  );
}
