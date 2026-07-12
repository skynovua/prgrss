import { Outlet } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { BottomNav } from "@/app/ui/bottom-nav";
import { ActiveWorkoutBanner } from "@/entities/workout";
import { useAuth } from "@/shared/auth";
import { LoaderBar } from "@/shared/ui";

export function AppLayout() {
  const auth = useAuth();
  const [hasActiveWorkoutBanner, setHasActiveWorkoutBanner] = useState(false);
  const handleActiveWorkoutBannerVisibility = useCallback((visible: boolean) => {
    setHasActiveWorkoutBanner((current) => (current === visible ? current : visible));
  }, []);

  if (auth.loading) {
    return <LoaderBar />;
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
        <Outlet />
      </div>
      <ActiveWorkoutBanner onVisibilityChange={handleActiveWorkoutBannerVisibility} />
      <BottomNav />
    </>
  );
}
