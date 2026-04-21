import { Outlet } from "@tanstack/react-router";
import { SyncProvider } from "@/src/components/sync-provider";
import { BottomNav } from "@/src/components/bottom-nav";
import { LoaderBar } from "@/src/components/ui/loader-bar";
import { useAuth } from "@/src/lib/auth";

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
