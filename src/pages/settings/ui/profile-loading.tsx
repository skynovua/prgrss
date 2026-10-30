import { Card, CardContent, CardHeader, CardTitle, LoadingNotice, Skeleton } from "@/shared/ui";

export function ProfileLoading({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <LoadingNotice onRetry={onRetry} />
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Завантаження профілю">
        <Card className="p-0" aria-hidden="true">
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="size-20 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-7 w-40 max-w-full" />
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="mt-1 h-3 w-44 max-w-full" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-0" aria-hidden="true">
          <CardHeader className="px-4 pt-4">
            <CardTitle>Профіль</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-4 pt-0">
            {[0, 1].map((item) => (
              <div key={item} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="p-0" aria-hidden="true">
          <CardHeader className="px-4 pt-4">
            <CardTitle>Тренування</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Skeleton className="h-16 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
