import { supabase } from "@/shared/api";

export interface ReminderSettings {
  id: string | null;
  enabled: boolean;
  days: number[];
  time: string;
  message: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  id: null,
  enabled: false,
  days: [1, 3, 5],
  time: "09:00",
  message: "Час на тренування. Зайди в PRGRSS і зафіксуй сьогоднішню сесію.",
};

async function requireUserId() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Не авторизовано");
  }

  return session.user.id;
}

export async function fetchReminderSettings(): Promise<ReminderSettings> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("reminders")
    .select("id, enabled, days, time, message")
    .eq("user_id", userId)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Не вдалося завантажити нагадування");
  }

  if (!data) {
    return DEFAULT_REMINDER_SETTINGS;
  }

  return {
    id: data.id,
    enabled: data.enabled ?? false,
    days: data.days ?? DEFAULT_REMINDER_SETTINGS.days,
    time: data.time?.slice(0, 5) ?? DEFAULT_REMINDER_SETTINGS.time,
    message: data.message ?? DEFAULT_REMINDER_SETTINGS.message,
  };
}

export async function saveReminderSettings(
  input: Pick<ReminderSettings, "enabled" | "days" | "time" | "message">
): Promise<ReminderSettings> {
  const userId = await requireUserId();

  const payload = {
    user_id: userId,
    enabled: input.enabled,
    days: input.days,
    time: input.time,
    message: input.message.trim(),
  };

  const { data: existing, error: existingError } = await supabase
    .from("reminders")
    .select("id")
    .eq("user_id", userId)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error("Не вдалося зберегти нагадування");
  }

  if (existing?.id) {
    const { error } = await supabase.from("reminders").update(payload).eq("id", existing.id);
    if (error) {
      throw new Error("Не вдалося зберегти нагадування");
    }

    return { id: existing.id, ...input, message: input.message.trim() };
  }

  const { data, error } = await supabase.from("reminders").insert(payload).select("id").single();

  if (error) {
    throw new Error("Не вдалося зберегти нагадування");
  }

  return { id: data.id, ...input, message: input.message.trim() };
}

export async function fetchPushSubscriptionStatus(): Promise<boolean> {
  const userId = await requireUserId();

  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error("Не вдалося перевірити push-підписку");
  }

  return (count ?? 0) > 0;
}

export async function savePushSubscription(subscription: PushSubscriptionPayload) {
  const userId = await requireUserId();

  const { data: existing, error: existingError } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("endpoint", subscription.endpoint)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error("Не вдалося зберегти push-підписку");
  }

  if (existing?.id) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .insert({ user_id: userId, ...subscription })
    .select("id")
    .single();

  if (error) {
    throw new Error("Не вдалося зберегти push-підписку");
  }

  return data.id;
}

export async function deletePushSubscription(endpoint?: string) {
  const userId = await requireUserId();

  let query = supabase.from("push_subscriptions").delete().eq("user_id", userId);

  if (endpoint) {
    query = query.eq("endpoint", endpoint);
  }

  const { error } = await query;
  if (error) {
    throw new Error("Не вдалося видалити push-підписку");
  }
}

export async function sendTestReminder() {
  const { error } = await supabase.functions.invoke("reminder-push", {
    body: { mode: "test" },
  });

  if (error) {
    throw new Error("Не вдалося надіслати тестове нагадування");
  }
}
