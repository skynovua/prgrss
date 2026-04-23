import { useState } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  Dumbbell,
  Loader2,
  Minus,
  Scale,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { ExerciseProgressChart } from "@/src/components/charts/one-rm-chart";
import { LoaderBar } from "@/src/components/ui/loader-bar";
import { useExercises } from "@/src/lib/hooks/use-exercises";
import { useExerciseProgress } from "@/src/lib/hooks/use-progress";
import type { Period } from "@/src/lib/api/stats";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 днів" },
  { value: "30d", label: "30 днів" },
  { value: "90d", label: "90 днів" },
  { value: "all", label: "Весь час" },
];

export default function ExerciseProgressPage() {
  const navigate = useNavigate();
  const { exerciseId } = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const [period, setPeriod] = useState<Period>("30d");
  const { data: exercises } = useExercises();
  const {
    data: exerciseProgress,
    isLoading,
    isFetching,
  } = useExerciseProgress(exerciseId ?? "", period);

  if (!exerciseId || isLoading) {
    return <LoaderBar />;
  }

  const fallbackName = exercises?.find((exercise) => exercise.id === exerciseId)?.name ?? "Вправа";
  const exerciseName = exerciseProgress?.exerciseName ?? fallbackName;
  const points = exerciseProgress?.data ?? [];
  const sessionsCount = points.length;
  const bestWeight = points.reduce((max, point) => Math.max(max, point.bestWeight), 0);
  const bestEstimated1RM = points.reduce((max, point) => Math.max(max, point.estimated1RM), 0);
  const totalVolume = points.reduce((sum, point) => sum + point.totalVolume, 0);
  const latestPoint = points.at(-1) ?? null;
  const previousPoint = points.at(-2) ?? null;
  const latestDateLabel = latestPoint ? formatFullDate(latestPoint.date) : null;
  const previousDateLabel = previousPoint ? formatFullDate(previousPoint.date) : null;
  const latestVolumeDiff =
    latestPoint && previousPoint ? latestPoint.totalVolume - previousPoint.totalVolume : null;
  const latestWeightDiff =
    latestPoint && previousPoint ? latestPoint.bestWeight - previousPoint.bestWeight : null;
  const latest1RMDiff =
    latestPoint && previousPoint ? latestPoint.estimated1RM - previousPoint.estimated1RM : null;

  const handleBack = () => {
    if (search.from) {
      navigate({ to: search.from });
      return;
    }

    navigate({ to: "/progress" });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground -ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
            onClick={handleBack}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">Статистика вправи</p>
            <h1 className="truncate text-xl font-bold">{exerciseName}</h1>
          </div>
        </div>

        {isFetching && <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {PERIODS.map((currentPeriod) => (
          <button
            key={currentPeriod.value}
            onClick={() => setPeriod(currentPeriod.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              period === currentPeriod.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {currentPeriod.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <CardContent className="relative px-4 py-4">
          <div className="from-primary/10 absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent" />
          <div className="relative flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
                    {PERIODS.find((currentPeriod) => currentPeriod.value === period)?.label}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {sessionsCount} {sessionsCount === 1 ? "сесія" : "сесій"}
                  </span>
                </div>
                <h2 className="text-xl font-semibold tracking-tight">{exerciseName}</h2>
              </div>

              <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <Dumbbell className="h-5 w-5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Best 1RM"
                value={`${Math.round(bestEstimated1RM)}`}
                helper="оцінка"
              />
              <MetricCard
                icon={<Dumbbell className="h-4 w-4" />}
                label="Макс вага"
                value={`${Math.round(bestWeight)}`}
                helper="кг"
              />
              <MetricCard
                icon={<Scale className="h-4 w-4" />}
                label="Об'єм"
                value={
                  totalVolume >= 1000
                    ? `${(totalVolume / 1000).toFixed(1)}`
                    : `${Math.round(totalVolume)}`
                }
                helper={totalVolume >= 1000 ? "т" : "кг"}
              />
              <MetricCard
                icon={<CalendarDays className="h-4 w-4" />}
                label="Сесії"
                value={`${sessionsCount}`}
                helper="за період"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="p-0">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium">Остання сесія</h3>
                <p className="text-muted-foreground text-xs">
                  {latestDateLabel ?? "Ще немає завершених записів"}
                </p>
              </div>
              {previousDateLabel && (
                <span className="text-muted-foreground text-xs">vs {previousDateLabel}</span>
              )}
            </div>

            {latestPoint ? (
              <div className="grid grid-cols-3 gap-3">
                <LatestStat
                  label="1RM"
                  value={`${Math.round(latestPoint.estimated1RM)}`}
                  helper="кг"
                  diff={latest1RMDiff}
                />
                <LatestStat
                  label="Макс сет"
                  value={`${Math.round(latestPoint.bestWeight)}`}
                  helper="кг"
                  diff={latestWeightDiff}
                />
                <LatestStat
                  label="Об'єм"
                  value={
                    latestPoint.totalVolume >= 1000
                      ? `${(latestPoint.totalVolume / 1000).toFixed(1)}`
                      : `${Math.round(latestPoint.totalVolume)}`
                  }
                  helper={latestPoint.totalVolume >= 1000 ? "т" : "кг"}
                  diff={latestVolumeDiff}
                />
              </div>
            ) : (
              <div className="text-muted-foreground flex h-24 items-center justify-center text-sm">
                Ще немає достатньо даних для короткого summary
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-medium">Що важливо</h3>
            <div className="flex flex-col gap-2.5 text-sm">
              <InsightRow
                label="Найкращий estimated 1RM"
                value={`${Math.round(bestEstimated1RM)} кг`}
              />
              <InsightRow label="Найбільша робоча вага" value={`${Math.round(bestWeight)} кг`} />
              <InsightRow
                label="Загальний об'єм за період"
                value={
                  totalVolume >= 1000
                    ? `${(totalVolume / 1000).toFixed(1)} т`
                    : `${Math.round(totalVolume)} кг`
                }
              />
              <InsightRow
                label="Частота виконання"
                value={`${sessionsCount} ${sessionsCount === 1 ? "сесія" : "сесій"}`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {exerciseProgress ? (
        <ExerciseProgressChart data={[exerciseProgress]} />
      ) : (
        <Card className="p-0">
          <CardContent className="flex h-56 flex-col items-center justify-center gap-2 p-6 text-center">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-2xl">
              <TrendingUp className="text-muted-foreground h-5 w-5" />
            </div>
            <p className="text-sm font-medium">Ще недостатньо даних для графіка</p>
            <p className="text-muted-foreground max-w-xs text-sm">
              Потрібно хоча б 2 завершені сесії з цією вправою, щоб побачити динаміку прогресу.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="bg-background/70 rounded-2xl border px-3 py-3 backdrop-blur-sm">
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        <span className="text-muted-foreground pb-0.5 text-xs">{helper}</span>
      </div>
    </div>
  );
}

function LatestStat({
  label,
  value,
  helper,
  diff,
}: {
  label: string;
  value: string;
  helper: string;
  diff: number | null;
}) {
  return (
    <div className="bg-muted/40 rounded-2xl px-3 py-3 text-center">
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="mt-1 flex items-end justify-center gap-1">
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        <span className="text-muted-foreground pb-0.5 text-xs">{helper}</span>
      </div>
      <DiffBadge diff={diff} />
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function DiffBadge({ diff }: { diff: number | null }) {
  if (diff === null) {
    return <p className="text-muted-foreground mt-1 text-[11px]">Без попередньої сесії</p>;
  }

  const isPositive = diff > 0;
  const isZero = diff === 0;

  return (
    <div
      className={`mt-1 flex items-center justify-center gap-1 text-[11px] font-medium ${
        isZero ? "text-muted-foreground" : isPositive ? "text-green-500" : "text-red-500"
      }`}
    >
      {isZero ? (
        <Minus className="h-3 w-3" />
      ) : isPositive ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
      <span>{isZero ? "без змін" : `${isPositive ? "+" : ""}${Math.round(diff)}`}</span>
    </div>
  );
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
