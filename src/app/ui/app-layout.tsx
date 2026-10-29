import { useIsFetching } from "@tanstack/react-query";
import { Outlet } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { BottomNav } from "@/app/ui/bottom-nav";
import { ActiveWorkoutBanner } from "@/entities/workout";
import { useAuth } from "@/shared/auth";
import { useOnline } from "@/shared/lib";
import { LoaderBar } from "@/shared/ui";

import { AppStartup } from "./app-startup";

export function AppLayout() {
  const auth = useAuth();
  const fetching = useIsFetching();
  const online = useOnline();
  const [hasActiveWorkoutBanner, setHasActiveWorkoutBanner] = useState(false);
  const handleActiveWorkoutBannerVisibility = useCallback((visible: boolean) => {
    setHasActiveWorkoutBanner((current) => (current === visible ? current : visible));
  }, []);

  if (auth.loading || !auth.user) {
    return <AppStartup />;
  }

  return (
    <>
      <div
        className={`bg-background mx-auto flex min-h-screen max-w-3xl flex-col pt-[env(safe-area-inset-top)] ${
          hasActiveWorkoutBanner
            ? "pb-[calc(8.75rem+env(safe-area-inset-bottom))]"
            : "pb-[calc(4rem+env(safe-area-inset-bottom))]"
        }`}
      >
        {!online && (
          <p role="status" className="bg-muted text-muted-foreground px-5 py-3 text-sm">
            Немає з’єднання. Дані оновляться після відновлення мережі.
          </p>
        )}
        <Outlet />
      </div>
      <ActiveWorkoutBanner onVisibilityChange={handleActiveWorkoutBannerVisibility} />
      <BottomNav />
      {fetching > 0 && <LoaderBar />}
    </>
  );
}
