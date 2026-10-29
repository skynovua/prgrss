import { useEffect, useState } from "react";

import { cn, useOnline } from "@/shared/lib";

import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";

export function LoadingBlocks({
  layout = "cards",
}: {
  layout?: "cards" | "list" | "stats" | "form";
}) {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      {layout === "stats" && (
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-16 rounded-lg" />
          ))}
        </div>
      )}
      {layout === "list" && <Skeleton className="h-11 w-full rounded-lg" />}
      {Array.from({ length: layout === "list" ? 5 : 2 }, (_, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col gap-4 px-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton
              className={cn(
                "w-full",
                layout === "list" ? "h-4" : layout === "form" ? "h-11" : "h-24"
              )}
            />
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
  layout?: "cards" | "list" | "stats" | "form";
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
