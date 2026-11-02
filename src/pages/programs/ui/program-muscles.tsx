import { AnatomyPreview, useExercises } from "@/entities/exercise";
import type { WorkoutExercise } from "@/entities/workout";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/shared/ui";

import { programMuscles } from "../model/program-muscles";

export function ProgramMuscles({ exercises }: { exercises: WorkoutExercise[] }) {
  const catalog = useExercises({ enabled: exercises.length > 0 });
  const { muscles, hasUnmappedExercises } = programMuscles(exercises, catalog.data ?? []);
  if (
    exercises.length > 0 &&
    catalog.isPending &&
    catalog.fetchStatus !== "paused" &&
    !catalog.data
  )
    return <ProgramMusclesLoading />;
  return (
    <Card size="sm" className="rounded-3xl py-5">
      <CardHeader>
        <CardTitle>Задіяні м’язи</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {exercises.length === 0 ? (
          <p className="text-muted-foreground text-sm">Додай вправи, щоб побачити задіяні м’язи.</p>
        ) : !catalog.data ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-muted-foreground text-sm" role="alert">
              Не вдалося завантажити анатомію вправ.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void catalog.refetch()}
            >
              Спробувати ще
            </Button>
          </div>
        ) : muscles.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Для цих вправ анатомію ще не вказано або вправи недоступні.
          </p>
        ) : (
          <>
            {catalog.isError && (
              <p className="text-muted-foreground text-xs">
                Не вдалося оновити анатомію. Показано збережені дані.
              </p>
            )}
            <div className="grid min-w-0 gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-start">
              <div className="flex min-w-0 flex-col gap-4">
                {[
                  {
                    title: "Основні",
                    targets: muscles.filter((muscle) => muscle.activationScore >= 8),
                    variant: "secondary" as const,
                  },
                  {
                    title: "Додаткові",
                    targets: muscles.filter((muscle) => muscle.activationScore < 8),
                    variant: "outline" as const,
                  },
                ].map(
                  ({ title, targets, variant }) =>
                    targets.length > 0 && (
                      <section key={title} className="flex flex-col gap-2" aria-label={title}>
                        <h3 className="text-sm font-medium">{title}</h3>
                        <ul className="flex flex-wrap gap-2">
                          {targets.map((muscle) => (
                            <li key={muscle.muscleKey}>
                              <Badge
                                variant={variant}
                                className="h-auto max-w-full px-3 py-1.5 whitespace-normal"
                              >
                                {muscle.name}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )
                )}
              </div>
              <AnatomyPreview highlights={muscles} />
            </div>
            {hasUnmappedExercises && (
              <p className="text-muted-foreground text-xs">
                Для частини вправ анатомію не вказано або вправи недоступні.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ProgramMusclesLoading() {
  return (
    <Card
      size="sm"
      className="rounded-3xl py-5"
      aria-label="Завантажуємо анатомію"
      aria-busy="true"
    >
      <CardHeader>
        <CardTitle>Задіяні м’язи</CardTitle>
      </CardHeader>
      <CardContent aria-hidden="true">
        <div className="grid min-w-0 gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-start">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-36 max-w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-28 max-w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="mx-auto aspect-[637/1242] w-full max-w-44" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
