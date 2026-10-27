import {
  Activity,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Clock,
  Dumbbell,
  Flame,
  Loader2,
  Minus,
} from "lucide-react";
import { useState } from "react";

import type { LastWorkoutComparison, Period, TopExercise } from "@/entities/progress";
import { ExerciseProgressChart } from "@/entities/progress";
import { MuscleDistributionChart } from "@/entities/progress";
import { useGlobalStats, usePeriodProgress } from "@/entities/progress";
import { cn } from "@/shared/lib";
import { Card, CardContent, ToggleGroup, ToggleGroupItem } from "@/shared/ui";
import { LoaderBar } from "@/shared/ui";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 днів" },
  { value: "30d", label: "30 днів" },
  { value: "90d", label: "90 днів" },
  { value: "all", label: "Весь час" },
];

export function ProgressContent() {
  const [period, setPeriod] = useState<Period>("30d");
  const { data: global, isLoading: globalLoading } = useGlobalStats();
  const { data: periodData, isFetching, isLoading: periodLoading } = usePeriodProgress(period);

  if (globalLoading || periodLoading) {
    return <LoaderBar />;
  }

  const currentPeriodLabel = PERIODS.find((currentPeriod) => currentPeriod.value === period)?.label;
  const totalWorkouts = periodData?.stats.totalWorkouts ?? 0;
  const avgDuration = periodData?.stats.avgDuration;
  const streak = global?.streak ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 pt-7 pb-6 md:px-8">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-medium tracking-tight">Прогрес</h1>
          <p className="text-muted-foreground text-sm">Кожне тренування має значення.</p>
        </div>
        {isFetching && (
          <Loader2
            className="text-muted-foreground size-4 animate-spin"
            aria-label="Оновлення статистики"
          />
        )}
      </header>

      <div className="scrollbar-none overflow-x-auto">
        <ToggleGroup
          value={[period]}
          onValueChange={(values) => {
            const next = PERIODS.find((option) => option.value === values[0]);
            if (next) setPeriod(next.value);
          }}
          aria-label="Період аналізу"
          spacing={1}
        >
          {PERIODS.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <section className="flex flex-col gap-4" aria-labelledby="activity-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="activity-title" className="text-base font-semibold">
            Огляд активності
          </h2>
          <span className="text-muted-foreground text-xs">{currentPeriodLabel}</span>
        </div>
        <div className="divide-border grid grid-cols-3 divide-x">
          <MetricCard
            icon={<CalendarDays className="size-3.5" />}
            label="Тренування"
            value={`${totalWorkouts}`}
            helper="за період"
          />
          <MetricCard
            icon={<Clock className="size-3.5" />}
            label="Тривалість"
            value={avgDuration ? `${avgDuration}` : "—"}
            helper="хв у середньому"
          />
          <MetricCard
            icon={<Flame className="size-3.5" />}
            label="Серія"
            value={`${streak}`}
            helper={streak === 1 ? "тиждень" : streak > 1 && streak < 5 ? "тижні" : "тижнів"}
          />
        </div>
      </section>

      {global?.lastComparison ? (
        <LastWorkoutCard comparison={global.lastComparison} />
      ) : (
        <EmptyInsightCard
          title="Останнє тренування"
          description="Тут з’явиться порівняння після завершення тренувань."
          icon={<Activity className="size-5" />}
        />
      )}

      {periodData && <MuscleDistributionChart data={periodData.muscleTonnage} />}

      {periodData && periodData.topExercises.length > 0 ? (
        <TopExercisesList exercises={periodData.topExercises} />
      ) : (
        <EmptyInsightCard
          title="Топ вправ"
          description="Коли назбирається достатньо завершених тренувань, тут з'являться вправи з найбільшим обсягом."
          icon={<Dumbbell className="size-5" />}
        />
      )}

      {periodData && <ExerciseProgressChart data={periodData.exerciseProgress} />}
    </div>
  );
}

// --- Порівняння з минулим тренуванням ---

function LastWorkoutCard({ comparison }: { comparison: LastWorkoutComparison }) {
  const date = new Date(comparison.lastDate).toLocaleDateString("uk-UA", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  return (
    <Card className="p-0">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">Останнє тренування</h3>
            <p className="text-muted-foreground text-xs">{date}</p>
          </div>
          <span className="text-muted-foreground text-xs">до попереднього</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <LatestStatCard
            label="Об'єм"
            value={
              comparison.lastVolume > 1000
                ? `${(comparison.lastVolume / 1000).toFixed(1)}`
                : `${comparison.lastVolume}`
            }
            helper={comparison.lastVolume > 1000 ? "т" : "кг"}
            diff={comparison.volumeDiff}
          />
          <LatestStatCard
            label="Підходи"
            value={`${comparison.lastSets}`}
            helper="усього"
            diff={comparison.setsDiff}
          />
          <LatestStatCard
            label="Тривалість"
            value={comparison.lastDuration ? `${comparison.lastDuration}` : "—"}
            helper="хв"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DiffBadge({ diff, unit = "" }: { diff: number | null; unit?: string }) {
  if (diff === null) return null;

  const isPositive = diff > 0;
  const isZero = diff === 0;

  return (
    <span
      className={cn(
        "mt-1 flex justify-center gap-0.5 text-xs font-medium",
        isZero ? "text-muted-foreground" : isPositive ? "text-primary" : "text-destructive"
      )}
    >
      {isZero ? (
        <Minus className="size-3" />
      ) : isPositive ? (
        <ArrowUp className="size-3" />
      ) : (
        <ArrowDown className="size-3" />
      )}
      {isZero ? "=" : `${isPositive ? "+" : ""}${diff}${unit}`}
    </span>
  );
}

// --- Топ вправ за об'ємом ---

function TopExercisesList({ exercises }: { exercises: TopExercise[] }) {
  const maxVolume = exercises[0]?.volume ?? 1;

  return (
    <Card className="p-0">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium">Топ вправ за об&apos;ємом</h3>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
            {exercises.length}
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {exercises.map((ex) => (
            <div key={ex.exerciseId}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm">{ex.exerciseName}</span>
                <span className="text-muted-foreground text-xs">
                  {ex.volume > 1000 ? `${(ex.volume / 1000).toFixed(1)}т` : `${ex.volume} кг`}
                  {" · "}
                  {ex.sets} підх
                </span>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(ex.volume / maxVolume) * 100}%`,
                    backgroundColor: "var(--chart-1)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
    <div className="flex min-w-0 flex-col gap-1 px-3 first:pl-0 last:pr-0">
      <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-1.5 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-medium tracking-tight tabular-nums">{value}</span>
        <span className="text-muted-foreground text-xs">{helper}</span>
      </div>
    </div>
  );
}

function LatestStatCard({
  label,
  value,
  helper,
  diff,
}: {
  label: string;
  value: string;
  helper: string;
  diff?: number | null;
}) {
  return (
    <div className="px-1 py-2 text-center">
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="mt-1 flex items-end justify-center gap-1">
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        <span className="text-muted-foreground pb-0.5 text-xs">{helper}</span>
      </div>
      {diff !== undefined ? <DiffBadge diff={diff} /> : null}
    </div>
  );
}

function EmptyInsightCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-0">
      <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
          {icon}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
