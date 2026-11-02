import { Suspense } from "react";

import type { ExerciseMuscleTarget } from "../model/exercise-catalog";
import { DeferredAnatomyMap } from "./anatomy-deferred";
import { AnatomyLoading } from "./anatomy-loading";

export function AnatomyPreview({ highlights }: { highlights: ExerciseMuscleTarget[] }) {
  return (
    <Suspense fallback={<AnatomyLoading layout="both" compact />}>
      <DeferredAnatomyMap
        muscles={highlights.map((muscle) => ({ key: muscle.muscleKey, name: muscle.name }))}
        highlights={highlights}
        layout="both"
        compact
      />
    </Suspense>
  );
}
