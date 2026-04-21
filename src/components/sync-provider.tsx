import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { syncPendingWorkouts } from "@/src/lib/offline/sync";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncAndInvalidate = async () => {
      try {
        const syncedCount = await syncPendingWorkouts();

        if (syncedCount === 0) return;

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
          queryClient.invalidateQueries({ queryKey: ["achievements"] }),
          queryClient.invalidateQueries({ queryKey: ["previousSets"] }),
          queryClient.invalidateQueries({ queryKey: ["progress"] }),
        ]);
      } catch {
        // Офлайн або помилка мережі — ігноруємо
      }
    };

    syncAndInvalidate();

    const handleOnline = () => {
      syncAndInvalidate();
    };
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [queryClient]);

  return <>{children}</>;
}
