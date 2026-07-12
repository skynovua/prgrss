import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { cn } from "@/shared/lib";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui";
import type { AnatomicalMuscle, ExerciseMuscleTarget } from "../model/exercise-catalog";
import backAnatomySvg from "./anatomy-assets/back-organized.svg?raw";
import frontAnatomySvg from "./anatomy-assets/front-organized.svg?raw";

type AnatomyView = "front" | "back";

interface AnatomyMapProps {
  muscles: Array<Pick<AnatomicalMuscle, "key" | "name">>;
  highlights?: Array<Pick<ExerciseMuscleTarget, "muscleKey" | "activationScore">>;
  selectedMuscleKey?: string | null;
  onMuscleSelect?: (muscleKey: string) => void;
  compact?: boolean;
  className?: string;
}

const MUSCLE_ELEMENT_IDS: Record<string, Partial<Record<AnatomyView, string[]>>> = {
  pectoralis_major: {
    front: ["front-left-pectoralis-major", "front-right-pectoralis-major"],
  },
  deltoids: {
    front: ["front-left-deltoid", "front-right-deltoid"],
    back: ["back-left-deltoid", "back-right-deltoid"],
  },
  biceps_brachii: {
    front: ["front-left-biceps-brachii", "front-right-biceps-brachii"],
  },
  triceps_brachii: {
    back: ["back-left-triceps-brachii", "back-right-triceps-brachii"],
  },
  forearm_muscles: {
    front: ["front-left-forearm-muscles", "front-right-forearm-muscles"],
    back: ["back-left-forearm-muscles", "back-right-forearm-muscles"],
  },
  trapezius: {
    front: ["front-left-upper-trapezius", "front-right-upper-trapezius"],
    back: ["back-upper-trapezius", "back-middle-lower-trapezius"],
  },
  latissimus_dorsi: {
    back: ["back-left-latissimus-dorsi", "back-right-latissimus-dorsi"],
  },
  erector_spinae: {
    back: ["back-erector-spinae"],
  },
  rectus_abdominis: {
    front: ["front-rectus-abdominis"],
  },
  external_obliques: {
    front: ["front-left-external-oblique", "front-right-external-oblique"],
  },
  serratus_anterior: {
    front: ["front-left-serratus-anterior", "front-right-serratus-anterior"],
  },
  gluteus_maximus: {
    back: ["back-left-gluteus-maximus", "back-right-gluteus-maximus"],
  },
  quadriceps: {
    front: ["front-left-vastus-lateralis", "front-right-vastus-lateralis"],
  },
  rectus_femoris: {
    front: ["front-left-rectus-femoris", "front-right-rectus-femoris"],
  },
  hamstrings: {
    back: ["back-left-hamstrings", "back-right-hamstrings"],
  },
  adductors: {
    back: ["back-left-adductor-magnus", "back-right-adductor-magnus"],
  },
  calves: {
    back: [
      "back-left-gastrocnemius",
      "back-right-gastrocnemius",
      "back-left-soleus",
      "back-right-soleus",
    ],
  },
  tibialis_anterior: {
    front: ["front-left-tibialis-anterior", "front-right-tibialis-anterior"],
  },
};

const INTERACTIVE_CLASSES = ["cursor-pointer", "hover:fill-primary/20", "hover:stroke-primary"];
const EMPTY_HIGHLIGHTS: Array<Pick<ExerciseMuscleTarget, "muscleKey" | "activationScore">> = [];

function withResponsiveSvg(source: string, interactive: boolean) {
  const accessibility = interactive
    ? 'role="group" aria-label="Інтерактивна анатомічна мапа"'
    : 'aria-hidden="true"';

  return source.replace(
    "<svg ",
    `<svg class="block h-full w-full" ${accessibility} focusable="${interactive ? "true" : "false"}" `
  );
}

function getMuscleKey(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  return target.closest<SVGElement>("[data-muscle-key]")?.dataset.muscleKey ?? null;
}

function getHighlightOpacity(score: number) {
  if (score >= 8) return "0.7";
  if (score >= 4) return "0.35";
  return "0.15";
}

