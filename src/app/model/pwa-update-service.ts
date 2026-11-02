import { canOfferPwaUpdate, createPwaUpdateManager } from "./pwa-update";

const manager =
  import.meta.env.PROD && "serviceWorker" in navigator
    ? createPwaUpdateManager({
        serviceWorker: navigator.serviceWorker,
        page: document,
        browser: window,
        reload: () => window.location.reload(),
        canReload: () => canOfferPwaUpdate(window.location.pathname),
      })
    : null;

export const startPwaUpdates = () => manager?.start();
export const applyPwaUpdate = () => manager?.applyUpdate();
export const getPwaUpdateSnapshot = () => manager?.getSnapshot() ?? false;
export const subscribeToPwaUpdates = (listener: () => void) =>
  manager?.subscribe(listener) ?? (() => {});
