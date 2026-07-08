import { useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/app/ui/bottom-nav";
import { ActiveWorkoutBanner } from "@/entities/workout";
import { LoaderBar } from "@/shared/ui";
import { useAuth } from "@/shared/auth";

export function AppLayout() {
  const auth = useAuth();
  const [hasActiveWorkoutBanner, setHasActiveWorkoutBanner] = useState(false);

  if (auth.loading) {
    return <LoaderBar />;
  }

  return (
    <>
      <div
        className={`bg-background flex min-h-screen flex-col pt-[env(safe-area-inset-top)] ${
          hasActiveWorkoutBanner
            ? "pb-[calc(8.75rem+env(safe-area-inset-bottom))]"
            : "pb-[calc(4rem+env(safe-area-inset-bottom))]"
        }`}
      >
        <Outlet />
      </div>
      <ActiveWorkoutBanner onVisibilityChange={setHasActiveWorkoutBanner} />
      <BottomNav />
    </>
  );
}
