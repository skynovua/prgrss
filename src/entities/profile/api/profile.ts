import { supabase } from "@/shared/api";

export async function updateProfile(data: { name?: string; auto_rest_timer?: boolean }) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Не авторизовано");

  const update: { name?: string; auto_rest_timer?: boolean } = {};
  if (data.name !== undefined) update.name = data.name.trim();
  if (data.auto_rest_timer !== undefined) update.auto_rest_timer = data.auto_rest_timer;

  const { error } = await supabase.from("users").update(update).eq("id", session.user.id);

  if (error) throw new Error("Не вдалося оновити профіль");
}

export async function uploadAvatar(file: File) {
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Максимальний розмір — 2 МБ");
  }

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("Дозволені формати: JPEG, PNG, WebP");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизовано");

  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw new Error("Не вдалося завантажити фото");

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) throw new Error("Не вдалося оновити профіль");

  return avatarUrl;
}

export async function fetchProfile() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const user = session.user;
  const { data: profile } = await supabase
    .from("users")
    .select("name, avatar_url, auto_rest_timer")
    .eq("id", user.id)
    .single();

  return {
    name: profile?.name ?? user.user_metadata?.name ?? "",
    email: user.email ?? "",
    avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
    autoRestTimer: profile?.auto_rest_timer ?? true,
  };
}
