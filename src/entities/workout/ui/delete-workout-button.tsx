import { useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { deleteWorkout } from "@/entities/workout";
import { Button } from "@/shared/ui";
import { ConfirmDialog } from "@/shared/ui";

export function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteWorkout(workoutId);
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error("Не вдалося видалити тренування", {
        description: err instanceof Error ? err.message : "Спробуйте ще раз",
      });
      setDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Видалити тренування?"
        description="Це видалить тренування та всі підходи. Цю дію неможливо скасувати."
        confirmText="Видалити"
        isDestructive
        isLoading={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
