import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { WorkoutSettings } from "@/components/workout/workout-settings";
import { ProfileSettings } from "@/components/settings/profile-settings";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Дані з таблиці users
  const { data: profile } = await supabase
    .from("users")
    .select("name, avatar_url")
    .eq("id", user!.id)
    .single();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Налаштування</h1>

      <ProfileSettings
        name={profile?.name ?? user?.user_metadata?.name ?? ""}
        email={user?.email ?? ""}
        avatarUrl={profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? null}
      />

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
