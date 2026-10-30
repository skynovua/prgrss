import { lazy, Suspense } from "react";

import { Skeleton } from "@/shared/ui";

import type { ExerciseMuscleTarget } from "../model/exercise-catalog";

const LazyAnatomyMap = lazy(() =>
  import("./anatomy-map").then(({ AnatomyMap }) => ({ default: AnatomyMap }))
);

export function AnatomyPreview({ highlights }: { highlights: ExerciseMuscleTarget[] }) {
  return (
    <Suspense fallback={<Skeleton className="aspect-square w-full rounded-2xl" />}>
      <LazyAnatomyMap
        muscles={highlights.map((muscle) => ({ key: muscle.muscleKey, name: muscle.name }))}
        highlights={highlights}
        layout="both"
        className="[&_path]:stroke-muted-foreground"
        compact
      />
    </Suspense>
  );
}
