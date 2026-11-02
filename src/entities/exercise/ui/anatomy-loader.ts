let loadingMap: Promise<typeof import("./anatomy-map")> | undefined;

export function preloadAnatomyMap() {
  loadingMap ??= import("./anatomy-map").then(
    (module) => module,
    (error: unknown) => {
      loadingMap = undefined;
      throw error;
    }
  );
  return loadingMap;
}
