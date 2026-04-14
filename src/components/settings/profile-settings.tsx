import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Camera, Check, Loader2 } from "lucide-react";
import { updateProfile, uploadAvatar } from "@/src/lib/api/profile";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ProfileSettingsProps {
  name: string;
  email: string;
  avatarUrl: string | null;
}

export function ProfileSettings({
  name: initialName,
  email,
  avatarUrl: initialAvatarUrl,
}: ProfileSettingsProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameChanged = name.trim() !== initialName;

  async function handleSaveName() {
    if (!nameChanged) return;
    setSavingName(true);
    try {
      await updateProfile({ name });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Ім'я оновлено");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Помилка");
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const newUrl = await uploadAvatar(file);
      setAvatarUrl(newUrl);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Фото оновлено");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Помилка завантаження");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const initials = (name || "А").charAt(0).toUpperCase();

  return (
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
            disabled={uploadingAvatar}
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
              {uploadingAvatar ? (
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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше ім'я" />
            <Button size="icon" onClick={handleSaveName} disabled={!nameChanged || savingName}>
              {savingName ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
