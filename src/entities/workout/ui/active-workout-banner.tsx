import { useEffect, useMemo, useState } from "react";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { Link, useLocation } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import {
  ACTIVE_WORKOUT_DRAFT_EVENT,
  restoreActiveWorkoutDraft,
  type ActiveWorkoutDraft,
} from "../model/persistence";

function getElapsedSeconds(startedAt: string, now: number) {
  const started = new Date(startedAt).getTime();
  if (!Number.isFinite(started)) return 0;

  return Math.max(0, Math.floor((now - started) / 1000));
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(
      2,
      "0"
    )}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getActiveSetText(draft: ActiveWorkoutDraft) {
  const activeExercise =
    draft.exercises.find((exercise) => exercise.sets.some((set) => !set.completed)) ??
    draft.exercises[draft.exercises.length - 1];
  const nextSet = activeExercise?.sets.find((set) => !set.completed);

  if (!activeExercise) {
    return { title: "Активне тренування", subtitle: "Повернутися до тренування" };
  }

  return {
    title: activeExercise.exercise.name,
    subtitle: nextSet?.reps ? `Далі: ${nextSet.reps} повт.` : "Повернутися до тренування",
  };
}

function WorkoutDurationFlow({ seconds }: { seconds: number }) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return (
    <NumberFlowGroup>
      <span
        className="flex shrink-0 items-baseline text-2xl font-bold text-orange-500 tabular-nums"
        style={{ fontVariantNumeric: "tabular-nums" }}
        aria-label={formatDuration(seconds)}
      >
        {hours > 0 && <NumberFlow trend={1} value={hours} />}
        <NumberFlow
          prefix={hours > 0 ? ":" : ""}
          trend={1}
          value={minutes}
          digits={{ 1: { max: hours > 0 ? 5 : 9 } }}
          format={{ minimumIntegerDigits: 2 }}
        />
        <NumberFlow
          prefix=":"
          trend={1}
          value={remainingSeconds}
          digits={{ 1: { max: 5 } }}
          format={{ minimumIntegerDigits: 2 }}
        />
      </span>
    </NumberFlowGroup>
  );
}

export function ActiveWorkoutBanner({
  onVisibilityChange,
}: {
  onVisibilityChange?: (visible: boolean) => void;
}) {
  const { pathname } = useLocation();
  const [draft, setDraft] = useState<ActiveWorkoutDraft | null>(() => restoreActiveWorkoutDraft());
  const [now, setNow] = useState(() => Date.now());
  const hiddenOnCurrentRoute = pathname === "/workout/new";
  const hasActiveDraft = Boolean(draft?.exercises.length);
  const visible = hasActiveDraft && !hiddenOnCurrentRoute;

  useEffect(() => {
    const syncDraft = () => {
      setDraft(restoreActiveWorkoutDraft());
      setNow(Date.now());
    };

    window.addEventListener(ACTIVE_WORKOUT_DRAFT_EVENT, syncDraft);
    window.addEventListener("storage", syncDraft);
    window.addEventListener("focus", syncDraft);

    return () => {
      window.removeEventListener(ACTIVE_WORKOUT_DRAFT_EVENT, syncDraft);
      window.removeEventListener("storage", syncDraft);
      window.removeEventListener("focus", syncDraft);
    };
  }, []);

  useEffect(() => {
    if (!hasActiveDraft) return;

    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [hasActiveDraft]);

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [onVisibilityChange, visible]);

  const content = useMemo(() => (draft ? getActiveSetText(draft) : null), [draft]);
  const elapsedSeconds = draft ? getElapsedSeconds(draft.startedAt, now) : 0;

  if (!visible || !draft || !content) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 px-4">
      <div className="mx-auto max-w-lg">
        <Link
          to="/workout/new"
          className="border-border/80 bg-card/94 supports-backdrop-filter:bg-card/86 flex h-16 items-center gap-3 rounded-full border px-4 shadow-[0_12px_42px_rgb(0_0_0/0.22)] backdrop-blur-xl transition-transform active:scale-[0.99]"
          aria-label="Повернутися до активного тренування"
        >
          <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
            <Dumbbell className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{content.title}</p>
            <p className="text-muted-foreground truncate text-sm">{content.subtitle}</p>
          </div>

          <WorkoutDurationFlow seconds={elapsedSeconds} />
        </Link>
      </div>
    </div>
  );
}
