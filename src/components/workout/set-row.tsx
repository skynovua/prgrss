import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
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
  const handleChange = (field: keyof LocalSet, value: string) => {
    if (value === "") {
      onUpdate({ ...set, [field]: null });
      return;
    }
    const parsed = Number(value);
    if (isNaN(parsed)) return;
    if (field === "rpe" && (parsed < 1 || parsed > 10)) return;
    onUpdate({ ...set, [field]: parsed });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-2 transition-colors",
        set.completed && "bg-accent/50"
      )}
    >
      <span className="text-muted-foreground w-8 text-center text-sm font-medium">
        {set.setNumber}
      </span>

      <Input
        type="number"
        inputMode="decimal"
        placeholder={previousWeight != null ? `${previousWeight}` : "кг"}
        value={set.weight ?? ""}
        onChange={(e) => handleChange("weight", e.target.value)}
        className="h-11 w-20 text-center text-base font-medium"
        disabled={set.completed}
      />

      <Input
        type="number"
        inputMode="numeric"
        placeholder={previousReps != null ? `${previousReps}` : "повт"}
        value={set.reps ?? ""}
        onChange={(e) => handleChange("reps", e.target.value)}
        className="h-11 w-16 text-center text-base font-medium"
        disabled={set.completed}
      />

      <Input
        type="number"
        inputMode="decimal"
        placeholder="1-10"
        title="RPE — складність підходу від 1 до 10"
        value={set.rpe ?? ""}
        onChange={(e) => handleChange("rpe", e.target.value)}
        className="h-11 w-16 text-center text-base font-medium"
        min={1}
        max={10}
        step={0.5}
        disabled={set.completed}
      />

      <Button
        variant={set.completed ? "default" : "outline"}
        size="icon"
        className={cn(
          "h-11 w-11 shrink-0",
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
        onClick={() => onDelete(set.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
