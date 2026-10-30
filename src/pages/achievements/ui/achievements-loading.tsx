import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/shared/lib";
import { buttonVariants, Card, CardContent, LoadingNotice, Skeleton } from "@/shared/ui";

export function AchievementsHeader() {
  return (
    <header className="flex items-start gap-3">
      <Link
        to="/dashboard"
        aria-label="На головну"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "-ml-2 shrink-0")}
      >
        <ArrowLeft />
      </Link>
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Досягнення</h1>
        <p className="text-muted-foreground text-sm leading-6">Твої зусилля стають нагородами.</p>
      </div>
    </header>
  );
}

export function AchievementsLoading({ onRetry }: { onRetry?: () => void }) {
  return (
    <section className="flex flex-1 flex-col gap-6 px-5 pt-7 pb-6 md:px-8" aria-label="Досягнення">
      <AchievementsHeader />
      <LoadingNotice onRetry={onRetry} />
      <div className="flex flex-col gap-6" aria-busy="true">
        <div className="flex flex-col gap-4" aria-hidden="true">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="size-16 rounded-2xl" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <Card className="gap-4 py-5" aria-hidden="true">
          <CardContent className="flex flex-col gap-4 px-5">
            <Skeleton className="h-4 w-36" />
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 shrink-0 rounded-2xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4" aria-hidden="true">
          <Skeleton className="h-5 w-20" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="border-border flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border p-4"
              >
                <Skeleton className="size-16 rounded-2xl" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
