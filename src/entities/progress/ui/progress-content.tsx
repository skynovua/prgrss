import { useState } from "react";
import {
  Flame,
  Clock,
  Dumbbell,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  CalendarDays,
  Activity,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/shared/ui";
import { ExerciseProgressChart } from "@/entities/progress";
import { MuscleDistributionChart } from "@/entities/progress";
import { useGlobalStats, usePeriodProgress } from "@/entities/progress";
import type { Period, LastWorkoutComparison, TopExercise } from "@/entities/progress";
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
  const topExercise = periodData?.topExercises[0] ?? null;
  const totalWorkouts = periodData?.stats.totalWorkouts ?? 0;
  const avgDuration = periodData?.stats.avgDuration;
  const streak = global?.streak ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Прогрес</h1>
        {isFetching && <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />}
      </div>

      {/* Фільтр періоду */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              period === p.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <CardContent className="relative px-4 py-4">
          <div className="relative flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
                    {currentPeriodLabel}
                  </span>
                  <span className="text-muted-foreground text-xs">Огляд активності</span>
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Твоя динаміка тренувань</h2>
              </div>

              <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard
                icon={<Flame className="h-4 w-4" />}
                label="Стрік"
                value={`${streak}`}
                helper={streak === 1 ? "тиждень" : streak < 5 ? "тижні" : "тижнів"}
              />
              <MetricCard
                icon={<CalendarDays className="h-4 w-4" />}
                label="Тренування"
                value={`${totalWorkouts}`}
                helper="за період"
              />
              <MetricCard
                icon={<Clock className="h-4 w-4" />}
                label="Середня тривалість"
                value={avgDuration ? `${avgDuration}` : "—"}
                helper="хв"
              />
              <MetricCard
                icon={<Dumbbell className="h-4 w-4" />}
                label="Топ вправа"
                value={topExercise ? compactExerciseName(topExercise.exerciseName) : "—"}
                helper={topExercise ? topExercise.sets + " підх" : "немає"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {global?.lastComparison ? (
          <LastWorkoutCard comparison={global.lastComparison} />
        ) : (
          <EmptyInsightCard
            title="Останнє тренування"
            description="Коли з'являться завершені тренування, тут буде коротке порівняння з попередньою сесією."
            icon={<Activity className="text-muted-foreground h-5 w-5" />}
          />
        )}

        <Card className="p-0">
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-medium">Що важливо</h3>
            <div className="flex flex-col gap-2.5 text-sm">
              <InsightRow
                label="Стрік"
                value={`${streak} ${streak === 1 ? "тиждень" : streak < 5 ? "тижні" : "тижнів"}`}
              />
              <InsightRow
                label="Середня тривалість"
                value={avgDuration ? `${avgDuration} хв` : "—"}
              />
              <InsightRow
                label="Найоб'ємніша вправа"
                value={
                  topExercise
                    ? `${topExercise.exerciseName} · ${topExercise.volume > 1000 ? `${(topExercise.volume / 1000).toFixed(1)} т` : `${topExercise.volume} кг`}`
                    : "Ще немає даних"
                }
              />
              <InsightRow
                label="Активність"
                value={
                  totalWorkouts > 0
                    ? `${totalWorkouts} тренувань за період`
                    : "Без завершених тренувань"
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {periodData && <MuscleDistributionChart data={periodData.muscleTonnage} />}

      {periodData && periodData.topExercises.length > 0 ? (
        <TopExercisesList exercises={periodData.topExercises} />
      ) : (
        <EmptyInsightCard
          title="Топ вправ"
          description="Коли назбирається достатньо завершених тренувань, тут з'являться вправи з найбільшим обсягом."
          icon={<Dumbbell className="text-muted-foreground h-5 w-5" />}
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
          <span className="text-muted-foreground text-xs">vs попереднє</span>
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
      className={`mt-1 flex justify-center gap-0.5 text-xs font-medium ${
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
        <h3 className="mb-3 text-sm font-medium">Топ вправ за об&apos;ємом</h3>
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
    <div className="bg-background/70 rounded-2xl border px-3 py-3 backdrop-blur-sm">
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="max-w-full truncate text-lg font-semibold tabular-nums">{value}</span>
        <span className="text-muted-foreground truncate pb-0.5 text-xs">{helper}</span>
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
    <div className="bg-muted/40 rounded-2xl px-3 py-3 text-center">
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="mt-1 flex items-end justify-center gap-1">
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        <span className="text-muted-foreground pb-0.5 text-xs">{helper}</span>
      </div>
      {diff !== undefined ? <DiffBadge diff={diff} /> : null}
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
        <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-2xl">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function compactExerciseName(name: string) {
  return name.length > 16 ? `${name.slice(0, 16)}…` : name;
}
