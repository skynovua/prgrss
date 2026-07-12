import type { LocalSet } from "@/entities/workout";
import { cn } from "@/shared/lib";

interface ExerciseSetIndicatorsProps {
  sets: LocalSet[];
  className?: string;
}

export function ExerciseSetIndicators({ sets, className }: ExerciseSetIndicatorsProps) {
  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      aria-label={`Сетів: ${sets.length}`}
    >
      {sets.map((set) => (
        <span
          key={set.id}
          className={cn(
            "h-1 w-6 rounded-full transition-colors",
            set.completed ? "bg-green-500" : "bg-muted-foreground/30"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
