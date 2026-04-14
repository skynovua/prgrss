import { useEffect } from "react";
import { syncPendingWorkouts } from "@/src/lib/offline/sync";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Синхронізуємо при завантаженні
    syncPendingWorkouts();

    // Синхронізуємо при появі інтернету
    const handleOnline = () => {
      syncPendingWorkouts();
    };
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return <>{children}</>;
}
