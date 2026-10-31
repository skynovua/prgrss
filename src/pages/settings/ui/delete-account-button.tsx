import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

import { clearActiveWorkoutDraft, clearExerciseLogPreferences } from "@/entities/workout";
import { supabase } from "@/shared/api";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@/shared/ui";

const CONFIRMATION = "ВИДАЛИТИ";

export function DeleteAccountButton() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function changeOpen(next: boolean) {
    if (loading) return;
    setOpen(next);
    if (!next) {
      setConfirmation("");
      setError(null);
    }
  }

  async function deleteAccount() {
    if ((!deleted && confirmation !== CONFIRMATION) || loading) return;
    setLoading(true);
    setError(null);

    if (!deleted) {
      try {
        const { error: deleteError } = await supabase.functions.invoke("delete-account", {
          method: "POST",
        });
        if (deleteError) throw deleteError;
        setDeleted(true);
      } catch {
        setError("Не вдалося повністю видалити акаунт. Спробуй ще раз.");
        setLoading(false);
        return;
      }
    }

    clearActiveWorkoutDraft();
    clearExerciseLogPreferences();
    queryClient.clear();
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe();
    } catch {
      // Серверну підписку вже видалено разом із акаунтом.
    }
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) throw signOutError;
    } catch {
      setError("Акаунт видалено, але не вдалося вийти на цьому пристрої. Спробуй ще раз.");
      setLoading(false);
      return;
    }
    void navigate({ to: "/login", replace: true });
  }

  return (
    <>
      <Button variant="destructive" className="w-full" onClick={() => changeOpen(true)}>
        <Trash2 data-icon="inline-start" />
        {deleted ? "Завершити вихід" : "Видалити акаунт"}
      </Button>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent showCloseButton={!loading}>
          <DialogHeader>
            <DialogTitle>{deleted ? "Акаунт видалено" : "Видалити акаунт?"}</DialogTitle>
            <DialogDescription>
              {deleted
                ? "Заверши вихід із акаунта на цьому пристрої."
                : "Назавжди видалимо профіль, тренування, статистику, власні вправи та фото. Відновити їх буде неможливо."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {!deleted && (
              <>
                <label htmlFor="delete-account-confirmation" className="text-sm font-medium">
                  Введи {CONFIRMATION}, щоб підтвердити
                </label>
                <Input
                  id="delete-account-confirmation"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  disabled={loading}
                />
              </>
            )}
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => changeOpen(false)} disabled={loading}>
              Скасувати
            </Button>
            <Button
              variant="destructive"
              onClick={() => void deleteAccount()}
              disabled={(!deleted && confirmation !== CONFIRMATION) || loading}
            >
              {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {loading ? "Зачекай…" : deleted ? "Завершити вихід" : "Видалити назавжди"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
