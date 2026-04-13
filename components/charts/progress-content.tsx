"use client";

import { useState, useTransition } from "react";
import { Dumbbell, TrendingUp, Weight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OneRMChart } from "@/components/charts/one-rm-chart";
import { WeeklyVolumeChart } from "@/components/charts/weekly-volume-chart";
import { MuscleDistributionChart } from "@/components/charts/muscle-distribution-chart";
import { WorkoutFrequencyChart } from "@/components/charts/workout-frequency-chart";
import { getProgressData, type ProgressData, type Period } from "@/lib/actions/stats";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 днів" },
  { value: "30d", label: "30 днів" },
  { value: "90d", label: "90 днів" },
  { value: "all", label: "Весь час" },
];

interface Props {
  initialData: ProgressData;
  initialPeriod: Period;
}

export function ProgressContent({ initialData, initialPeriod }: Props) {
  const [data, setData] = useState(initialData);
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [isPending, startTransition] = useTransition();

  function handlePeriodChange(newPeriod: Period) {
    setPeriod(newPeriod);
    startTransition(async () => {
      const newData = await getProgressData(newPeriod);
      setData(newData);
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Прогрес</h1>
        {isPending && <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />}
      </div>

      {/* Фільтр періоду */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePeriodChange(p.value)}
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
            <Dumbbell className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-2xl font-bold">{data.stats.totalWorkouts}</span>
            <span className="text-muted-foreground text-xs">тренувань</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <TrendingUp className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-2xl font-bold">{data.stats.totalSets}</span>
            <span className="text-muted-foreground text-xs">підходів</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Weight className="text-muted-foreground mb-1 h-5 w-5" />
            <span className="text-2xl font-bold">
              {data.stats.totalVolume > 1000
                ? `${(data.stats.totalVolume / 1000).toFixed(1)}т`
                : data.stats.totalVolume}
            </span>
            <span className="text-muted-foreground text-xs">об&apos;єм кг</span>
          </CardContent>
        </Card>
      </div>

      {/* Табси */}
      <Tabs defaultValue="strength">
        <TabsList className="w-full">
          <TabsTrigger value="strength" className="flex-1">
            Сила
          </TabsTrigger>
          <TabsTrigger value="volume" className="flex-1">
            Об&apos;єм
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">
            Активність
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strength" className="mt-4 space-y-4">
          <OneRMChart data={data.oneRM} />
        </TabsContent>

        <TabsContent value="volume" className="mt-4 space-y-4">
          <WeeklyVolumeChart data={data.weeklyVolume} />
          <MuscleDistributionChart data={data.muscleDistribution} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4 space-y-4">
          <WorkoutFrequencyChart data={data.workoutFrequency} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
