import { Pause, Play, Timer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/shared/lib";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  FieldGroup,
  FieldLabel,
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/ui";

import type { WorkoutAction } from "../model/reducer";
import { formatRestTime, getRestSeconds, type RestClock } from "../model/rest-clock";

interface RestTimerProps {
  open: boolean;
  clock: RestClock | null;
  dispatch: React.ActionDispatch<[action: WorkoutAction]>;
  aboveSaveButton?: boolean;
}

export function RestTimer({ open, clock, dispatch, aboveSaveButton = false }: RestTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const [selectedSeconds, setSelectedSeconds] = useState(90);
  const notifiedDeadline = useRef<number | null>(null);
  const seconds = clock ? Math.min(clock.remainingSeconds, getRestSeconds(clock, now)) : 0;
  const running = clock?.endsAt != null;

  useEffect(() => {
    if (!clock?.endsAt) return;
    const update = () => setNow(Date.now());
    const interval = window.setInterval(update, 250);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [clock?.endsAt]);

  useEffect(() => {
    if (!clock?.endsAt || seconds > 0 || notifiedDeadline.current === clock.endsAt) return;
    notifiedDeadline.current = clock.endsAt;
    if (Date.now() - clock.endsAt < 10000) {
      navigator.vibrate?.([200, 100, 200]);
      toast("Відпочинок завершено", { description: "Можна переходити до наступного підходу." });
    }
  }, [clock?.endsAt, seconds]);

  const onOpenChange = (nextOpen: boolean) => dispatch({ type: "SET_TIMER_OPEN", open: nextOpen });

  return (
    <>
      {clock && (
        <section
          aria-label="Таймер відпочинку"
          className={cn(
            "fixed inset-x-0 z-40 px-4",
            aboveSaveButton
              ? "bottom-[calc(10.5rem+env(safe-area-inset-bottom))]"
              : "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
          )}
        >
          <div className="border-border bg-background/95 mx-auto flex max-w-lg items-center gap-1 rounded-2xl border p-2 shadow-lg backdrop-blur">
            <Button
              variant="ghost"
              className="h-11 min-w-0 flex-1 justify-start"
              onClick={() => onOpenChange(true)}
              aria-label={
                seconds > 0
                  ? `Відпочинок ${formatRestTime(seconds)}${running ? "" : ", пауза"}`
                  : "Відпочинок завершено"
              }
            >
              <Timer data-icon="inline-start" />
              <span className="truncate">
                {seconds > 0 ? (running ? "Відпочинок" : "Пауза") : "Відпочинок завершено"}
              </span>
              {seconds > 0 && (
                <span className="ml-auto tabular-nums">{formatRestTime(seconds)}</span>
              )}
            </Button>
            {seconds > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-11"
                onClick={() =>
                  dispatch({ type: "EXTEND_REST_TIMER", seconds: 15, now: Date.now() })
                }
                aria-label="Додати 15 секунд відпочинку"
              >
                +15 с
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              onClick={() => dispatch({ type: "STOP_REST_TIMER" })}
              aria-label={seconds > 0 ? "Пропустити відпочинок" : "Закрити таймер"}
            >
              <X />
            </Button>
          </div>
        </section>
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Відпочинок</DialogTitle>
            <DialogDescription>
              Таймер продовжить працювати після закриття цього вікна.
            </DialogDescription>
          </DialogHeader>
          {clock && (
            <div className="flex flex-col items-center gap-4 py-2">
              <span className="text-5xl font-medium tabular-nums">{formatRestTime(seconds)}</span>
              <p className="text-muted-foreground text-sm">
                {seconds === 0
                  ? "Відпочинок завершено"
                  : running
                    ? "До наступного підходу"
                    : "На паузі"}
              </p>
              {seconds > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => dispatch({ type: "TOGGLE_REST_TIMER", now: Date.now() })}
                  >
                    {running ? (
                      <Pause data-icon="inline-start" />
                    ) : (
                      <Play data-icon="inline-start" />
                    )}
                    {running ? "Пауза" : "Продовжити"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      dispatch({ type: "EXTEND_REST_TIMER", seconds: 15, now: Date.now() })
                    }
                  >
                    +15 с
                  </Button>
                </div>
              )}
              <Button variant="ghost" onClick={() => dispatch({ type: "STOP_REST_TIMER" })}>
                {seconds > 0 ? "Пропустити відпочинок" : "Закрити таймер"}
              </Button>
            </div>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel id="rest-duration-label">
                {clock ? "Новий таймер" : "Тривалість відпочинку"}
              </FieldLabel>
              <ToggleGroup
                variant="outline"
                value={[String(selectedSeconds)]}
                onValueChange={(values) => {
                  if (values[0]) setSelectedSeconds(Number(values[0]));
                }}
                aria-labelledby="rest-duration-label"
                className="w-full"
              >
                {[60, 90, 120, 180].map((preset) => (
                  <ToggleGroupItem key={preset} value={String(preset)} className="h-11 flex-1">
                    {formatRestTime(preset)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </FieldGroup>
          <Button
            onClick={() =>
              dispatch({ type: "START_REST_TIMER", seconds: selectedSeconds, now: Date.now() })
            }
          >
            <Play data-icon="inline-start" />
            {clock ? "Почати новий відпочинок" : "Почати відпочинок"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
