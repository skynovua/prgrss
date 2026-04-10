"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, X } from "lucide-react";
import Link from "next/link";
import { db, type ActiveWorkout } from "@/lib/offline/db";

export function ActiveWorkoutBanner() {
  const [active, setActive] = useState<ActiveWorkout | null>(null);
  const pathname = usePathname();

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
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex items-center gap-3 p-4">
        <Dumbbell className="text-primary h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Незавершене тренування</p>
          <p className="text-muted-foreground text-xs">
            {exerciseNames} · {totalSets} підходів
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-8 w-8"
            onClick={handleDiscard}
          >
            <X className="h-4 w-4" />
          </Button>
          <Link href="/workout/new">
            <Button size="sm">Продовжити</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
