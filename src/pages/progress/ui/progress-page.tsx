import { Link } from "@tanstack/react-router";
import { Activity, Award, CalendarDays, Clock3, Dumbbell, Loader2 } from "lucide-react";
import { useState } from "react";

import { ExerciseProgressChart, type Period } from "@/entities/progress";
import {
  Button,
  buttonVariants,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  LoadingBlocks,
  LoadingNotice,
  RefreshNotice,
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/ui";

import { buildActivityTimeline, formatNumber, formatVolume, PERIODS } from "../model/statistics";
import { useStatistics } from "../model/use-statistics";
import { ActivityChart } from "./activity-chart";
import { LoadDistribution } from "./load-distribution";

export default function ProgressPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const { data, isPending, isFetching, isPlaceholderData, isError, refetch } =
    useStatistics(period);
  const timeline = data
    ? buildActivityTimeline(data.workouts, data.period, new Date(data.asOf))
    : null;
  const totalVolume = data?.muscleTonnage.reduce((total, entry) => total + entry.volume, 0) ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 pt-7 pb-6 md:px-8">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-medium tracking-tight">Статистика</h1>
          <p className="text-muted-foreground text-sm">Твій ритм, навантаження та сила.</p>
        </div>
        <Link
          to="/achievements"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label="Досягнення"
        >
          <Award />
        </Link>
      </header>

      <div className="flex flex-col gap-2">
        <div className="scrollbar-none overflow-x-auto">
          <ToggleGroup
            value={[period]}
            spacing={1}
            aria-label="Період статистики"
            onValueChange={(values) => {
              const next = PERIODS.find((entry) => entry.value === values[0]);
              if (next) setPeriod(next.value);
            }}
          >
            {PERIODS.map((entry) => (
              <ToggleGroupItem key={entry.value} value={entry.value}>
                {entry.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <p className="text-muted-foreground flex min-h-5 items-center gap-2 text-xs" role="status">
          {isFetching && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
          {isPlaceholderData
            ? "Оновлюємо період. Нижче — попередні дані."
            : isPending
              ? "Збираємо твою статистику…"
              : timeline?.range}
        </p>
      </div>

      {isPending ? (
        <>
          <LoadingNotice onRetry={() => void refetch()} />
          <LoadingBlocks layout="stats" />
        </>
      ) : !data ? (
        <Empty className="px-0 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Activity />
            </EmptyMedia>
            <EmptyTitle>Статистика не завантажилася</EmptyTitle>
            <EmptyDescription>Спробуй ще раз, щоб побачити свої тренування.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => void refetch()}>
              Спробувати ще
            </Button>
          </EmptyContent>
        </Empty>
      ) : data.stats.totalWorkouts === 0 ? (
        <Empty className="px-0 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Dumbbell />
            </EmptyMedia>
            <EmptyTitle>У цьому періоді ще немає тренувань</EmptyTitle>
            <EmptyDescription>
              {data.period === "all"
                ? "Заверши перше тренування — тут з’являться твій ритм, навантаження та прогрес."
                : "Спробуй ширший період або запиши нове тренування."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {data.period !== "all" && (
              <Button variant="outline" onClick={() => setPeriod("all")}>
                Подивитися за весь час
              </Button>
            )}
            <Link to="/workout/new" className={buttonVariants()}>
              Почати тренування
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-6" aria-busy={isFetching}>
          {isError && <RefreshNotice onRetry={() => void refetch()} />}
          <section
            className="divide-border grid grid-cols-3 divide-x"
            aria-label="Підсумок періоду"
          >
            <SummaryMetric
              icon={CalendarDays}
              label="Тренування"
              value={formatNumber(data.stats.totalWorkouts)}
              helper="завершено"
            />
            <SummaryMetric
              icon={Dumbbell}
              label="Об’єм"
              value={formatVolume(totalVolume)}
              helper="за період"
            />
            <SummaryMetric
              icon={Clock3}
              label="Тривалість"
              value={
                data.stats.avgDuration === null
                  ? "—"
                  : data.stats.avgDuration === 0
                    ? "<1 хв"
                    : `${data.stats.avgDuration} хв`
              }
              helper="у середньому"
            />
          </section>
          {timeline && <ActivityChart timeline={timeline} />}
          <ExerciseProgressChart
            data={data.exercises}
            onShowAll={data.period === "all" ? undefined : () => setPeriod("all")}
          />
          {(data.muscleTonnage.length > 0 || data.topExercises.length > 0) && (
            <LoadDistribution muscles={data.muscleTonnage} exercises={data.topExercises} />
          )}
        </div>
      )}
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 px-3 first:pl-0 last:pr-0">
      <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="text-xl font-medium tracking-tight tabular-nums sm:text-2xl">{value}</p>
      <p className="text-muted-foreground text-xs">{helper}</p>
    </div>
  );
}
