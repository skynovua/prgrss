import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { Toaster } from "@/shared/ui";
import { AppLayout } from "@/app/ui/app-layout";
import type { AuthContextType } from "@/shared/auth";
import LoginPage from "@/pages/login";
import AuthCallbackPage from "@/pages/auth-callback";
import DashboardPage from "@/pages/dashboard";
import CalendarPage from "@/pages/calendar";
import ExercisesPage from "@/pages/exercises";
import WorkoutNewPage from "@/pages/workout-new";
import WorkoutDetailPage from "@/pages/workout-detail";
import WorkoutEditPage from "@/pages/workout-edit";
import ProgressPage from "@/pages/progress";
import ExerciseProgressPage from "@/pages/progress-exercise";
import SettingsPage from "@/pages/settings";
import ProgramsPage from "@/pages/programs";
import AchievementsPage from "@/pages/achievements";
import InstallPage from "@/pages/install";

interface RouterContext {
  auth: AuthContextType;
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
});

const calendarRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/calendar",
  component: CalendarPage,
});

const exercisesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/exercises",
  component: ExercisesPage,
});

const workoutNewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/workout/new",
  component: WorkoutNewPage,
});

const workoutDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/workout/$id",
  component: WorkoutDetailPage,
});

const workoutEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/workout/$id/edit",
  component: WorkoutEditPage,
});

const progressRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/progress",
  component: ProgressPage,
});

const exerciseProgressRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/progress/exercise/$exerciseId",
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
  component: ExerciseProgressPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: SettingsPage,
});

const programsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/programs",
  component: ProgramsPage,
});

const achievementsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/achievements",
  component: AchievementsPage,
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
  context: {
    auth: undefined!,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
