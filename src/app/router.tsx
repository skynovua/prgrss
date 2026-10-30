import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from "@tanstack/react-router";

import { AppLayout } from "@/app/ui/app-layout";
import { exerciseCatalogOptions } from "@/entities/exercise";
import { profileQueryOptions } from "@/entities/profile";
import { previousSetsQueryOptions } from "@/entities/workout";
import { AchievementsLoading } from "@/pages/achievements/index.loading";
import AuthCallbackPage from "@/pages/auth-callback";
import CalendarPage from "@/pages/calendar";
import { validateCalendarSearch } from "@/pages/calendar";
import DashboardPage, { dashboardQueryOptions } from "@/pages/dashboard";
import ExercisesPage from "@/pages/exercises";
import InstallPage from "@/pages/install";
import LoginPage from "@/pages/login";
import ProgramsPage from "@/pages/programs";
import { ProgressLoading } from "@/pages/progress/index.loading";
import { ExerciseProgressLoading } from "@/pages/progress-exercise/index.loading";
import SettingsPage from "@/pages/settings";
import WorkoutDetailPage from "@/pages/workout-detail";
import WorkoutEditPage from "@/pages/workout-edit";
import WorkoutNewPage from "@/pages/workout-new";
import type { AuthContextType } from "@/shared/auth";
import { PageError, Toaster } from "@/shared/ui";

interface RouterContext {
  auth: AuthContextType;
  queryClient: QueryClient;
}

// --- Root layout ---
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <Toaster
        position="top-center"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      />
    </>
  ),
});

// --- Index route: redirect to dashboard ---
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

// --- Login ---
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// --- Auth callback ---
const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/callback",
  component: AuthCallbackPage,
});

// --- App layout (authenticated) ---
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  beforeLoad: ({ context }) => {
    if (context.auth.loading) {
      return;
    }

    if (context.auth.user) {
      return;
    }

    throw redirect({ to: "/login" });
  },
  component: AppLayout,
});

// --- App child routes ---
const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/dashboard",
  component: DashboardPage,
  loader: ({ context }) => {
    if (context.auth.user) void context.queryClient.prefetchQuery(dashboardQueryOptions);
  },
});

const calendarRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/calendar",
  validateSearch: validateCalendarSearch,
  component: CalendarPage,
});

const exercisesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/exercises",
  component: ExercisesPage,
  loader: ({ context }) => {
    if (context.auth.user)
      void context.queryClient.prefetchQuery(exerciseCatalogOptions(context.auth.user.id));
  },
});

const workoutNewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/workout/new",
  component: WorkoutNewPage,
  loader: ({ context }) => {
    if (!context.auth.user) return;
    void context.queryClient.prefetchQuery(exerciseCatalogOptions(context.auth.user.id));
    void context.queryClient.prefetchQuery(previousSetsQueryOptions);
  },
});

const workoutDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/workout/$id",
  validateSearch: validateWorkoutReturnSearch,
  component: WorkoutDetailPage,
});

const workoutEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/workout/$id/edit",
  validateSearch: validateWorkoutReturnSearch,
  component: WorkoutEditPage,
});

function validateWorkoutReturnSearch(search: Record<string, unknown>): { from?: string } {
  return {
    from:
      typeof search.from === "string" && /^\/calendar(?:\?|$)/.test(search.from)
        ? search.from
        : undefined,
  };
}

const progressRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/progress",
  component: lazyRouteComponent(() => import("@/pages/progress")),
  pendingComponent: ProgressLoading,
});

const exerciseProgressRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/progress/exercise/$exerciseId",
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
  component: lazyRouteComponent(() => import("@/pages/progress-exercise")),
  pendingComponent: ExerciseProgressLoading,
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: SettingsPage,
  loader: ({ context }) => {
    if (context.auth.user) void context.queryClient.prefetchQuery(profileQueryOptions);
  },
});

const programsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/programs",
  component: ProgramsPage,
});

const achievementsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/achievements",
  component: lazyRouteComponent(() => import("@/pages/achievements")),
  pendingComponent: AchievementsLoading,
});

const installRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/install",
  component: InstallPage,
});

// --- Route tree ---
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  authCallbackRoute,
  installRoute,
  appRoute.addChildren([
    dashboardRoute,
    calendarRoute,
    exercisesRoute,
    workoutNewRoute,
    workoutDetailRoute,
    workoutEditRoute,
    progressRoute,
    exerciseProgressRoute,
    settingsRoute,
    programsRoute,
    achievementsRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultPendingMs: 150,
  defaultPendingMinMs: 0,
  defaultErrorComponent: () => (
    <PageError title="Сторінка не відкрилася" onRetry={() => window.location.reload()} />
  ),
  context: {
    auth: undefined!,
    queryClient: undefined!,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
