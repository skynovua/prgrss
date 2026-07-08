import { useEffect } from "react";

const EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable="true"], [data-allow-selection="true"]';

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest(EDITABLE_SELECTOR));

const isTouchLikeDevice = () =>
  window.matchMedia("(hover: none), (pointer: coarse)").matches ||
  navigator.maxTouchPoints > 0;

export const useMobileGestureGuard = () => {
  useEffect(() => {
    if (!isTouchLikeDevice()) {
      return;
    }

    const preventNativeMenu = (event: Event) => {
      if (!isEditableTarget(event.target)) {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", preventNativeMenu);
    document.addEventListener("dragstart", preventNativeMenu);
    document.addEventListener("selectstart", preventNativeMenu);

    return () => {
      document.removeEventListener("contextmenu", preventNativeMenu);
      document.removeEventListener("dragstart", preventNativeMenu);
      document.removeEventListener("selectstart", preventNativeMenu);
    };
  }, []);
};
