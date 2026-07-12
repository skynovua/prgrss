import "./app/styles/globals.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";

import { router } from "@/app";
import { useMobileGestureGuard } from "@/app/use-mobile-gesture-guard";
import { AuthProvider, useAuth } from "@/shared/auth";
import { ThemeProvider } from "@/shared/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24,
      retry: (failureCount) => failureCount < 1,
    },
  },
});

function AppRouter() {
  const auth = useAuth();

  useMobileGestureGuard();

  useEffect(() => {
    router.invalidate();
  }, [auth.loading, auth.user]);

  return <RouterProvider router={router} context={{ auth }} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
