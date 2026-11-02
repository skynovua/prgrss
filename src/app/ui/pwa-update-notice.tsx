import { useRouterState } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";

import { canOfferPwaUpdate } from "@/app/model/pwa-update";
import {
  applyPwaUpdate,
  getPwaUpdateSnapshot,
  subscribeToPwaUpdates,
} from "@/app/model/pwa-update-service";
import { Button } from "@/shared/ui";

export function PwaUpdateNotice() {
  const available = useSyncExternalStore(subscribeToPwaUpdates, getPwaUpdateSnapshot);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (!available || !canOfferPwaUpdate(pathname)) return null;

  return (
    <div
      className="bg-muted flex flex-wrap items-center justify-between gap-3 px-5 py-3"
      role="status"
    >
      <p className="text-sm">Доступне оновлення застосунку</p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          if (!applyPwaUpdate()) toast.error("Не вдалося оновити застосунок. Спробуй ще раз.");
        }}
      >
        Оновити
      </Button>
    </div>
  );
}
