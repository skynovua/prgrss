import { LoadingNotice, PageHeader, Skeleton } from "@/shared/ui";

export function ExerciseLibraryLoading({ onRetry }: { onRetry?: () => void }) {
  return (
    <section className="flex flex-1 flex-col gap-5 px-5 pb-6 md:px-8" aria-label="Вправи">
      <PageHeader className="justify-between gap-3">
        <h1 className="min-w-0 text-xl font-medium tracking-tight">Вправи</h1>
        <Skeleton className="size-11 shrink-0 rounded-xl" aria-hidden="true" />
      </PageHeader>
      <LoadingNotice onRetry={onRetry} />
      <div className="flex flex-col gap-5" aria-busy="true" aria-hidden="true">
        <Skeleton className="h-12 w-full rounded-full" />
        <div className="flex flex-col gap-3 pt-3">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-52" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
