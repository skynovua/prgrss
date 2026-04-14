import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { syncPendingWorkouts } from "@/src/lib/offline/sync";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncAndInvalidate = async () => {
      await syncPendingWorkouts();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["previousSets"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
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
