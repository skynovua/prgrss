import "./anatomy-map.css";

import { type KeyboardEvent, memo, type MouseEvent, useId, useMemo, useState } from "react";

import { cn } from "@/shared/lib";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui";

import type { AnatomicalMuscle, ExerciseMuscleTarget } from "../model/exercise-catalog";
import backAnatomySvg from "./anatomy-assets/back-organized.svg?raw";
import frontAnatomySvg from "./anatomy-assets/front-organized.svg?raw";

type AnatomyView = "front" | "back";

type MuscleHighlight = Pick<ExerciseMuscleTarget, "muscleKey" | "activationScore">;

interface AnatomyMapProps {
  muscles: Array<Pick<AnatomicalMuscle, "key" | "name">>;
  highlights?: MuscleHighlight[];
  selectedMuscleKey?: string | null;
  onMuscleSelect?: (muscleKey: string) => void;
  compact?: boolean;
  className?: string;
}

interface AnatomyFigureProps {
  source: string;
  label: string;
  highlights: MuscleHighlight[];
  selectedMuscleKey?: string | null;
  onMuscleSelect?: (muscleKey: string) => void;
  compact: boolean;
}

function collectMuscleKeys(...sources: string[]) {
  const muscleKeys = new Set<string>();

  for (const source of sources) {
    for (const match of source.matchAll(/data-muscle-key="([^"]+)"/g)) {
      muscleKeys.add(match[1]);
    }
  }

  return muscleKeys;
}

const ANATOMY_MUSCLE_KEYS = collectMuscleKeys(frontAnatomySvg, backAnatomySvg);

const EMPTY_HIGHLIGHTS: MuscleHighlight[] = [];

function isAnatomyView(value: string): value is AnatomyView {
  return value === "front" || value === "back";
}

function isAnatomyMuscleKey(value: string) {
  return ANATOMY_MUSCLE_KEYS.has(value);
}

function getMuscleKey(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest<SVGElement>("[data-muscle-key]")?.dataset.muscleKey ?? null;
}

function getHighlightOpacity(score: number) {
  if (score >= 8) {
    return 0.7;
  }

  if (score >= 4) {
    return 0.35;
  }

  return 0.15;
}

function createHighlightRule(scopeId: string, muscleKey: string, opacity: number) {
  return `
    #${scopeId} .anatomy-muscle[data-muscle-key="${muscleKey}"] {
      fill: var(--primary) !important;
      fill-opacity: ${opacity} !important;
      stroke: var(--primary) !important;
      stroke-opacity: 1 !important;
    }
  `;
}

function createHighlightStyles({
  scopeId,
  highlights,
  selectedMuscleKey,
}: {
  scopeId: string;
  highlights: MuscleHighlight[];
  selectedMuscleKey?: string | null;
}) {
  const highlightByKey = new Map<string, number>();

  for (const highlight of highlights) {
    if (!isAnatomyMuscleKey(highlight.muscleKey)) {
      continue;
    }

    highlightByKey.set(highlight.muscleKey, highlight.activationScore);
  }

  const rules = Array.from(highlightByKey, ([muscleKey, score]) =>
    createHighlightRule(scopeId, muscleKey, getHighlightOpacity(score))
  );

  if (selectedMuscleKey && isAnatomyMuscleKey(selectedMuscleKey)) {
    rules.push(createHighlightRule(scopeId, selectedMuscleKey, 0.78));
  }

  return rules.join("\n");
}

function AnatomyFigure({
  source,
  label,
  highlights,
  selectedMuscleKey,
  onMuscleSelect,
  compact,
}: AnatomyFigureProps) {
  const reactId = useId();
  const scopeId = `anatomy-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const interactive = Boolean(onMuscleSelect);

  const highlightStyles = useMemo(
    () =>
      createHighlightStyles({
        scopeId,
        highlights,
        selectedMuscleKey,
      }),
    [highlights, scopeId, selectedMuscleKey]
  );

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const muscleKey = getMuscleKey(event.target);

    if (muscleKey) {
      onMuscleSelect?.(muscleKey);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const muscleKey = getMuscleKey(event.target);

    if (!muscleKey) {
      return;
    }

    event.preventDefault();
    onMuscleSelect?.(muscleKey);
  };

  return (
    <div
      id={scopeId}
      role={interactive ? "group" : undefined}
      aria-label={interactive ? label : undefined}
      aria-hidden={interactive ? undefined : true}
      inert={interactive ? undefined : true}
      data-interactive={interactive ? "true" : "false"}
      className={cn(
        "anatomy-map__figure mx-auto aspect-[792/1427] touch-manipulation select-none",
        compact ? "max-w-44" : "max-w-72"
      )}
      onClick={interactive ? handleClick : undefined}
      onDragStart={interactive ? (event) => event.preventDefault() : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      {highlightStyles && <style>{highlightStyles}</style>}

      <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: source }} />
    </div>
  );
}

export const AnatomyMap = memo(function AnatomyMap({
  muscles,
  highlights = EMPTY_HIGHLIGHTS,
  selectedMuscleKey,
  onMuscleSelect,
  compact = false,
  className,
}: AnatomyMapProps) {
  const [view, setView] = useState<AnatomyView>("front");

  const selectedMuscle = muscles.find((muscle) => muscle.key === selectedMuscleKey);

  const handleViewChange = (value: string) => {
    if (isAnatomyView(value)) {
      setView(value);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Tabs value={view} onValueChange={handleViewChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="front">Перед</TabsTrigger>
          <TabsTrigger value="back">Спина</TabsTrigger>
        </TabsList>

        <TabsContent value="front">
          <AnatomyFigure
            source={frontAnatomySvg}
            label="Інтерактивна анатомічна мапа, вигляд спереду"
            highlights={highlights}
            selectedMuscleKey={selectedMuscleKey}
            onMuscleSelect={onMuscleSelect}
            compact={compact}
          />
        </TabsContent>

        <TabsContent value="back">
          <AnatomyFigure
            source={backAnatomySvg}
            label="Інтерактивна анатомічна мапа, вигляд зі спини"
            highlights={highlights}
            selectedMuscleKey={selectedMuscleKey}
            onMuscleSelect={onMuscleSelect}
            compact={compact}
          />
        </TabsContent>
      </Tabs>

      {onMuscleSelect && (
        <p className="text-muted-foreground text-center text-xs">
          {selectedMuscle
            ? `${selectedMuscle.name} · натисни повторно, щоб скинути`
            : "Натисни на м’яз, щоб відфільтрувати вправи"}
        </p>
      )}
    </div>
  );
});
