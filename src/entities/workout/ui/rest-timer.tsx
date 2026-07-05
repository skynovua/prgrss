import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui";
import { Pause, Play, RotateCcw, X } from "lucide-react";

interface RestTimerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSeconds?: number;
}

const PRESETS = [60, 90, 120, 180];

export function RestTimer({ open, onOpenChange, defaultSeconds = 90 }: RestTimerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <RestTimerContent
          key={defaultSeconds}
          defaultSeconds={defaultSeconds}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}

function RestTimerContent({
  defaultSeconds,
  onClose,
}: {
  defaultSeconds: number;
  onClose: () => void;
}) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [initialSeconds, setInitialSeconds] = useState(defaultSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((currentSeconds) => {
          const nextSeconds = Math.max(0, currentSeconds - 1);

          if (nextSeconds === 0) {
            setIsRunning(false);
          }

          return nextSeconds;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, seconds]);

  useEffect(() => {
    if (seconds !== 0 || finishedRef.current) return;

    finishedRef.current = true;
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [seconds]);

  const formatTime = useCallback((s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const progress = initialSeconds > 0 ? seconds / initialSeconds : 0;

  const handlePreset = (preset: number) => {
    setSeconds(preset);
    setInitialSeconds(preset);
    setIsRunning(true);
  };

  const handleReset = () => {
    setSeconds(initialSeconds);
    setIsRunning(true);
  };

  return (
    <DialogContent className="max-w-xs">
      <DialogHeader>
        <DialogTitle className="text-center">Відпочинок</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col items-center gap-6 py-4">
        {/* Кругова прогрес-барка */}
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress)}`}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000"
            />
          </svg>
          <span className="text-4xl font-bold tabular-nums">{formatTime(seconds)}</span>
        </div>

        {/* Пресети */}
        <div className="flex gap-2">
          {PRESETS.map((preset) => (
            <Button key={preset} variant="outline" size="sm" onClick={() => handlePreset(preset)}>
              {formatTime(preset)}
            </Button>
          ))}
        </div>

        {/* Контролі */}
        <div className="flex gap-3">
          <Button variant="outline" size="icon" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
