import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { LogoutButton } from "@/src/components/auth/logout-button";
import { ProfileSettings } from "@/src/components/settings/profile-settings";
import { useProfile } from "@/src/lib/hooks/use-profile";
import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { isStandalone } from "@/src/lib/utils";

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();

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

      {!isStandalone() && (
        <Link
          to="/install"
          className="border-border bg-card hover:bg-accent flex items-center gap-3 rounded-xl border p-4 transition-colors"
        >
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Встановити додаток</span>
            <span className="text-muted-foreground text-xs">
              Додай на головний екран для кращого досвіду
            </span>
          </div>
        </Link>
      )}

      <ProfileSettings
        name={profile.name}
        email={profile.email}
        avatarUrl={profile.avatarUrl}
        autoRestTimer={profile.autoRestTimer}
      />

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
