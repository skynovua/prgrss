import { ChevronDown, Dumbbell, Timer } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib";
import { CardHeader } from "@/shared/ui";

export function ExerciseCardHeading({
  name,
  timed,
  expanded,
  panelId,
  sets,
  onOpenDetails,
  onToggle,
  actions,
}: {
  name: string;
  timed: boolean;
  expanded: boolean;
  panelId: string;
  sets: boolean[];
  onOpenDetails: () => void;
  onToggle: () => void;
  actions: ReactNode;
}) {
  const completed = sets.filter(Boolean).length;
  return (
    <CardHeader className="gap-0 group-data-[size=sm]/card:px-3">
      <div className="flex h-16 items-center gap-2">
        <button
          type="button"
          className="bg-secondary text-secondary-foreground focus-visible:ring-ring flex size-11 shrink-0 items-center justify-center rounded-xl focus-visible:ring-2 focus-visible:outline-none"
          onClick={onOpenDetails}
          aria-label={`Деталі вправи ${name}`}
        >
          {timed ? <Timer className="size-5" /> : <Dumbbell className="size-5" />}
        </button>
        <button
          type="button"
          data-reorder-activation
          className="focus-visible:ring-ring flex h-full min-w-0 flex-1 touch-pan-y items-center rounded-xl text-left select-none [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:outline-none"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={`${expanded ? "Згорнути" : "Розгорнути"} вправу ${name}, виконано ${completed} з ${sets.length} підходів`}
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="line-clamp-2 text-sm leading-4 font-semibold" title={name}>
              {name}
            </span>
            <span className="flex min-w-0 items-center gap-1" aria-hidden="true">
              {sets.map((complete, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1 max-w-5 min-w-0 flex-1 rounded-full",
                    complete ? "bg-primary" : "bg-muted-foreground/25"
                  )}
                />
              ))}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "text-muted-foreground ml-2 size-4 shrink-0 transition-transform duration-250 motion-reduce:transition-none",
              expanded && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>
        {actions}
      </div>
    </CardHeader>
  );
}
