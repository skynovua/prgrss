import { Outlet } from "@tanstack/react-router";
import { SyncProvider } from "@/app/providers/sync-provider";
import { BottomNav } from "@/app/ui/bottom-nav";
import { LoaderBar } from "@/shared/ui";
import { useAuth } from "@/shared/auth";

export function AppLayout() {
  const auth = useAuth();

  if (auth.loading) {
    return <LoaderBar />;
  }

  return (
    <SyncProvider>
      <div className="flex min-h-screen flex-col pt-[env(safe-area-inset-top)] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
      <BottomNav />
    </SyncProvider>
  );
}
