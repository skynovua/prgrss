import { useEffect } from "react";

const GUARDED_TARGET_SELECTOR =
  'a, button, img, svg, [role="button"], [role="tab"], [role="menuitem"], [data-slot="button"], [data-slot="switch"], [data-slot="tabs-trigger"], [data-slot="select-trigger"], [data-slot="select-item"]';

const isGuardedTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  !target.closest('[data-allow-selection="true"]') &&
  Boolean(target.closest(GUARDED_TARGET_SELECTOR));

const isTouchLikeDevice = () =>
  window.matchMedia("(hover: none), (pointer: coarse)").matches || navigator.maxTouchPoints > 0;

export const useMobileGestureGuard = () => {
  useEffect(() => {
    if (!isTouchLikeDevice()) {
      return;
    }

    const preventNativeMenu = (event: Event) => {
      if (isGuardedTarget(event.target)) {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", preventNativeMenu);
    document.addEventListener("dragstart", preventNativeMenu);

    return () => {
      document.removeEventListener("contextmenu", preventNativeMenu);
      document.removeEventListener("dragstart", preventNativeMenu);
    };
  }, []);
};
