import { lazy, Suspense } from "react";

import { EQUIPMENT_LABELS } from "@/shared/config";
import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";

import type { ExerciseCatalogItem } from "../model/exercise-catalog";

const LazyAnatomyMap = lazy(() =>
  import("./anatomy-map").then(({ AnatomyMap }) => ({ default: AnatomyMap }))
);

interface ExerciseDetailsDialogProps {
  exercise: ExerciseCatalogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MuscleList({
  title,
  muscles,
}: {
  title: string;
  muscles: ExerciseCatalogItem["muscles"];
}) {
  if (muscles.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-col gap-2">
        {muscles.map((muscle) => (
          <div key={muscle.muscleKey} className="bg-muted flex items-center gap-3 rounded-2xl p-3">
            <span className="min-w-0 flex-1 text-sm font-medium">{muscle.name}</span>
            <Badge variant={muscle.activationScore >= 8 ? "default" : "secondary"}>
              {muscle.activationScore}/10
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ExerciseDetailsDialog({
  exercise,
  open,
  onOpenChange,
}: ExerciseDetailsDialogProps) {
  const primaryMuscles = exercise?.muscles.filter((muscle) => muscle.activationScore >= 8) ?? [];
  const secondaryMuscles = exercise?.muscles.filter((muscle) => muscle.activationScore < 8) ?? [];
  const mapMuscles =
    exercise?.muscles.map((muscle) => ({ key: muscle.muscleKey, name: muscle.name })) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{exercise?.name ?? "Деталі вправи"}</DialogTitle>
          <DialogDescription>
            {exercise?.equipment ? EQUIPMENT_LABELS[exercise.equipment] : "Без обладнання"}
          </DialogDescription>
        </DialogHeader>

        {exercise && (
          <div className="flex flex-col gap-6">
            {exercise.muscles.length > 0 ? (
              <Suspense
                fallback={
                  <div
                    className="bg-muted mx-auto aspect-[792/1427] w-full max-w-44 rounded-3xl"
                    aria-busy="true"
                  />
                }
              >
                <LazyAnatomyMap
                  muscles={mapMuscles}
                  highlights={exercise.muscles}
                  compact
                  className="bg-muted rounded-3xl p-3"
                />
              </Suspense>
            ) : (
              <p className="text-muted-foreground text-sm">
                Для цієї вправи анатомічна розмітка ще не додана.
              </p>
            )}

            <MuscleList title="Основні" muscles={primaryMuscles} />
            <MuscleList title="Додаткові" muscles={secondaryMuscles} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
