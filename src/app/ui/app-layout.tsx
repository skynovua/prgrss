import { useIsFetching, useQuery } from "@tanstack/react-query";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { isDashboardLoading } from "@/app/model/dashboard-loading";
import { BottomNav } from "@/app/ui/bottom-nav";
import {
  exerciseCatalogOptions,
  popularExerciseIdsQueryOptions,
  preloadAnatomyMap,
} from "@/entities/exercise";
import { ActiveWorkoutBanner } from "@/entities/workout";
import { programsQueryOptions } from "@/features/program";
import { dashboardQueryOptions } from "@/pages/dashboard";
import { useAuth } from "@/shared/auth";
import { useOnline } from "@/shared/lib";
import { LoaderBar } from "@/shared/ui";

import { AppStartup } from "./app-startup";

export function AppLayout() {
  const auth = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isDashboard = pathname === "/dashboard";
  const isExercises = pathname === "/exercises";
  const dashboard = useQuery({ ...dashboardQueryOptions, enabled: isDashboard && !!auth.user });
  const programs = useQuery({
    ...programsQueryOptions(auth.user?.id),
    enabled: isDashboard && !!auth.user,
  });
  const catalog = useQuery({
    ...exerciseCatalogOptions(auth.user?.id ?? ""),
    enabled: isExercises && !!auth.user,
  });
  const popular = useQuery({
    ...popularExerciseIdsQueryOptions(auth.user?.id ?? ""),
    enabled: isExercises && !!auth.user,
  });
  const fetching = useIsFetching();
  const online = useOnline();
  const [hasActiveWorkoutBanner, setHasActiveWorkoutBanner] = useState(false);
  const handleActiveWorkoutBannerVisibility = useCallback((visible: boolean) => {
    setHasActiveWorkoutBanner((current) => (current === visible ? current : visible));
  }, []);
  const dashboardLoading = isDashboard && isDashboardLoading(dashboard, programs);
  const contentReady =
    !auth.loading &&
    Boolean(auth.user) &&
    !dashboardLoading &&
    (!isExercises ||
      ((!catalog.isPending || catalog.fetchStatus === "paused") &&
        (!popular.isPending || popular.fetchStatus === "paused")));

  useEffect(() => {
    if (!contentReady || !online) return;
    const preload = () => {
      void preloadAnatomyMap().catch(() => {
        // Передзавантаження не повинно заважати роботі застосунку.
      });
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(preload, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(preload, 1000);
    return () => clearTimeout(id);
  }, [contentReady, online]);

  if (auth.loading || !auth.user) {
    return <AppStartup />;
  }

  if (dashboardLoading) {
    return (
      <AppStartup
        onRetry={() => {
          void dashboard.refetch();
          void programs.refetch();
        }}
      />
    );
  }

  if (
    isExercises &&
    ((catalog.isPending && catalog.fetchStatus !== "paused") ||
      (popular.isPending && popular.fetchStatus !== "paused"))
  ) {
    return (
      <AppStartup
        onRetry={() => {
          void catalog.refetch();
          void popular.refetch();
        }}
      />
    );
  }

  return (
    <>
      <div
        className={`bg-background mx-auto flex min-h-screen w-full max-w-3xl min-w-0 flex-col pt-[env(safe-area-inset-top)] ${
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
