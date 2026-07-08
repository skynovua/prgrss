import { useState } from "react";
import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { Button } from "@/shared/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { Input } from "@/shared/ui";
import { Switch } from "@/shared/ui";
import {
  useDeletePushSubscription,
  usePushSubscriptionStatus,
  useReminderSettings,
  useSavePushSubscription,
  useSaveReminderSettings,
  useSendTestReminder,
} from "@/entities/notification";
import type { ReminderSettings } from "@/entities/notification";
import { cn, detectPlatform, isStandalone } from "@/shared/lib";
import { toast } from "sonner";

const WEEKDAYS = [
  { value: 1, label: "Пн" },
  { value: 2, label: "Вт" },
  { value: 3, label: "Ср" },
  { value: 4, label: "Чт" },
  { value: 5, label: "Пт" },
  { value: 6, label: "Сб" },
  { value: 7, label: "Нд" },
] as const;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function PushNotificationsCard() {
  const remindersQuery = useReminderSettings();
  const subscriptionQuery = usePushSubscriptionStatus();
  const reminders = remindersQuery.data;
  const formKey = reminders
    ? [reminders.id ?? "new", reminders.enabled, reminders.days.join("-"), reminders.time].join(":")
    : "loading";

  return (
    <PushNotificationsForm
      key={formKey}
      reminders={reminders}
      subscriptionActive={subscriptionQuery.data ?? false}
    />
  );
}

function PushNotificationsForm({
  reminders,
  subscriptionActive,
}: {
  reminders?: ReminderSettings;
  subscriptionActive: boolean;
}) {
  const saveReminderMutation = useSaveReminderSettings();
  const saveSubscriptionMutation = useSavePushSubscription();
  const deleteSubscriptionMutation = useDeletePushSubscription();
  const testReminderMutation = useSendTestReminder();

  const [enabled, setEnabled] = useState(reminders?.enabled ?? false);
  const [days, setDays] = useState<number[]>(reminders?.days ?? [1, 3, 5]);
  const [time, setTime] = useState(reminders?.time ?? "09:00");
  const [message, setMessage] = useState(
    reminders?.message ?? "Час на тренування. Зайди в PRGRSS і зафіксуй сьогоднішню сесію."
  );
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    isPushSupported() ? Notification.permission : "unsupported"
  );

  const isDirty =
    !!reminders &&
    (enabled !== reminders.enabled ||
      time !== reminders.time ||
      message !== reminders.message ||
      JSON.stringify([...days].sort()) !== JSON.stringify([...reminders.days].sort()));

  const unsupported = permission === "unsupported" || !import.meta.env.VITE_VAPID_PUBLIC_KEY;
  const showIosHint = detectPlatform() === "ios" && !isStandalone();

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort()
    );
  }

  async function handleEnablePush() {
    try {
      if (unsupported) {
        toast.error("Push не підтримується на цьому пристрої");
        return;
      }

      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        toast.error("Дозвіл на сповіщення не надано");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
      });

      const json = subscription.toJSON();
      const keys = json.keys;

      if (!subscription.endpoint || !keys?.p256dh || !keys.auth) {
        throw new Error("Бракує даних push-підписки");
      }

      await saveSubscriptionMutation.mutateAsync({
        endpoint: subscription.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не вдалося увімкнути push");
    }
  }

  async function handleDisablePush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await deleteSubscriptionMutation.mutateAsync(subscription.endpoint);
        return;
      }

      await deleteSubscriptionMutation.mutateAsync(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не вдалося вимкнути push");
    }
  }

  async function handleSaveReminders() {
    if (days.length === 0) {
      toast.error("Оберіть хоча б один день");
      return;
    }

    await saveReminderMutation.mutateAsync({
      enabled,
      days,
      time,
      message,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Push-нагадування</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4 rounded-3xl border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Статус push</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {unsupported
                ? "Цей браузер або середовище не підтримує push-сповіщення."
                : subscriptionActive
                  ? "Push увімкнено. Нагадування приходитимуть у вибрані дні та час."
                  : "Push ще не увімкнено. Після активації застосунок збереже підписку на цьому пристрої."}
            </p>
          </div>

          <Button
            variant={subscriptionActive ? "outline" : "default"}
            onClick={subscriptionActive ? handleDisablePush : handleEnablePush}
            disabled={
              unsupported ||
              saveSubscriptionMutation.isPending ||
              deleteSubscriptionMutation.isPending
            }
          >
            {saveSubscriptionMutation.isPending || deleteSubscriptionMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : subscriptionActive ? (
              <BellOff />
            ) : (
              <Bell />
            )}
            {subscriptionActive ? "Вимкнути" : "Увімкнути"}
          </Button>
        </div>

        {showIosHint ? (
          <div className="bg-muted text-muted-foreground rounded-3xl px-4 py-3 text-xs leading-relaxed">
            На iPhone push працює стабільно лише після додавання застосунку на головний екран.
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Увімкнути нагадування</p>
              <p className="text-muted-foreground text-xs">
                Керує розкладом, але не замінює push-підписку
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Дні</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const active = days.includes(day.value);

                return (
                  <Button
                    key={day.value}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className={cn("min-w-11")}
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Час</label>
            <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Текст нагадування</label>
            <Input
              value={message}
              maxLength={140}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Час на тренування"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSaveReminders}
            disabled={!isDirty || saveReminderMutation.isPending}
          >
            {saveReminderMutation.isPending ? <Loader2 className="animate-spin" /> : null}
            Зберегти розклад
          </Button>

          <Button
            variant="outline"
            onClick={() => testReminderMutation.mutate()}
            disabled={!subscriptionActive || testReminderMutation.isPending}
          >
            {testReminderMutation.isPending ? <Loader2 className="animate-spin" /> : <Send />}
            Тестове нагадування
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
