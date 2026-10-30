import { AnatomyPreview, type ExerciseMuscleTarget } from "@/entities/exercise";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

interface WorkoutMuscleDetailsProps {
  muscles: ExerciseMuscleTarget[];
  hasUnmappedExercises: boolean;
}

export function WorkoutMuscleDetails({ muscles, hasUnmappedExercises }: WorkoutMuscleDetailsProps) {
  const uniqueMuscles = new Map<string, ExerciseMuscleTarget>();
  for (const muscle of muscles) {
    const previous = uniqueMuscles.get(muscle.muscleKey);
    if (!previous || previous.activationScore < muscle.activationScore) {
      uniqueMuscles.set(muscle.muscleKey, muscle);
    }
  }
  const sortedMuscles = Array.from(uniqueMuscles.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "uk")
  );
  const primary = sortedMuscles.filter((muscle) => muscle.activationScore >= 8);
  const secondary = sortedMuscles.filter((muscle) => muscle.activationScore < 8);

  return (
    <Card size="sm" className="rounded-3xl py-5">
      <CardHeader>
        <CardTitle>Задіяні м’язи</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sortedMuscles.length > 0 ? (
          <div className="grid min-w-0 gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-start">
            <div className="flex min-w-0 flex-col gap-4">
              {[
                { title: "Основні", targets: primary, variant: "secondary" as const },
                { title: "Додаткові", targets: secondary, variant: "outline" as const },
              ].map(
                ({ title, targets, variant }) =>
                  targets.length > 0 && (
                    <section key={title} className="flex flex-col gap-2" aria-label={title}>
                      <h3 className="text-sm font-medium">{title}</h3>
                      <ul className="flex flex-wrap gap-2">
                        {targets.map((muscle) => (
                          <li key={muscle.muscleKey} className="max-w-full min-w-0">
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
            <AnatomyPreview highlights={sortedMuscles} />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Для вправ цього тренування м’язи ще не вказані.
          </p>
        )}
        {sortedMuscles.length > 0 && hasUnmappedExercises && (
          <p className="text-muted-foreground text-xs">Для частини вправ м’язи ще не вказані.</p>
        )}
      </CardContent>
    </Card>
  );
}
