import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { LogoutButton } from "@/src/components/auth/logout-button";
import { WorkoutSettings } from "@/src/components/workout/workout-settings";
import { ProfileSettings } from "@/src/components/settings/profile-settings";
import { fetchProfile } from "@/src/lib/api/profile";

export default function SettingsPage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  if (isLoading || !profile) {
    return (
      <div className="fixed inset-x-0 top-0 z-100">
        <div className="bg-primary h-0.5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Налаштування</h1>

      <ProfileSettings name={profile.name} email={profile.email} avatarUrl={profile.avatarUrl} />

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
