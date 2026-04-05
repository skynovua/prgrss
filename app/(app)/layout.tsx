import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SyncProvider } from "@/components/sync-provider";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SyncProvider>
      <div className="flex min-h-svh flex-col pb-16">
        {children}
      </div>
      <BottomNav />
    </SyncProvider>
  );
}
