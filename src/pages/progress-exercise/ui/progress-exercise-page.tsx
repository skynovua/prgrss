import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  Dumbbell,
  Loader2,
  Minus,
  Scale,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import { useExercises } from "@/entities/exercise";
import { ExerciseProgressChart, type Period, useExerciseProgress } from "@/entities/progress";
import { cn } from "@/shared/lib";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  LoadingBlocks,
  LoadingNotice,
  PageError,
  RefreshNotice,
  Skeleton,
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/ui";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 днів" },
  { value: "30d", label: "30 днів" },
  { value: "90d", label: "90 днів" },
  { value: "all", label: "Весь час" },
];
const number = (value: number) => value.toLocaleString("uk-UA", { maximumFractionDigits: 1 });
const volume = (value: number) =>
  value >= 1000 ? `${number(value / 1000)} т` : `${number(value)} кг`;

export default function ExerciseProgressPage() {
  const navigate = useNavigate();
  const { exerciseId } = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const [period, setPeriod] = useState<Period>("30d");
  const {
    data: exerciseProgress,
    isPending,
    isFetching,
    isError,
    isPlaceholderData,
    refetch,
  } = useExerciseProgress(exerciseId ?? "", period);
  const { data: exercises } = useExercises({ enabled: Boolean(exerciseId) });

  if (!exerciseId)
    return <PageError title="Вправу не знайдено" description="Перевір посилання на вправу." />;

  const exerciseName =
    exerciseProgress?.exerciseName ??
    exercises?.find((exercise) => exercise.id === exerciseId)?.name;
  const points = [...(exerciseProgress?.data ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const bestWeight = points.reduce((max, point) => Math.max(max, point.bestWeight), 0);
  const bestEstimated1RM = points.reduce((max, point) => Math.max(max, point.estimated1RM), 0);
  const totalVolume = points.reduce((sum, point) => sum + point.totalVolume, 0);
  const latestPoint = points.at(-1);
  const previousPoint = points.at(-2);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 px-5 pt-7 pb-6 md:px-8">
      <header className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 shrink-0"
          aria-label="Повернутися назад"
          onClick={() => void navigate({ to: search.from || "/progress" })}
        >
          <ChevronLeft />
        </Button>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-muted-foreground text-sm">Статистика вправи</p>
          <h1
            className="text-3xl leading-tight font-medium tracking-tight wrap-break-word"
            aria-label={!exerciseName && isPending ? "Статистика вправи" : undefined}
          >
            {exerciseName ?? (isPending ? <Skeleton className="h-9 w-full max-w-80" /> : "Вправа")}
          </h1>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <div className="scrollbar-none overflow-x-auto">
          <ToggleGroup
            value={[period]}
            spacing={1}
            aria-label="Період статистики вправи"
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
        <p role="status" className="text-muted-foreground flex min-h-5 items-center gap-2 text-xs">
          {isFetching && (
            <Loader2
              className="size-3 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {isPlaceholderData
            ? "Оновлюємо період. Нижче — попередні дані."
            : exerciseProgress
              ? "Показники за обраний період"
              : null}
        </p>
      </div>

      {isPending ? (
        <>
          <LoadingNotice onRetry={() => void refetch()} />
          <LoadingBlocks layout="stats" />
        </>
      ) : isError && !exerciseProgress ? (
        <PageError title="Статистика не завантажилася" onRetry={() => void refetch()} />
      ) : !exerciseProgress || points.length === 0 ? (
        <Empty className="px-0 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Dumbbell />
            </EmptyMedia>
            <EmptyTitle>Поки замало записів</EmptyTitle>
            <EmptyDescription>
              Статистика з’явиться після записів ваги й повторень цієї вправи щонайменше за два
              різні тренувальні дні.
            </EmptyDescription>
          </EmptyHeader>
          {period !== "all" && (
            <EmptyContent>
              <Button variant="outline" onClick={() => setPeriod("all")}>
                Подивитися за весь час
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="flex min-w-0 flex-col gap-6" aria-busy={isFetching}>
          {isError && <RefreshNotice onRetry={() => void refetch()} />}
          <section aria-label="Підсумок періоду">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              <SummaryMetric
                icon={TrendingUp}
                label="Розрахунковий 1ПМ"
                value={`${number(bestEstimated1RM)} кг`}
              />
              <SummaryMetric
                icon={Dumbbell}
                label="Максимальна вага"
                value={`${number(bestWeight)} кг`}
              />
              <SummaryMetric icon={Scale} label="Загальний об’єм" value={volume(totalVolume)} />
              <SummaryMetric
                icon={CalendarDays}
                label="Днів із записами"
                value={number(points.length)}
              />
            </dl>
          </section>

          <ExerciseProgressChart data={[exerciseProgress]} showExercisePicker={false} />

          {latestPoint && (
            <Card className="gap-4 py-5">
              <CardHeader className="gap-1 px-5">
                <CardTitle>Останній запис</CardTitle>
                <CardDescription>{formatFullDate(latestPoint.date)}</CardDescription>
                {previousPoint && (
                  <p className="text-muted-foreground pt-1 text-xs">
                    Порівняно з {formatFullDate(previousPoint.date)}
                  </p>
                )}
              </CardHeader>
              <CardContent className="px-5">
                <dl className="divide-border divide-y">
                  <LatestStat
                    label="Розрахунковий 1ПМ"
                    value={`${number(latestPoint.estimated1RM)} кг`}
                    diff={
                      previousPoint ? latestPoint.estimated1RM - previousPoint.estimated1RM : null
                    }
                  />
                  <LatestStat
                    label="Максимальна вага"
                    value={`${number(latestPoint.bestWeight)} кг`}
                    diff={previousPoint ? latestPoint.bestWeight - previousPoint.bestWeight : null}
                  />
                  <LatestStat
                    label="Об’єм за день"
                    value={volume(latestPoint.totalVolume)}
                    diff={
                      previousPoint ? latestPoint.totalVolume - previousPoint.totalVolume : null
                    }
                  />
                </dl>
              </CardContent>
            </Card>
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
}: {
  icon: typeof Dumbbell;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <dt className="text-muted-foreground flex min-h-10 items-start gap-1.5 text-xs leading-5 sm:min-h-5">
        <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-2xl font-medium tracking-tight tabular-nums">{value}</dd>
    </div>
  );
}

function LatestStat({ label, value, diff }: { label: string; value: string; diff: number | null }) {
  const Icon = diff === null || diff === 0 ? Minus : diff > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground pt-1 text-sm">{label}</dt>
      <dd className="text-right text-xl font-medium tabular-nums">{value}</dd>
      <dd
        className={cn(
          "col-start-2 flex items-center justify-end gap-1 text-xs tabular-nums",
          diff !== null && diff > 0 ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        <span>
          {diff === null
            ? "Без попереднього запису"
            : diff === 0
              ? "Без змін"
              : `${diff > 0 ? "+" : ""}${number(diff)} кг`}
        </span>
      </dd>
    </div>
  );
}

function formatFullDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
