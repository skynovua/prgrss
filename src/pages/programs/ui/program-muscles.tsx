import { AnatomyPreview, useExercises } from "@/entities/exercise";
import type { WorkoutExercise } from "@/entities/workout";
import { Badge, Button, Card, CardContent, Skeleton } from "@/shared/ui";

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
    <section className="flex flex-col gap-3" aria-labelledby="program-muscles-heading">
      <h2 id="program-muscles-heading" className="text-base font-semibold">
        Задіяні м’язи
      </h2>
      <Card size="sm" className="rounded-3xl py-5">
        <CardContent className="flex flex-col gap-4">
          {exercises.length === 0 ? (
            <div className="grid min-h-56 min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3">
              <p className="text-muted-foreground text-sm">
                Додай вправи, щоб побачити задіяні м’язи.
              </p>
              <AnatomyPreview highlights={[]} />
            </div>
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
              <div className="grid min-h-56 min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3">
                <div className="relative min-w-0 self-stretch">
                  <div
                    className="absolute inset-0 flex scrollbar-none flex-col gap-4 overflow-y-auto"
                    role="region"
                    aria-label="Список задіяних м’язів"
                    tabIndex={0}
                  >
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
                            <ul className="flex flex-col items-start gap-2">
                              {targets.map((muscle) => (
                                <li key={muscle.muscleKey} className="max-w-full min-w-0">
                                  <Badge
                                    variant={variant}
                                    className="h-auto max-w-full px-3 py-1.5 whitespace-normal"
                                  >
                                    <span className="min-w-0 text-left break-words">
                                      {muscle.name}
                                    </span>
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                          </section>
                        )
                    )}
                  </div>
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
    </section>
  );
}

export function ProgramMusclesLoading() {
  return (
    <section className="flex flex-col gap-3" aria-label="Завантажуємо анатомію" aria-busy="true">
      <h2 className="text-base font-semibold">Задіяні м’язи</h2>
      <Card size="sm" className="rounded-3xl py-5">
        <CardContent aria-hidden="true">
          <div className="grid min-h-56 min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3">
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
    </section>
  );
}
