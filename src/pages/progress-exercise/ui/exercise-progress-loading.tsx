import { LoadingBlocks, LoadingNotice, PageHeader, Skeleton } from "@/shared/ui";

export function ExerciseProgressLoading() {
  return (
    <section
      className="flex min-w-0 flex-1 flex-col gap-6 px-5 pb-6 md:px-8"
      aria-label="Статистика вправи"
    >
      <PageHeader className="gap-3">
        <Skeleton className="size-11 shrink-0 rounded-lg" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-6 w-full max-w-80" aria-hidden="true" />
        </div>
      </PageHeader>
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
