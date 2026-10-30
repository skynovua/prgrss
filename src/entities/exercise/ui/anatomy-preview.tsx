import { lazy, Suspense } from "react";

import type { ExerciseMuscleTarget } from "../model/exercise-catalog";
import { AnatomyLoading } from "./anatomy-loading";

const LazyAnatomyMap = lazy(() =>
  import("./anatomy-map").then(({ AnatomyMap }) => ({ default: AnatomyMap }))
);

export function AnatomyPreview({ highlights }: { highlights: ExerciseMuscleTarget[] }) {
  return (
    <Suspense fallback={<AnatomyLoading layout="both" compact />}>
      <LazyAnatomyMap
        muscles={highlights.map((muscle) => ({ key: muscle.muscleKey, name: muscle.name }))}
        highlights={highlights}
        layout="both"
        compact
      />
    </Suspense>
  );
}
