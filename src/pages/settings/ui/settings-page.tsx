import { Link } from "@tanstack/react-router";
import { ChevronRight, Download, Settings2, ShieldCheck } from "lucide-react";

import { LogoutButton } from "@/entities/auth";
import { ProfileSettings } from "@/entities/profile";
// import { PushNotificationsCard } from "@/entities/notification";
import { useProfile } from "@/entities/profile";
import { isStandalone } from "@/shared/lib";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { LoaderBar } from "@/shared/ui";

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return <LoaderBar data-testid="loader-bar" />;
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-4">
      <div className="flex items-start justify-between gap-3 px-1 pt-1">
        <div className="min-w-0">
          <p className="text-primary text-[10px] font-semibold tracking-[0.16em] uppercase">
            Control center
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-bold tracking-tight">Налаштування</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Профіль, тренувальні звички та стан застосунку.
          </p>
        </div>
        <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
          <Settings2 className="size-5" />
        </div>
      </div>

      <ProfileSettings
        name={profile.name}
        email={profile.email}
        avatarUrl={profile.avatarUrl}
        autoRestTimer={profile.autoRestTimer}
      />

      {/* <PushNotificationsCard /> */}

      {!isStandalone() && (
        <Card className="p-0">
          <CardHeader className="px-4 pt-4">
            <CardTitle>Додаток</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Link
              to="/install"
              className="hover:bg-muted/70 flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors"
            >
              <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
                <Download className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Встановити PRGRSS</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Додай на головний екран для app mode
                </p>
              </div>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="p-0">
        <CardHeader className="px-4 pt-4">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="text-primary size-4" />
            Сесія
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <LogoutButton variant="outline" />
        </CardContent>
      </Card>
    </div>
  );
}