function clearHighlight(shape: SVGElement) {
  shape.style.removeProperty("fill");
  shape.style.removeProperty("fill-opacity");
  shape.style.removeProperty("stroke");
  shape.style.removeProperty("stroke-opacity");
}

function applyHighlight(shape: SVGElement, opacity: string) {
  // Вбудоване оформлення потрібне, бо WebKit нестабільно застосовує динамічні
  // utility-класи поверх presentation-атрибутів SVG.
  shape.style.setProperty("fill", "var(--primary)");
  shape.style.setProperty("fill-opacity", opacity);
  shape.style.setProperty("stroke", "var(--primary)");
  shape.style.setProperty("stroke-opacity", "1");
}

function AnatomyFigure({
  view,
  muscles,
  highlights,
  selectedMuscleKey,
  onMuscleSelect,
  compact,
}: Omit<AnatomyMapProps, "className"> & { view: AnatomyView }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const interactive = Boolean(onMuscleSelect);
  const source = view === "front" ? frontAnatomySvg : backAnatomySvg;
  const markup = useMemo(() => withResponsiveSvg(source, interactive), [interactive, source]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const highlightByKey = new Map(
      highlights?.map((highlight) => [highlight.muscleKey, highlight.activationScore]) ?? []
    );
    const nameByKey = new Map(muscles.map((muscle) => [muscle.key, muscle.name]));

    for (const [muscleKey, idsByView] of Object.entries(MUSCLE_ELEMENT_IDS)) {
      for (const id of idsByView[view] ?? []) {
        const element = container.querySelector<SVGElement>(`#${id}`);
        if (!element) continue;

        element.dataset.muscleKey = muscleKey;
        const shapes = element.matches("path, circle, ellipse, polygon, rect")
          ? [element]
          : Array.from(
              element.querySelectorAll<SVGElement>("path, circle, ellipse, polygon, rect")
            );

        for (const shape of shapes) {
          shape.classList.add("transition-colors", "duration-150");
          shape.classList.remove(...INTERACTIVE_CLASSES);
          clearHighlight(shape);

          if (interactive) {
            // Частина контурів має лише stroke. Значення `all` робить активною
            // всю геометрію, а не тільки тонку намальовану лінію.
            shape.style.setProperty("pointer-events", "all");
          } else {
            shape.style.removeProperty("pointer-events");
          }

          const score = highlightByKey.get(muscleKey);
          if (selectedMuscleKey === muscleKey) {
            applyHighlight(shape, "0.78");
          } else if (score !== undefined) {
            applyHighlight(shape, getHighlightOpacity(score));
          } else if (interactive) {
            shape.classList.add(...INTERACTIVE_CLASSES);
          }
        }

        if (interactive) {
          element.setAttribute("role", "button");
          element.setAttribute("tabindex", "0");
          element.setAttribute("aria-label", nameByKey.get(muscleKey) ?? muscleKey);
          element.setAttribute("aria-pressed", String(selectedMuscleKey === muscleKey));
        }
      }
    }
  }, [highlights, interactive, markup, muscles, selectedMuscleKey, view]);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const muscleKey = getMuscleKey(event.target);
    if (muscleKey) onMuscleSelect?.(muscleKey);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const muscleKey = getMuscleKey(event.target);
    if (!muscleKey) return;

    event.preventDefault();
    onMuscleSelect?.(muscleKey);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "mx-auto aspect-[792/1427] touch-manipulation select-none",
        compact ? "max-w-44" : "max-w-72"
      )}
      onClick={interactive ? handleClick : undefined}
      onDragStart={interactive ? (event) => event.preventDefault() : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
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

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Tabs value={view} onValueChange={(value) => setView(value as AnatomyView)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="front">Перед</TabsTrigger>
          <TabsTrigger value="back">Спина</TabsTrigger>
        </TabsList>
        <TabsContent value="front">
          <AnatomyFigure
            view="front"
            muscles={muscles}
            highlights={highlights}
            selectedMuscleKey={selectedMuscleKey}
            onMuscleSelect={onMuscleSelect}
            compact={compact}
          />
        </TabsContent>
        <TabsContent value="back">
          <AnatomyFigure
            view="back"
            muscles={muscles}
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
            : "Натисни на м'яз, щоб відфільтрувати вправи"}
        </p>
      )}
    </div>
  );
});
