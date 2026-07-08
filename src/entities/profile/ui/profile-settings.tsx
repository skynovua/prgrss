import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { Input } from "@/shared/ui";
import { Button } from "@/shared/ui";
import { Switch } from "@/shared/ui";
import { Camera, Check, Dumbbell, Loader2, UserRound } from "lucide-react";
import { useUpdateProfile, useUploadAvatar } from "@/entities/profile";

interface ProfileSettingsProps {
  name: string;
  email: string;
  avatarUrl: string | null;
  autoRestTimer: boolean;
}

export function ProfileSettings({
  name: initialName,
  email,
  avatarUrl: initialAvatarUrl,
  autoRestTimer,
}: ProfileSettingsProps) {
  const nameMutation = useUpdateProfile();
  const timerMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameChanged = name.trim() !== initialName;

  function handleSaveName() {
    if (!nameChanged) return;
    nameMutation.mutate({ name });
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadAvatarMutation.mutate(file, {
      onSuccess: (newUrl) => setAvatarUrl(newUrl),
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  }

  function handleAutoTimerChange(checked: boolean) {
    timerMutation.mutate({ auto_rest_timer: checked });
  }

  const initials = (name || "А").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-0">
        <CardContent className="flex items-center gap-4 p-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAvatarMutation.isPending}
            className="group bg-muted relative size-20 shrink-0 overflow-hidden rounded-full ring-1 ring-border/70 transition-transform active:scale-[0.98]"
            aria-label="Змінити фото профілю"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Аватар" className="size-full object-cover" />
            ) : (
              <span className="text-muted-foreground flex size-full items-center justify-center text-2xl font-semibold">
                {initials}
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/42 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {uploadAvatarMutation.isPending ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : (
                <Camera className="size-5 text-white" />
              )}
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-2xl leading-tight font-bold tracking-tight">{name}</p>
            <p className="text-muted-foreground mt-1 truncate text-sm">{email}</p>
            <p className="text-muted-foreground mt-3 text-xs">JPG, PNG або WebP. Макс 2 МБ</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader className="px-4 pt-4">
          <CardTitle className="flex items-center gap-2">
            <UserRound className="text-primary size-4" />
            Профіль
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4 pt-0">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Ім&apos;я</label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше ім'я"
              />
              <Button
                size="icon"
                onClick={handleSaveName}
                disabled={!nameChanged || nameMutation.isPending}
                aria-label="Зберегти ім'я"
              >
                {nameMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Check />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Email</label>
            <Input value={email} disabled />
          </div>
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader className="px-4 pt-4">
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="text-primary size-4" />
            Тренування
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center justify-between gap-4 rounded-xl border px-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Таймер відпочинку</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Автоматично показувати після підходу
              </p>
            </div>
            <Switch
              checked={autoRestTimer}
              onCheckedChange={handleAutoTimerChange}
              disabled={timerMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
