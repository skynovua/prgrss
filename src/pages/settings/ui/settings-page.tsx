import { Link } from "@tanstack/react-router";
import { ChevronRight, Download, Palette, ShieldCheck } from "lucide-react";

import { LogoutButton } from "@/entities/auth";
import { ProfileSettings } from "@/entities/profile";
// import { PushNotificationsCard } from "@/entities/notification";
import { useProfile } from "@/entities/profile";
import { isStandalone } from "@/shared/lib";
import { useTheme } from "@/shared/theme";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  PageHeader,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import { PageError, RefreshNotice } from "@/shared/ui";

import { ProfileLoading } from "./profile-loading";

const THEMES = [
  { value: "light", label: "Світла" },
  { value: "dark", label: "Темна" },
  { value: "system", label: "Як на пристрої" },
];

export default function SettingsPage() {
  const { data: profile, isPending, isError, refetch } = useProfile();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 pb-6 md:px-8">
      <PageHeader>
        <h1 className="text-xl font-medium tracking-tight">Налаштування</h1>
      </PageHeader>
      {isError && profile && <RefreshNotice onRetry={() => void refetch()} />}

      <Card className="gap-4 p-0">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-4" />
            Вигляд
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="color-scheme">Колірна тема</FieldLabel>
              <Select
                items={THEMES}
                value={theme}
                onValueChange={(value) => {
                  if (value === "light" || value === "dark" || value === "system") setTheme(value);
                }}
              >
                <SelectTrigger id="color-scheme" aria-describedby="color-scheme-description">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {THEMES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription id="color-scheme-description">
                Вибір зберігається на цьому пристрої.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {isPending ? (
        <ProfileLoading onRetry={() => void refetch()} />
      ) : profile ? (
        <ProfileSettings
          name={profile.name}
          email={profile.email}
          avatarUrl={profile.avatarUrl}
          autoRestTimer={profile.autoRestTimer}
        />
      ) : (
        <PageError title="Профіль не завантажився" onRetry={() => void refetch()} />
      )}

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
              <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
                <Download className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Встановити PRGRSS</p>
                <p className="text-muted-foreground mt-1 text-xs">Додай на головний екран</p>
              </div>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="p-0">
        <CardHeader className="px-4 pt-4">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="text-muted-foreground size-4" />
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
