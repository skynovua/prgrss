import { LoadingNotice, Skeleton } from "@/shared/ui";

export function ExerciseLibraryLoading({ onRetry }: { onRetry?: () => void }) {
  return (
    <section className="flex flex-1 flex-col gap-5 px-5 pt-7 pb-6 md:px-8" aria-label="Вправи">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-3xl font-medium tracking-tight">Вправи</h1>
          <p className="text-muted-foreground text-sm">Знайди свій наступний рух.</p>
        </div>
        <Skeleton className="size-11 shrink-0 rounded-xl" aria-hidden="true" />
      </header>
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
