import { useState } from "react";
import { Flame, Clock, Dumbbell, Loader2, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { ExerciseProgressChart } from "@/src/components/charts/one-rm-chart";
import { MuscleDistributionChart } from "@/src/components/charts/muscle-distribution-chart";
import { useProgress } from "@/src/lib/hooks/use-progress";
import type { Period, LastWorkoutComparison, TopExercise } from "@/src/lib/api/stats";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 днів" },
  { value: "30d", label: "30 днів" },
  { value: "90d", label: "90 днів" },
  { value: "all", label: "Весь час" },
];

export function ProgressContent() {
  const [period, setPeriod] = useState<Period>("30d");
  const { data, isFetching, isLoading } = useProgress(period);

  if (isLoading || !data) {
    return (
      <div className="fixed inset-x-0 top-0 z-100">
        <div className="bg-primary h-0.5 animate-pulse" />
      </div>
    );
  }

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

      {/* Загальна статистика */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Flame className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-2xl font-bold">{data.stats.streak}</span>
            <span className="text-muted-foreground text-xs">тижнів стрік</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Clock className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-2xl font-bold">{data.stats.avgDuration ?? "—"}</span>
            <span className="text-muted-foreground text-xs">хв середня</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Dumbbell className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-2xl font-bold">{data.stats.totalWorkouts}</span>
            <span className="text-muted-foreground text-xs">тренувань</span>
          </CardContent>
        </Card>
      </div>

      {/* Порівняння з минулим тренуванням */}
      {data.lastComparison && <LastWorkoutCard comparison={data.lastComparison} />}

      <Separator />

      {/* Тонаж по м'язових групах */}
      <MuscleDistributionChart data={data.muscleTonnage} />

      {/* Топ вправ за об'ємом */}
      {data.topExercises.length > 0 && <TopExercisesList exercises={data.topExercises} />}

      <Separator />

      {/* Прогрес конкретної вправи */}
      <ExerciseProgressChart data={data.exerciseProgress} />
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
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-medium">Останнє тренування</h3>
        <p className="text-muted-foreground mb-3 text-xs">{date}</p>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold">
              {comparison.lastVolume > 1000
                ? `${(comparison.lastVolume / 1000).toFixed(1)}т`
                : comparison.lastVolume}
            </span>
            <span className="text-muted-foreground text-xs">об&apos;єм кг</span>
            <DiffBadge diff={comparison.volumeDiff} unit=" кг" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold">{comparison.lastSets}</span>
            <span className="text-muted-foreground text-xs">підходів</span>
            <DiffBadge diff={comparison.setsDiff} />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold">{comparison.lastDuration ?? "—"}</span>
            <span className="text-muted-foreground text-xs">хвилин</span>
          </div>
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
      className={`mt-1 flex items-center gap-0.5 text-xs font-medium ${
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
    <Card>
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
