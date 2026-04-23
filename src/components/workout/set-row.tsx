import { useState } from "react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { Check, Trash2 } from "lucide-react";
import { type LocalSet } from "@/src/lib/types";
import { cn } from "@/src/lib/utils";

interface SetRowProps {
  set: LocalSet;
  previousWeight?: number | null;
  previousReps?: number | null;
  onUpdate: (set: LocalSet) => void;
  onComplete: (set: LocalSet) => void;
  onDelete: (id: string) => void;
}

export function SetRow({
  set,
  previousWeight,
  previousReps,
  onUpdate,
  onComplete,
  onDelete,
}: SetRowProps) {
  const setGridClassName =
    "grid grid-cols-[2rem_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem_2.75rem] items-center gap-2";
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRepsBlur = () => {
    if (set.reps == null) {
      onUpdate({ ...set, reps: previousReps ?? 1 });
    }
  };

  const handleChange = (field: keyof LocalSet, value: string) => {
    if (value === "") {
      if (field === "reps") {
        onUpdate({ ...set, reps: null });
        return;
      }

      onUpdate({ ...set, [field]: null });
      return;
    }
    const parsed = Number(value);
    if (isNaN(parsed)) return;
    if (field === "reps") {
      if (!Number.isInteger(parsed) || parsed > 999) return;

      onUpdate({ ...set, reps: Math.max(parsed, 1) });
      return;
    }
    if (field === "rpe" && (parsed < 1 || parsed > 10)) return;
    onUpdate({ ...set, [field]: parsed });
  };

  return (
    <div
      className={cn(
        `${setGridClassName} rounded-lg px-2 py-2 transition-colors`,
        set.completed && "bg-accent/50"
      )}
    >
      <span className="text-muted-foreground text-center text-sm font-medium">{set.setNumber}</span>

      <Input
        type="number"
        inputMode="decimal"
        placeholder={previousWeight != null ? `${previousWeight}` : "кг"}
        value={set.weight ?? ""}
        onChange={(e) => handleChange("weight", e.target.value)}
        className="h-11 w-full text-center text-base font-medium"
        disabled={set.completed}
      />

      <Input
        type="number"
        inputMode="numeric"
        placeholder={previousReps != null ? `${previousReps}` : "повт"}
        value={set.reps ?? ""}
        onChange={(e) => handleChange("reps", e.target.value)}
        onBlur={handleRepsBlur}
        className="h-11 w-full text-center text-base font-medium"
        min={1}
        max={999}
        step={1}
        disabled={set.completed}
      />

      <Input
        type="number"
        inputMode="decimal"
        placeholder="1-10"
        title="RPE — складність підходу від 1 до 10"
        value={set.rpe ?? ""}
        onChange={(e) => handleChange("rpe", e.target.value)}
        className="h-11 w-full text-center text-base font-medium"
        min={1}
        max={10}
        step={0.5}
        disabled={set.completed}
      />

      <Button
        variant={set.completed ? "default" : "outline"}
        size="icon"
        className={cn(
          "h-11 w-full shrink-0",
          set.completed && "border-green-600 bg-green-600 hover:bg-green-700"
        )}
        onClick={() => onComplete({ ...set, completed: !set.completed })}
      >
        <Check className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground h-11 w-11 shrink-0"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Видалити сет?"
        description={`Сет ${set.setNumber} буде видалений.`}
        confirmText="Видалити"
        isDestructive
        onConfirm={() => {
          onDelete(set.id);
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
