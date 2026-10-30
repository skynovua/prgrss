import { LoadingBlocks, LoadingNotice, Skeleton } from "@/shared/ui";

export function ExerciseProgressLoading() {
  return (
    <section
      className="flex min-w-0 flex-1 flex-col gap-6 px-5 pt-7 pb-6 md:px-8"
      aria-label="Статистика вправи"
    >
      <header className="flex items-start gap-3">
        <Skeleton className="size-11 shrink-0 rounded-lg" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-muted-foreground text-sm">Статистика вправи</p>
          <Skeleton className="h-9 w-full max-w-80" aria-hidden="true" />
        </div>
      </header>
      <LoadingNotice />
      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="flex gap-2 overflow-hidden">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-9 w-20 shrink-0 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-5 w-40" />
      </div>
      <div aria-busy="true">
        <LoadingBlocks layout="exercise-stats" />
      </div>
    </section>
  );
}
