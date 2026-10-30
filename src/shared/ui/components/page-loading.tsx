import { useEffect, useState } from "react";

import { cn, useOnline } from "@/shared/lib";

import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";

export function LoadingBlocks({
  layout = "cards",
}: {
  layout?: "cards" | "list" | "stats" | "exercise-stats" | "form";
}) {
  if (layout === "stats" || layout === "exercise-stats") {
    const exerciseStats = layout === "exercise-stats";
    return (
      <div className="flex min-w-0 flex-col gap-6" aria-hidden="true">
        <div
          className={
            exerciseStats
              ? "grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4"
              : "divide-border grid grid-cols-3 divide-x"
          }
        >
          {Array.from({ length: exerciseStats ? 4 : 3 }, (_, index) => (
            <div
              key={index}
              className={cn(
                "flex min-w-0 flex-col gap-2",
                !exerciseStats && "px-3 first:pl-0 last:pr-0"
              )}
            >
              <Skeleton className="h-4 w-20 max-w-full" />
              <Skeleton className="h-7 w-16 max-w-full" />
              {!exerciseStats && <Skeleton className="h-3 w-14 max-w-full" />}
            </div>
          ))}
        </div>
        {Array.from({ length: 2 }, (_, index) => (
          <Card key={index} className="gap-4 py-5">
            <CardContent className="flex min-w-0 flex-col gap-4 px-5">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-36 max-w-full" />
                <Skeleton className="h-4 w-48 max-w-full" />
              </div>
              {!exerciseStats && index === 1 && (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
              )}
              {((exerciseStats && index === 0) || (!exerciseStats && index === 1)) && (
                <>
                  <div className="flex gap-2 overflow-hidden">
                    {[0, 1, 2].map((item) => (
                      <Skeleton key={item} className="h-9 w-20 shrink-0 rounded-lg" />
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </>
              )}
              {exerciseStats && index === 1 ? (
                <div className="divide-border divide-y">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="flex items-center justify-between gap-4 py-3">
                      <Skeleton className="h-4 w-32 max-w-1/2" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <Skeleton
                  className={cn(
                    "w-full rounded-xl",
                    index === 0 && !exerciseStats ? "h-[170px]" : "h-[190px]"
                  )}
                />
              )}
              {!exerciseStats && index === 0 && <Skeleton className="h-3 w-48 max-w-full" />}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div className="flex flex-col gap-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <Card key={item} size="sm" className="gap-2 py-4">
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      {[0, 1].map((item) => (
        <Card key={item}>
          <CardContent className="flex flex-col gap-4 px-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className={cn("w-full", layout === "form" ? "h-11" : "h-24")} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LoadingNotice({ onRetry }: { onRetry?: () => void }) {
  const [slow, setSlow] = useState(false);
  const online = useOnline();
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 12_000);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);
  return (
    <div className={cn("flex flex-col items-start gap-3", online && !slow && "sr-only")}>
      <p role="status" className="text-muted-foreground text-sm">
        {!online
          ? "Немає з’єднання. Продовжимо завантаження, коли мережа відновиться."
          : slow
            ? "Завантаження триває довше, ніж зазвичай."
            : "Завантажуємо дані…"}
      </p>
      {slow && online && onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Спробувати ще
        </Button>
      )}
    </div>
  );
}

export function PageLoading({
  title,
  layout,
  onRetry,
}: {
  title: string;
  layout?: "cards" | "list" | "stats" | "exercise-stats" | "form";
  onRetry?: () => void;
}) {
  return (
    <section className="flex flex-1 flex-col gap-6 px-5 pt-7 pb-6 md:px-8" aria-label={title}>
      <h1 className="text-3xl font-medium tracking-tight">{title}</h1>
      <LoadingNotice onRetry={onRetry} />
      <div aria-busy="true">
        <LoadingBlocks layout={layout} />
      </div>
    </section>
  );
}
