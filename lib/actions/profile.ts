"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "./protected";

export async function updateProfile(formData: FormData) {
  const name = formData.get("name") as string | null;

  await withAuth(async (userId, supabase) => {
    const updates: { name?: string } = {};
    if (name !== null) {
      updates.name = name.trim();
    }

    const { error } = await supabase.from("users").update(updates).eq("id", userId);

    if (error) throw new Error("Не вдалося оновити профіль");
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function uploadAvatar(formData: FormData) {
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) throw new Error("Файл не обрано");

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Максимальний розмір — 2 МБ");
  }

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("Дозволені формати: JPEG, PNG, WebP");
  }

  return withAuth(async (userId, supabase) => {
    const ext = file.name.split(".").pop() ?? "jpg";
    const filePath = `${userId}/avatar.${ext}`;

    // Завантажуємо файл (upsert перезапише старий)
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw new Error("Не вдалося завантажити фото");

    // Отримуємо публічний URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Оновлюємо URL в таблиці users
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId);

    if (updateError) throw new Error("Не вдалося оновити профіль");

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return avatarUrl;
  });
}
