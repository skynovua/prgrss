import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Привіт, {user?.user_metadata?.name ?? "атлет"} 💪</h1>
        <p className="text-muted-foreground">Готовий до тренування?</p>
      </div>
    </div>
  );
}
