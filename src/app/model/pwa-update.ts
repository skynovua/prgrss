export function canOfferPwaUpdate(pathname: string) {
  return (
    pathname === "/dashboard" ||
    pathname === "/calendar" ||
    pathname === "/exercises" ||
    pathname === "/progress" ||
    pathname.startsWith("/progress/exercise/") ||
    pathname === "/achievements" ||
    pathname === "/install"
  );
}

export function createPwaUpdateManager({
  serviceWorker,
  page,
  browser,
  reload,
  canReload,
}: {
  serviceWorker: ServiceWorkerContainer;
  page: Document;
  browser: Window;
  reload: () => void;
  canReload: () => boolean;
}) {
  let registration: ServiceWorkerRegistration | undefined;
  let currentController = serviceWorker.controller;
  let controllerChanged = false;
  let waitingWorker: ServiceWorker | null = null;
  let updateRequested = false;
  let available = false;
  let started = false;
  let registering = false;
  const listeners = new Set<() => void>();

  function setAvailable(value: boolean) {
    if (available === value) return;
    available = value;
    listeners.forEach((listener) => listener());
  }

  function watchWorker(worker: ServiceWorker) {
    const onStateChange = () => {
      if (worker.state === "installed" && serviceWorker.controller) {
        waitingWorker = worker;
        setAvailable(true);
      } else if (worker.state === "redundant" && waitingWorker === worker) {
        waitingWorker = null;
        updateRequested = false;
        if (!controllerChanged) setAvailable(false);
      }
    };
    worker.addEventListener("statechange", onStateChange);
    onStateChange();
  }

  function checkForUpdate() {
    if (page.visibilityState !== "visible") return;
    if (!registration) {
      register();
      return;
    }
    void registration.update().catch(() => {
      // Помилка мережі не заважає роботі та повторній перевірці пізніше.
    });
  }

  function register() {
    if (registering || registration) return;
    registering = true;
    void serviceWorker.register("/sw.js", { scope: "/" }).then(
      (registered) => {
        registering = false;
        registration = registered;
        if (registered.waiting && serviceWorker.controller) {
          waitingWorker = registered.waiting;
          setAvailable(true);
        }
        if (registered.installing) watchWorker(registered.installing);
        registered.addEventListener("updatefound", () => {
          if (registered.installing) watchWorker(registered.installing);
        });
      },
      () => {
        registering = false;
        // Повернення в застосунок або відновлення мережі повторить реєстрацію.
      }
    );
  }

  function start() {
    if (started) return;
    started = true;
    page.addEventListener("visibilitychange", checkForUpdate);
    browser.addEventListener("online", checkForUpdate);
    serviceWorker.addEventListener("controllerchange", () => {
      const nextController = serviceWorker.controller;
      if (!nextController || nextController === currentController) return;
      const wasControlled = Boolean(currentController);
      currentController = nextController;
      if (updateRequested) {
        updateRequested = false;
        controllerChanged = true;
        if (canReload()) reload();
        else setAvailable(true);
      } else if (wasControlled) {
        controllerChanged = true;
        setAvailable(true);
      }
    });
    register();
  }

  function applyUpdate() {
    if (!canReload()) return false;
    if (updateRequested) return true;
    const worker = registration?.waiting ?? waitingWorker;
    if (worker?.state === "installed") {
      updateRequested = true;
      try {
        worker.postMessage({ type: "SKIP_WAITING" });
        return true;
      } catch {
        updateRequested = false;
        return false;
      }
    }
    if (controllerChanged) {
      reload();
      return true;
    }
    return false;
  }

  return {
    start,
    applyUpdate,
    getSnapshot: () => available,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
