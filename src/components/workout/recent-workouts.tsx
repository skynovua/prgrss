import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { Trash2 } from "lucide-react";
import { deleteWorkout } from "@/src/lib/api/workouts";
import { toast } from "sonner";

interface RecentWorkout {
  id: string;
  name: string | null;
  started_at: string | null;
  sets: { id: string }[];
}

export function RecentWorkouts({ workouts }: { workouts: RecentWorkout[] }) {
  const queryClient = useQueryClient();
  const [localWorkouts, setLocalWorkouts] = useState(workouts);

  const handleDelete = async (workoutId: string) => {
    setLocalWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
    try {
      await deleteWorkout(workoutId);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast.error("Не вдалося видалити тренування", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
      setLocalWorkouts(workouts);
    }
  };

  if (localWorkouts.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Останні тренування</h2>
      {localWorkouts.map((workout) => (
        <WorkoutRow key={workout.id} workout={workout} onDelete={handleDelete} />
      ))}
    </div>
  );
}

function WorkoutRow({
  workout,
  onDelete,
}: {
  workout: RecentWorkout;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-1">
        <Link to="/workout/$id" params={{ id: workout.id }} className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{workout.name ?? "Тренування"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-muted-foreground flex gap-4 text-xs">
              <span>
                {workout.started_at &&
                  new Date(workout.started_at).toLocaleDateString("uk-UA", {
                    day: "numeric",
                    month: "short",
                  })}
              </span>
              <span>{Array.isArray(workout.sets) ? workout.sets.length : 0} підходів</span>
            </div>
          </CardContent>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive mr-3 h-8 w-8 shrink-0"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Видалити тренування?"
        description="Це видалить тренування та всі підходи. Цю дію неможливо скасувати."
        confirmText="Видалити"
        isDestructive
        onConfirm={() => onDelete(workout.id)}
      />
    </Card>
  );
}
