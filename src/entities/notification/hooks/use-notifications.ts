import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { PushSubscriptionPayload, ReminderSettings } from "@/entities/notification";
import {
  deletePushSubscription,
  fetchPushSubscriptionStatus,
  fetchReminderSettings,
  savePushSubscription,
  saveReminderSettings,
  sendTestReminder,
} from "@/entities/notification";

export function useReminderSettings() {
  return useQuery({
    queryKey: ["reminder-settings"],
    queryFn: fetchReminderSettings,
  });
}

export function useSaveReminderSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Pick<ReminderSettings, "enabled" | "days" | "time" | "message">) =>
      saveReminderSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminder-settings"] });
      toast.success("Налаштування нагадувань збережено");
    },
    onError: (err) => {
      toast.error("Не вдалося зберегти нагадування", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
    },
  });
}

export function usePushSubscriptionStatus() {
  return useQuery({
    queryKey: ["push-subscription-status"],
    queryFn: fetchPushSubscriptionStatus,
  });
}

export function useSavePushSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PushSubscriptionPayload) => savePushSubscription(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscription-status"] });
      toast.success("Push-сповіщення увімкнено");
    },
    onError: (err) => {
      toast.error("Не вдалося увімкнути push", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
    },
  });
}

export function useDeletePushSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (endpoint?: string) => deletePushSubscription(endpoint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscription-status"] });
      toast.success("Push-сповіщення вимкнено");
    },
    onError: (err) => {
      toast.error("Не вдалося вимкнути push", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
    },
  });
}

export function useSendTestReminder() {
  return useMutation({
    mutationFn: sendTestReminder,
    onSuccess: () => {
      toast.success("Тестове нагадування відправлено");
    },
    onError: (err) => {
      toast.error("Не вдалося відправити тестове нагадування", {
        description: err instanceof Error ? err.message : "Перевірте налаштування",
      });
    },
  });
}
