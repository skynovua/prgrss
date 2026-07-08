import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import {
  ACTIVE_WORKOUT_DRAFT_EVENT,
  restoreActiveWorkoutDraft,
  type ActiveWorkoutDraft,
} from "../model/persistence";

function formatDuration(startedAt: string, now: number) {
  const started = new Date(startedAt).getTime();
  if (!Number.isFinite(started)) return "00:00";

  const totalSeconds = Math.max(0, Math.floor((now - started) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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

export function ActiveWorkoutBanner({
  onVisibilityChange,
}: {
  onVisibilityChange?: (visible: boolean) => void;
}) {
  const { pathname } = useLocation();
  const [draft, setDraft] = useState<ActiveWorkoutDraft | null>(() => restoreActiveWorkoutDraft());
  const [now, setNow] = useState(() => Date.now());
  const hiddenOnCurrentRoute = pathname === "/workout/new";
  const visible = Boolean(draft?.exercises.length) && !hiddenOnCurrentRoute;

  useEffect(() => {
    const syncDraft = () => setDraft(restoreActiveWorkoutDraft());

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
    if (!visible) return;

    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [visible]);

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [onVisibilityChange, visible]);

  const content = useMemo(() => (draft ? getActiveSetText(draft) : null), [draft]);

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
          <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <Dumbbell className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{content.title}</p>
            <p className="text-muted-foreground truncate text-sm">{content.subtitle}</p>
          </div>

          <span className="shrink-0 text-2xl font-bold tabular-nums text-orange-500">
            {formatDuration(draft.startedAt, now)}
          </span>
        </Link>
      </div>
    </div>
  );
}
