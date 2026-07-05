import { useEffect } from "react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_TOAST_ID = "pwa-update-available";
const OFFLINE_READY_TOAST_ID = "pwa-offline-ready";

export function PwaUpdateNotifier() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError(error: unknown) {
      console.error("SW registration error", error);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;

    toast.success("Додаток готовий до офлайн-роботи", {
      id: OFFLINE_READY_TOAST_ID,
      duration: 5000,
      description: "Остання версія вже збережена на пристрої.",
      onDismiss: () => setOfflineReady(false),
      onAutoClose: () => setOfflineReady(false),
    });
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (!needRefresh) {
      toast.dismiss(UPDATE_TOAST_ID);
      return;
    }

    toast.info("Доступна нова версія", {
      id: UPDATE_TOAST_ID,
      duration: Infinity,
      description: "Онови застосунок, щоб отримати останні зміни.",
      action: {
        label: "Оновити",
        onClick: async () => {
          setNeedRefresh(false);
          await updateServiceWorker(true);
        },
      },
      cancel: {
        label: "Пізніше",
        onClick: () => setNeedRefresh(false),
      },
    });
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
