import {
  Accessibility,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { useState } from "react";
import { flushSync } from "react-dom";

import { cn } from "@/shared/lib";

import type { WorkoutAction } from "../model/reducer";
import type { PreviousSetsMap, WorkoutExercise } from "../model/types";
import { WorkoutExerciseCard } from "./workout-exercise-card";

const accessibility = Accessibility.configure({
  screenReaderInstructions: {
    draggable:
      "Натисни пробіл або Enter, щоб почати переміщення. Стрілками зміни позицію, пробілом або Enter підтвердь, Escape скасовує.",
  },
  announcements: {
    dragstart({ operation: { source } }: DragStartEvent) {
      return source ? `Переміщення вправи ${source.data?.name ?? ""} розпочато.` : undefined;
    },
    dragover({ operation: { source } }: DragOverEvent) {
      return isSortable(source) ? `Позиція ${source.index + 1}.` : undefined;
    },
    dragend({ operation: { source }, canceled }: DragEndEvent) {
      if (!source) return;
      if (canceled) return "Переміщення скасовано.";
      return isSortable(source)
        ? `Вправу ${source.data?.name ?? ""} переміщено на позицію ${source.index + 1}.`
        : "Переміщення завершено.";
    },
  },
});

const pointerSensor = PointerSensor.configure({
  activationConstraints: [new PointerActivationConstraints.Delay({ value: 350, tolerance: 8 })],
  preventActivation(event, source) {
    if (event.target instanceof Element && event.target.closest("[data-reorder-activation]")) {
      return false;
    }
    return PointerSensor.defaults.preventActivation?.(event, source) ?? false;
  },
});

interface ExerciseListProps {
  exercises: WorkoutExercise[];
  previousSets?: PreviousSetsMap;
  autoRestTimer: boolean;
  collapsedCards: Record<string, boolean>;
  onToggleCollapse: (id: string) => void;
  onCollapseAll: () => void;
  dispatch: React.ActionDispatch<[action: WorkoutAction]>;
}

function SortableExercise({
  we,
  index,
  count,
  isReordering,
  onPrepareDrag,
  previousSets,
  autoRestTimer,
  collapsedCards,
  onToggleCollapse,
  dispatch,
}: Omit<ExerciseListProps, "exercises" | "onCollapseAll"> & {
  we: WorkoutExercise;
  index: number;
  count: number;
  isReordering: boolean;
  onPrepareDrag: () => void;
}) {
  const { ref, isDragging } = useSortable({
    id: we.instanceId,
    index,
    data: { name: we.exercise.name },
  });
  return (
    <div
      ref={ref}
      tabIndex={0}
      aria-label={`Перемістити вправу ${we.exercise.name}`}
      onKeyDownCapture={(event) => {
        if (
          !isReordering &&
          event.target === event.currentTarget &&
          !event.repeat &&
          (event.key === " " || event.key === "Enter")
        ) {
          onPrepareDrag();
        }
      }}
      className={cn(
        "focus-visible:ring-ring min-w-0 rounded-2xl focus-visible:ring-2 focus-visible:outline-none motion-reduce:!transition-none",
        "data-[dnd-placeholder]:ring-muted-foreground/30 data-[dnd-placeholder]:!bg-muted/50 data-[dnd-placeholder]:!visible data-[dnd-placeholder]:!shadow-none data-[dnd-placeholder]:ring-1 data-[dnd-placeholder]:ring-inset [&[data-dnd-placeholder]>*]:invisible",
        isDragging && "bg-card ring-primary/30 shadow-xl ring-2"
      )}
    >
      <WorkoutExerciseCard
        we={we}
        exerciseIndex={index}
        previousSets={previousSets?.[we.exercise.id]}
        autoRestTimer={autoRestTimer}
        isCollapsed={isReordering || (collapsedCards[we.instanceId] ?? false)}
        collapseImmediately={isReordering}
        onToggleCollapse={onToggleCollapse}
        dispatch={dispatch}
        onMoveUp={
          index > 0
            ? () =>
                dispatch({
                  type: "REORDER_EXERCISE",
                  instanceId: we.instanceId,
                  toIndex: index - 1,
                })
            : undefined
        }
        onMoveDown={
          index < count - 1
            ? () =>
                dispatch({
                  type: "REORDER_EXERCISE",
                  instanceId: we.instanceId,
                  toIndex: index + 1,
                })
            : undefined
        }
      />
    </div>
  );
}

export function WorkoutExerciseList({
  exercises,
  previousSets,
  autoRestTimer,
  collapsedCards,
  onToggleCollapse,
  onCollapseAll,
  dispatch,
}: ExerciseListProps) {
  const [isReordering, setIsReordering] = useState(false);
  const prepareDrag = () => {
    flushSync(() => {
      setIsReordering(true);
      onCollapseAll();
    });
  };

  if (exercises.length === 1) {
    const we = exercises[0];
    return (
      <WorkoutExerciseCard
        we={we}
        exerciseIndex={0}
        previousSets={previousSets?.[we.exercise.id]}
        autoRestTimer={autoRestTimer}
        isCollapsed={collapsedCards[we.instanceId] ?? false}
        onToggleCollapse={onToggleCollapse}
        dispatch={dispatch}
      />
    );
  }

  return (
    <DragDropProvider
      plugins={(defaults) => [...defaults, accessibility]}
      sensors={(defaults) => [
        ...defaults.filter((sensor) => sensor !== PointerSensor),
        pointerSensor,
      ]}
      onBeforeDragStart={prepareDrag}
      onDragEnd={(event) => {
        setIsReordering(false);
        const { source } = event.operation;
        if (!event.canceled && isSortable(source) && source.initialIndex !== source.index) {
          dispatch({
            type: "REORDER_EXERCISE",
            instanceId: String(source.id),
            toIndex: source.index,
          });
        }
      }}
    >
      <div className="flex flex-col gap-3">
        {exercises.map((we, index) => (
          <SortableExercise
            key={we.instanceId}
            we={we}
            index={index}
            count={exercises.length}
            isReordering={isReordering}
            onPrepareDrag={prepareDrag}
            previousSets={previousSets}
            autoRestTimer={autoRestTimer}
            collapsedCards={collapsedCards}
            onToggleCollapse={onToggleCollapse}
            dispatch={dispatch}
          />
        ))}
      </div>
    </DragDropProvider>
  );
}
