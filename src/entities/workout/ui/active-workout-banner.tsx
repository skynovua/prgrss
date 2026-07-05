import { useEffect, useState, useCallback } from "react";
import { useLocation, Link } from "@tanstack/react-router";
import { Button } from "@/shared/ui";
import { Card, CardContent } from "@/shared/ui";
import { ConfirmDialog } from "@/shared/ui";
import { Trash2 } from "lucide-react";
import { db, type ActiveWorkout } from "@/entities/workout";

export function ActiveWorkoutBanner({
  fallback,
  onVisibilityChange,
}: {
  fallback?: React.ReactNode;
  onVisibilityChange?: (visible: boolean) => void;
}) {
  const [active, setActive] = useState<ActiveWorkout | null>(null);
  const [checked, setChecked] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { pathname } = useLocation();

  const checkActiveWorkout = useCallback(() => {
    db.activeWorkout.get(1).then((workout) => {
      setActive(workout && workout.exercises.length > 0 ? workout : null);
      setChecked(true);
    });
  }, []);

  // Перевіряємо при маунті та при кожній зміні pathname
  useEffect(() => {
    checkActiveWorkout();
  }, [pathname, checkActiveWorkout]);

  useEffect(() => {
    if (!checked) return;

    onVisibilityChange?.(Boolean(active));
  }, [active, checked, onVisibilityChange]);

  if (!checked) return null;
  if (!active) return fallback ?? null;

  const exerciseNames = active.exercises
    .map((we) => we.exercise.name)
    .slice(0, 3)
    .join(", ");

  const totalSets = active.exercises.reduce(
    (acc, we) => acc + we.sets.filter((s) => s.completed).length,
    0
  );

  const handleDiscard = async () => {
    await db.activeWorkout.delete(1);
    setActive(null);
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 px-3">
        <div className="mx-auto max-w-lg">
          <Card className="border-primary/20 bg-background/92 supports-backdrop-filter:bg-background/78 py-5 shadow-xl backdrop-blur-xl">
            <CardContent className="relative flex items-center gap-2 px-2.5 py-0">
              <div className="bg-primary/10 pointer-events-none absolute inset-y-2 left-4 w-1 rounded-full" />

              <Link
                to="/workout/new"
                className="group flex min-w-0 flex-1 items-center gap-3 rounded-3xl px-2 py-1 transition-colors active:opacity-90"
              >
                <div className="min-w-0 flex-1 pl-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase">
                      В роботі
                    </span>
                    <span className="text-muted-foreground text-[11px]">{totalSets} підходів</span>
                  </div>

                  <p className="text-sm font-semibold">Незавершене тренування</p>
                  <p className="text-muted-foreground truncate text-xs leading-relaxed">
                    {exerciseNames}
                  </p>
                </div>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9 shrink-0 rounded-2xl"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Видалити тренування?"
        description="Незавершене тренування буде втрачено. Цю дію не можна скасувати."
        confirmText="Видалити"
        isDestructive
        onConfirm={handleDiscard}
      />
    </>
  );
}
