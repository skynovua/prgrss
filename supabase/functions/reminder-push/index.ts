import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type ReminderRow = {
  user_id: string;
  message: string | null;
  time: string | null;
  days: number[] | null;
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const config = loadConfig();
    webpush.setVapidDetails(
      "mailto:hello@prgrss.app",
      config.vapidPublicKey,
      config.vapidPrivateKey
    );

    const admin = createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = req.method === "POST" ? await safeJson(req) : {};
    const mode = body.mode === "test" ? "test" : "scheduled";

    if (mode === "test") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return json({ error: "Missing Authorization header" }, 401);
      }

      const userClient = createClient(config.supabaseUrl, config.anonKey, {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const {
        data: { user },
        error: userError,
      } = await userClient.auth.getUser();

      if (userError || !user) {
        return json({ error: "Unauthorized" }, 401);
      }

      const { data: reminder } = await admin
        .from("reminders")
        .select("message")
        .eq("user_id", user.id)
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      const { data: subscriptions, error: subscriptionsError } = await admin
        .from("push_subscriptions")
        .select("id, user_id, endpoint, p256dh, auth")
        .eq("user_id", user.id);

      if (subscriptionsError) {
        throw subscriptionsError;
      }

      const summary = await dispatchPushes(
        admin,
        subscriptions ?? [],
        createPayload(reminder?.message, "test-reminder")
      );

      return json({ mode, ...summary });
    }

    const dueReminders = await loadDueReminders(admin);

    if (dueReminders.length === 0) {
      return json({ mode, processedUsers: 0, delivered: 0, staleSubscriptions: 0 });
    }

    const userIds = [...new Set(dueReminders.map((reminder) => reminder.user_id))];
    const { data: subscriptions, error: subscriptionsError } = await admin
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .in("user_id", userIds);

    if (subscriptionsError) {
      throw subscriptionsError;
    }

    const subscriptionsByUser = groupSubscriptionsByUser(subscriptions ?? []);
    let delivered = 0;
    let staleSubscriptions = 0;

    for (const reminder of dueReminders) {
      const summary = await dispatchPushes(
        admin,
        subscriptionsByUser.get(reminder.user_id) ?? [],
        createPayload(reminder.message, "scheduled-reminder")
      );

      delivered += summary.delivered;
      staleSubscriptions += summary.staleSubscriptions;
    }

    return json({
      mode,
      processedUsers: dueReminders.length,
      delivered,
      staleSubscriptions,
    });
  } catch (error) {
    console.error(error);
    return json(
      { error: error instanceof Error ? error.message : "Unexpected reminder error" },
      500
    );
  }
});

function loadConfig() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey || !anonKey || !vapidPublicKey || !vapidPrivateKey) {
    throw new Error("Missing Supabase or VAPID secrets");
  }

  return { supabaseUrl, serviceRoleKey, anonKey, vapidPublicKey, vapidPrivateKey };
}

async function safeJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {} as { mode?: string };
  }
}

async function loadDueReminders(admin: ReturnType<typeof createClient>) {
  const weekday = getIsoWeekday();
  const currentTime = getCurrentTime();

  const { data, error } = await admin
    .from("reminders")
    .select("user_id, message, time, days")
    .eq("enabled", true);

  if (error) {
    throw error;
  }

  return (data ?? []).filter((reminder: ReminderRow) => {
    const matchesDay = reminder.days?.includes(weekday) ?? false;
    const matchesTime = reminder.time?.slice(0, 5) === currentTime;
    return matchesDay && matchesTime;
  });
}

function groupSubscriptionsByUser(subscriptions: PushSubscriptionRow[]) {
  const grouped = new Map<string, PushSubscriptionRow[]>();

  for (const subscription of subscriptions) {
    const current = grouped.get(subscription.user_id) ?? [];
    current.push(subscription);
    grouped.set(subscription.user_id, current);
  }

  return grouped;
}

function createPayload(message: string | null, tag: string): PushPayload {
  return {
    title: "PRGRSS",
    body: message?.trim() || "Час на тренування. Зайди в PRGRSS і зафіксуй сесію.",
    url: "/dashboard",
    tag,
  };
}

async function dispatchPushes(
  admin: ReturnType<typeof createClient>,
  subscriptions: PushSubscriptionRow[],
  payload: PushPayload
) {
  const staleIds: string[] = [];
  let delivered = 0;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify(payload)
      );
      delivered += 1;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;

      if (statusCode === 404 || statusCode === 410) {
        staleIds.push(subscription.id);
        continue;
      }

      console.error("Push delivery failed", error);
    }
  }

  if (staleIds.length > 0) {
    const { error } = await admin.from("push_subscriptions").delete().in("id", staleIds);
    if (error) {
      console.error("Failed to delete stale subscriptions", error);
    }
  }

  return { delivered, staleSubscriptions: staleIds.length };
}

function getIsoWeekday() {
  const day = new Date().getUTCDay();
  return day === 0 ? 7 : day;
}

function getCurrentTime() {
  return new Date().toISOString().slice(11, 16);
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders,
  });
}
