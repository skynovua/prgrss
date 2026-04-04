"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";
import { type LocalSet } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SetRowProps {
  set: LocalSet;
  onUpdate: (set: LocalSet) => void;
  onComplete: (set: LocalSet) => void;
  onDelete: (id: string) => void;
}

export function SetRow({ set, onUpdate, onComplete, onDelete }: SetRowProps) {
  const handleChange = (field: keyof LocalSet, value: string) => {
    const parsed = value === "" ? null : Number(value);
    if (value !== "" && isNaN(parsed as number)) return;
    onUpdate({ ...set, [field]: parsed });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-2 transition-colors",
        set.completed && "bg-accent/50"
      )}
    >
      <span className="w-8 text-center text-sm font-medium text-muted-foreground">
        {set.setNumber}
      </span>

      <Input
        type="number"
        inputMode="decimal"
        placeholder="кг"
        value={set.weight ?? ""}
        onChange={(e) => handleChange("weight", e.target.value)}
        className="h-10 w-20 text-center"
        disabled={set.completed}
      />

      <Input
        type="number"
        inputMode="numeric"
        placeholder="повт"
        value={set.reps ?? ""}
        onChange={(e) => handleChange("reps", e.target.value)}
        className="h-10 w-16 text-center"
        disabled={set.completed}
      />

      <Input
        type="number"
        inputMode="decimal"
        placeholder="RPE"
        value={set.rpe ?? ""}
        onChange={(e) => handleChange("rpe", e.target.value)}
        className="h-10 w-16 text-center"
        min={6}
        max={10}
        step={0.5}
        disabled={set.completed}
      />

      <Button
        variant={set.completed ? "default" : "outline"}
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={() => onComplete({ ...set, completed: !set.completed })}
      >
        <Check className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 text-muted-foreground"
        onClick={() => onDelete(set.id)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
