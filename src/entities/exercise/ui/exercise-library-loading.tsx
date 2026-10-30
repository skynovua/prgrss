import { Card, CardContent, LoadingNotice, Skeleton } from "@/shared/ui";

export function ExerciseLibraryLoading({ onRetry }: { onRetry?: () => void }) {
  return (
    <section className="flex flex-1 flex-col gap-5 px-5 pt-7 pb-6 md:px-8" aria-label="Вправи">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-3xl font-medium tracking-tight">Вправи</h1>
          <p className="text-muted-foreground text-sm">Знайди свій наступний рух.</p>
        </div>
        <Skeleton className="size-11 shrink-0 rounded-lg" aria-hidden="true" />
      </header>
      <LoadingNotice onRetry={onRetry} />
      <div className="flex flex-col gap-5" aria-busy="true">
        <div className="flex flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-11 w-full rounded-lg" />
          <div className="flex gap-2 overflow-hidden">
            {[16, 20, 16, 20].map((width, index) => (
              <Skeleton
                key={index}
                className={
                  width === 16 ? "h-9 w-16 shrink-0 rounded-lg" : "h-9 w-20 shrink-0 rounded-lg"
                }
              />
            ))}
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
        <Skeleton className="h-14 w-full rounded-2xl" aria-hidden="true" />
        <Skeleton className="h-3 w-28" aria-hidden="true" />
        <div className="flex flex-col gap-2" aria-hidden="true">
          <Skeleton className="h-4 w-20" />
          {[0, 1, 2, 3, 4].map((index) => (
            <Card key={index} size="sm" className="p-0 data-[size=sm]:py-0">
              <CardContent className="flex min-h-[52px] items-center gap-3 px-3 py-1">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-3/4 max-w-56" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
