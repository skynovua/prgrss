import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import type { WorkoutExercise, WorkoutProgramSource } from "@/entities/workout";
import { useAuth } from "@/shared/auth";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";

import { updateProgramTemplate } from "../api/programs";

export function ProgramUpdateDialog({
  programSource,
  exercises,
  onDone,
}: {
  programSource: WorkoutProgramSource;
  exercises: WorkoutExercise[];
  onDone: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async () => {
    if (!user?.id || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateProgramTemplate(programSource.id, programSource.template, exercises);
      void queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Шаблон оновлено");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Спробуй ще раз.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Оновити шаблон?</DialogTitle>
          <DialogDescription>
            Тренування збережено. У ньому змінилися вправи, підходи або значення з шаблону «
            {programSource.name}». Можеш зберегти ці зміни у шаблоні для наступного разу.
          </DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Нотатки та RPE залишаться тільки в історії тренування.
        </p>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            Не вдалося оновити шаблон: {error}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button variant="primary" onClick={() => void update()} disabled={saving}>
            {saving ? "Оновлюю..." : "Оновити шаблон"}
          </Button>
          <Button variant="outline" onClick={onDone} disabled={saving}>
            Залишити як є
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
