import { type ComponentProps, lazy, Suspense } from "react";

import { preloadAnatomyMap } from "./anatomy-loader";

type AnatomyProps = ComponentProps<typeof import("./anatomy-map").AnatomyMap>;
type DeferredAnatomyProps = AnatomyProps | { preloadOnly: true };

export const DeferredAnatomyMap = lazy(() =>
  preloadAnatomyMap().then(({ AnatomyMap }) => ({
    default: function AnatomyMapEntry(props: DeferredAnatomyProps) {
      if ("preloadOnly" in props) return null;
      return <AnatomyMap {...props} />;
    },
  }))
);

export function AnatomyWarmup() {
  return (
    <Suspense fallback={null}>
      <DeferredAnatomyMap preloadOnly />
    </Suspense>
  );
}
