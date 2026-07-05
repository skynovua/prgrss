import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "@/shared/auth";
import { ThemeProvider } from "@/shared/theme";
import { router } from "@/app";
import { PwaUpdateNotifier } from "@/app/providers/pwa/pwa-update-notifier";
import "./app/styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24, // 24 години — кеш живе довго для офлайн
      retry: (failureCount) => {
        // Не ретраїмо якщо офлайн
        if (!navigator.onLine) return false;
        return failureCount < 1;
      },
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

function AppRouter() {
  const auth = useAuth();

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
          <PwaUpdateNotifier />
          <AppRouter />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
