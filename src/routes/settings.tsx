import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { LogoutButton } from "@/src/components/auth/logout-button";
import { ProfileSettings } from "@/src/components/settings/profile-settings";
// import { PushNotificationsCard } from "@/src/components/notifications/push-notifications-card";
import { useProfile } from "@/src/lib/hooks/use-profile";
import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { isStandalone } from "@/src/lib/utils";
import { LoaderBar } from "@/src/components/ui/loader-bar";

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return <LoaderBar data-testid="loader-bar" />;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Налаштування</h1>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Профіль, вигляд застосунку та тренувальні звички.
          </p>
        </div>
      </div>

      {!isStandalone() && (
        <Link
          to="/install"
          className="border-border bg-card hover:bg-accent flex items-center gap-3 rounded-3xl border p-4 transition-colors"
        >
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-2xl">
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

      {/* <PushNotificationsCard /> */}

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
