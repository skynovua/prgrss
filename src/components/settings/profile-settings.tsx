import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import { Camera, Check, Loader2 } from "lucide-react";
import { useUpdateProfile, useUploadAvatar } from "@/src/lib/hooks/use-profile";

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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Профіль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Аватар */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatarMutation.isPending}
              className="group bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-full"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Аватар" className="h-full w-full object-cover" />
              ) : (
                <span className="text-muted-foreground flex h-full w-full items-center justify-center text-xl font-semibold">
                  {initials}
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {uploadAvatarMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </div>
            </button>
            <div className="flex-1">
              <p className="text-sm font-medium">Фото профілю</p>
              <p className="text-muted-foreground text-xs">JPG, PNG або WebP. Макс 2 МБ</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Email (readonly) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input value={email} disabled />
          </div>

          {/* Ім'я */}
          <div className="space-y-1.5">
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
              >
                {nameMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Тренування</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Таймер відпочинку</p>
              <p className="text-muted-foreground text-xs">Автоматично показувати після підходу</p>
            </div>
            <Switch
              checked={autoRestTimer}
              onCheckedChange={handleAutoTimerChange}
              disabled={timerMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
