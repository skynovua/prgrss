import { useEffect, useState, useCallback } from "react";
import { useLocation, Link } from "@tanstack/react-router";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { Dumbbell, Trash2 } from "lucide-react";
import { db, type ActiveWorkout } from "@/src/lib/offline/db";

export function ActiveWorkoutBanner() {
  const [active, setActive] = useState<ActiveWorkout | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { pathname } = useLocation();

  const checkActiveWorkout = useCallback(() => {
    db.activeWorkout.get(1).then((workout) => {
      setActive(workout && workout.exercises.length > 0 ? workout : null);
    });
  }, []);

  // Перевіряємо при маунті та при кожній зміні pathname
  useEffect(() => {
    checkActiveWorkout();
  }, [pathname, checkActiveWorkout]);

  if (!active) return null;

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
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-3 p-4">
          <Link to="/workout/new" className="flex flex-1 items-center gap-3">
            <Dumbbell className="text-primary h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Незавершене тренування</p>
              <p className="text-muted-foreground text-xs">
                {exerciseNames} · {totalSets} підходів
              </p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

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
