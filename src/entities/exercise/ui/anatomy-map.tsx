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
  layout?: "tabs" | "both";
  className?: string;
}

interface AnatomyFigureProps {
  source: string;
  label: string;
  highlights: MuscleHighlight[];
  selectedMuscleKey?: string | null;
  onMuscleSelect?: (muscleKey: string) => void;
  compact: boolean;
  availableMuscleKeys: Set<string>;
}

function collectMuscleKeys(...sources: string[]) {
  const muscleKeys = new Set<string>();

  for (const source of sources) {
    for (const match of source.matchAll(/data-muscle-(?:parent-)?key="([^"]+)"/g)) {
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

function getMuscleKey(target: EventTarget | null, availableMuscleKeys: Set<string>) {
  if (!(target instanceof Element)) {
    return null;
  }

  const region = target.closest<SVGElement>("[data-muscle-key]");
  const key = region?.dataset.muscleKey;
  if (key && availableMuscleKeys.has(key)) return key;
  const parentKey = region?.dataset.muscleParentKey;
  return parentKey && availableMuscleKeys.has(parentKey) ? parentKey : null;
}

function createHighlightRule(
  scopeId: string,
  muscleKey: string,
  score: number,
  includeChildren: boolean
) {
  const level = Math.round(Math.min(10, Math.max(1, score)));
  return `
    #${scopeId} .anatomy-muscle[data-muscle-key="${muscleKey}"]${includeChildren ? `, #${scopeId} .anatomy-muscle[data-muscle-parent-key="${muscleKey}"]` : ""} {
      fill: url(#${scopeId}-gradient-${level}) !important;
      fill-opacity: 1 !important;
      stroke: var(--muted-foreground) !important;
      stroke-opacity: 0.8 !important;
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

  const childKeysByParent: Record<string, string[]> = {
    deltoids: ["deltoid_anterior", "deltoid_posterior"],
  };
  const rules = Array.from(highlightByKey, ([muscleKey, score]) =>
    createHighlightRule(
      scopeId,
      muscleKey,
      score,
      !childKeysByParent[muscleKey]?.some((key) => highlightByKey.has(key))
    )
  );

  if (selectedMuscleKey && isAnatomyMuscleKey(selectedMuscleKey)) {
    rules.push(createHighlightRule(scopeId, selectedMuscleKey, 10, true));
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
  availableMuscleKeys,
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
    const muscleKey = getMuscleKey(event.target, availableMuscleKeys);

    if (muscleKey) {
      onMuscleSelect?.(muscleKey);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const muscleKey = getMuscleKey(event.target, availableMuscleKeys);

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
        "anatomy-map__figure mx-auto aspect-[637/1242] w-full touch-manipulation select-none [&>div>svg]:h-full [&>div>svg>path:first-child]:opacity-95",
        compact ? "max-w-44" : "max-w-72"
      )}
      onClick={interactive ? handleClick : undefined}
      onDragStart={interactive ? (event) => event.preventDefault() : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      {highlightStyles && <style>{highlightStyles}</style>}

      <svg aria-hidden="true" className="absolute size-0" focusable="false">
        <defs>
          {Array.from({ length: 10 }, (_, index) => {
            const level = index + 1;
            return (
              <linearGradient
                key={level}
                id={`${scopeId}-gradient-${level}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.14 + level * 0.02} />
                <stop
                  offset="100%"
                  stopColor="var(--foreground)"
                  stopOpacity={0.2 + level * 0.044}
                />
              </linearGradient>
            );
          })}
        </defs>
      </svg>

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
  layout = "tabs",
  className,
}: AnatomyMapProps) {
  const [view, setView] = useState<AnatomyView>("front");

  const availableMuscleKeys = useMemo(
    () => new Set(muscles.map((muscle) => muscle.key)),
    [muscles]
  );
  const selectedMuscle = muscles.find((muscle) => muscle.key === selectedMuscleKey);

  const handleViewChange = (value: string) => {
    if (isAnatomyView(value)) {
      setView(value);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {layout === "both" ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            { source: frontAnatomySvg, label: "Спереду" },
            { source: backAnatomySvg, label: "Ззаду" },
          ].map(({ source, label }) => (
            <figure key={label} className="flex min-w-0 flex-col gap-2">
              <AnatomyFigure
                source={source}
                label={`Анатомічна мапа: ${label.toLowerCase()}`}
                highlights={highlights}
                selectedMuscleKey={selectedMuscleKey}
                onMuscleSelect={onMuscleSelect}
                compact={compact}
                availableMuscleKeys={availableMuscleKeys}
              />
              <figcaption className="sr-only">{label}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
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
              availableMuscleKeys={availableMuscleKeys}
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
              availableMuscleKeys={availableMuscleKeys}
            />
          </TabsContent>
        </Tabs>
      )}

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
