import { Link } from "@tanstack/react-router";
import { useState } from "react";

import type { WorkoutTemplatePickerProps } from "@/entities/workout";
import { type Program, programWorkoutDraft, usePrograms } from "@/features/program";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from "@/shared/ui";

export function WorkoutTemplatePicker({
  open,
  onOpenChange,
  hasExercises,
  onSelect,
}: WorkoutTemplatePickerProps) {
  const programs = usePrograms();
  const [pending, setPending] = useState<Program | null>(null);

  const apply = (program: Program) => {
    onSelect({
      name: program.name,
      exercises: programWorkoutDraft(program.exercises),
      programSource: { id: program.id, name: program.name, template: program.workout_template },
    });
    setPending(null);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open && !pending} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Обрати шаблон</DialogTitle>
            <DialogDescription>Обраний шаблон стане основою тренування.</DialogDescription>
          </DialogHeader>
          {programs.isPending && programs.fetchStatus !== "paused" ? (
            <div className="flex flex-col gap-2" role="status" aria-label="Завантажуємо шаблони">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !programs.data ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-muted-foreground text-sm" role="alert">
                Не вдалося завантажити шаблони.
              </p>
              <Button variant="outline" onClick={() => void programs.refetch()}>
                Спробувати ще
              </Button>
            </div>
          ) : programs.data.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-muted-foreground text-sm">У тебе ще немає шаблонів.</p>
              <Button
                variant="outline"
                render={<Link to="/programs" search={{ create: true }} />}
                nativeButton={false}
              >
                Створити шаблон
              </Button>
            </div>
          ) : (
            <div className="flex max-h-[50dvh] flex-col gap-2 overflow-y-auto">
              {programs.data.map((program) => (
                <Button
                  key={program.id}
                  variant="outline"
                  className="h-auto min-h-16 justify-start py-3 text-left"
                  disabled={program.exercises.length === 0}
                  onClick={() => (hasExercises ? setPending(program) : apply(program))}
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="whitespace-normal">{program.name}</span>
                    <span className="text-muted-foreground text-xs">
                      Вправ: {program.exercises.length}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(nextOpen) => !nextOpen && setPending(null)}
        title="Замінити вправи?"
        description="Поточні вправи та записані підходи буде замінено шаблоном. Час тренування збережеться."
        confirmText="Замінити"
        cancelText="Назад"
        isDestructive
        onConfirm={() => pending && apply(pending)}
      />
    </>
  );
}
