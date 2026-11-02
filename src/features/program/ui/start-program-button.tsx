import { useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { type ComponentProps, type ReactNode, useState } from "react";
import { toast } from "sonner";

import { restoreActiveWorkoutDraft, saveActiveWorkoutDraft } from "@/entities/workout";
import { useAuth } from "@/shared/auth";
import { cn } from "@/shared/lib";
import { Button, ConfirmDialog } from "@/shared/ui";

import type { Program } from "../api/programs";
import { programWorkoutDraft } from "../model/program";

export function StartProgramButton({
  program,
  children,
  className,
  variant = "outline",
}: {
  program: Program;
  children?: ReactNode;
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const start = () => {
    if (!user?.id || !program.exercises.length) return;
    const workoutId = crypto.randomUUID();
    saveActiveWorkoutDraft({
      userId: user.id,
      workoutId,
      exercises: programWorkoutDraft(program.exercises),
      startedAt: new Date().toISOString(),
      restClock: null,
      name: program.name,
      notes: "",
      programSource: { id: program.id, name: program.name, template: program.workout_template },
    });
    if (restoreActiveWorkoutDraft(user.id)?.workoutId !== workoutId) {
      toast.error("Не вдалося почати тренування", {
        description: "Перевір доступ до сховища на пристрої.",
      });
      return;
    }
    setConfirmOpen(false);
    void navigate({ to: "/workout/new" });
  };

  return (
    <>
      <Button
        variant={variant}
        className={cn("w-full", className)}
        aria-label={`Почати тренування за шаблоном ${program.name}`}
        disabled={!program.exercises.length}
        onClick={() => {
          if (restoreActiveWorkoutDraft(user?.id)) setConfirmOpen(true);
          else start();
        }}
      >
        {children ?? (
          <>
            <Play data-icon="inline-start" /> Почати тренування
          </>
        )}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Почати нове тренування?"
        description="Поточну незавершену чернетку буде замінено вправами з шаблону."
        confirmText="Почати"
        isDestructive
        onConfirm={start}
      />
    </>
  );
}
