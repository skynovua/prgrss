import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { Toaster } from "@/src/components/ui/sonner";
import { SyncProvider } from "@/src/components/sync-provider";
import { BottomNav } from "@/src/components/bottom-nav";
import { supabase } from "@/src/lib/supabase/client";
import LoginPage from "@/src/routes/login";
import AuthCallbackPage from "@/src/routes/auth-callback";
import OfflinePage from "@/src/routes/offline";
import DashboardPage from "@/src/routes/dashboard";
import ExercisesPage from "@/src/routes/exercises";
import WorkoutNewPage from "@/src/routes/workout-new";
import WorkoutDetailPage from "@/src/routes/workout-detail";
import ProgressPage from "@/src/routes/progress";
import SettingsPage from "@/src/routes/settings";
import ProgramsPage from "@/src/routes/programs";

// --- Root layout ---
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster position="top-center" />
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

// --- Offline ---
const offlineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/offline",
  component: OfflinePage,
});

// --- App layout (authenticated) ---
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <SyncProvider>
      <div className="flex min-h-svh flex-col pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
      <BottomNav />
    </SyncProvider>
  ),
});

// --- App child routes ---
const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/dashboard",
  component: DashboardPage,
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

const progressRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/progress",
  component: ProgressPage,
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

// --- Route tree ---
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  authCallbackRoute,
  offlineRoute,
  appRoute.addChildren([
    dashboardRoute,
    exercisesRoute,
    workoutNewRoute,
    workoutDetailRoute,
    progressRoute,
    settingsRoute,
    programsRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
