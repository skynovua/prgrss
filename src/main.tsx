import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import { router } from "@/app";
import { createSessionQueryClient } from "@/app/model/session-query-client";
import { AppStartup } from "@/app/ui/app-startup";
import { useMobileGestureGuard } from "@/app/use-mobile-gesture-guard";
import { AuthProvider, useAuth } from "@/shared/auth";
import { ThemeProvider } from "@/shared/theme";

export function AppRouter() {
  const auth = useAuth();
  useMobileGestureGuard();

  if (auth.loading || auth.error) return <AppStartup error={auth.error} onRetry={auth.retry} />;

  // Інший акаунт отримує власний кеш і нове дерево локальних станів сторінок.
  return <SessionRouter key={auth.user?.id ?? "anonymous"} />;
}

function SessionRouter() {
  const auth = useAuth();
  const [queryClient] = useState(createSessionQueryClient);

  useEffect(() => {
    router.invalidate();
  }, [auth.loading, auth.user?.id]);

  useEffect(
    () => () => {
      void queryClient.cancelQueries();
    },
    [queryClient]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ auth, queryClient }} />
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
