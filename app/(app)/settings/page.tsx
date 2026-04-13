import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { WorkoutSettings } from "@/components/workout/workout-settings";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Налаштування</h1>

      <Card>
        <CardHeader>
          <CardTitle>Профіль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-muted-foreground text-sm">Email</p>
            <p className="font-medium">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Ім&apos;я</p>
            <p className="font-medium">{user?.user_metadata?.name ?? "Атлет"}</p>
          </div>
        </CardContent>
      </Card>

      <WorkoutSettings />

      <Card>
        <CardHeader>
          <CardTitle>Сесія</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
