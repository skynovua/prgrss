import { ArrowDownRight, ArrowUpRight, Dumbbell, Minus } from "lucide-react";
import { useId, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/shared/lib";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldGroup,
  FieldLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/ui";

import type { ExerciseProgressData } from "../api/stats";
import {
  EXERCISE_METRICS,
  type ExerciseMetric,
  summarizeExercise,
} from "../model/exercise-metrics";

const LABELS: Record<ExerciseMetric, string> = {
  bestWeight: "Робоча вага",
  estimated1RM: "Розрахунковий 1ПМ",
  totalVolume: "Об’єм за день",
};
const number = (value: number) => value.toLocaleString("uk-UA", { maximumFractionDigits: 1 });

export function ExerciseProgressChart({
  data,
  onShowAll,
  showExercisePicker = true,
}: {
  data: ExerciseProgressData[];
  onShowAll?: () => void;
  showExercisePicker?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metric, setMetric] = useState<ExerciseMetric>("bestWeight");
  const selectId = useId();
  const exercise = data.find((entry) => entry.exerciseId === selectedId) ?? data[0];

  if (!exercise) {
    return (
      <Card className="p-0">
        <Empty className="px-5 py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Dumbbell />
            </EmptyMedia>
            <EmptyTitle>Побачимо, як змінюється сила</EmptyTitle>
            <EmptyDescription>
              Для графіка потрібні записи однієї вправи щонайменше за два різні тренувальні дні.
            </EmptyDescription>
          </EmptyHeader>
          {onShowAll && (
            <EmptyContent>
              <Button variant="outline" onClick={onShowAll}>
                Подивитися за весь час
              </Button>
            </EmptyContent>
          )}
        </Empty>
      </Card>
    );
  }

  const summary = summarizeExercise(exercise, metric);
  const chartData = summary.points.map((point) => ({
    ...point,
    timestamp: new Date(`${point.date}T12:00:00`).getTime(),
  }));
  const DeltaIcon =
    summary.delta === null || summary.delta === 0
      ? Minus
      : summary.delta > 0
        ? ArrowUpRight
        : ArrowDownRight;

  return (
    <Card className="gap-4 py-5">
      <CardHeader className="gap-1 px-5">
        <CardTitle>{showExercisePicker ? "Сила у вправах" : "Динаміка"}</CardTitle>
        <CardDescription>
          {showExercisePicker
            ? "Порівнюй свої записи, помічай зміни"
            : "Вага, об’єм і розрахунковий 1ПМ"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4 px-5">
        {showExercisePicker && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={selectId}>Вправа</FieldLabel>
              <Select
                items={data.map((entry) => ({
                  value: entry.exerciseId,
                  label: entry.exerciseName,
                }))}
                value={exercise.exerciseId}
                onValueChange={(value) => {
                  if (value) setSelectedId(value);
                }}
              >
                <SelectTrigger id={selectId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {data.map((entry) => (
                      <SelectItem key={entry.exerciseId} value={entry.exerciseId}>
                        {entry.exerciseName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        )}
        <ToggleGroup
          value={[metric]}
          spacing={1}
          aria-label="Показник вправи"
          onValueChange={(values) => {
            const next = EXERCISE_METRICS.find((entry) => entry.value === values[0]);
            if (next) setMetric(next.value);
          }}
        >
          {EXERCISE_METRICS.map((entry) => (
            <ToggleGroupItem key={entry.value} value={entry.value}>
              {entry.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-muted-foreground text-xs">{LABELS[metric]} · останній запис</p>
            <p className="flex items-baseline gap-1.5 whitespace-nowrap tabular-nums">
              <span className="text-3xl font-medium tracking-tight">{number(summary.latest)}</span>
              <span className="text-muted-foreground text-base">кг</span>
            </p>
          </div>
          {summary.delta !== null && (
            <div className="flex min-w-0 flex-col items-start gap-1 sm:items-end">
              <p
                className={cn(
                  "flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm tabular-nums sm:justify-end",
                  summary.delta > 0 ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <DeltaIcon className="size-4 shrink-0" />
                  <span>{`${summary.delta > 0 ? "+" : ""}${number(summary.delta)}\u00a0кг`}</span>
                </span>
                {summary.percent !== null && summary.delta !== 0 && (
                  <span className="whitespace-nowrap">
                    {`(${summary.percent > 0 ? "+" : ""}${number(summary.percent)}%)`}
                  </span>
                )}
              </p>
              <p className="text-muted-foreground text-xs sm:text-right">
                від першого запису за період
              </p>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={190} minWidth={0}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, bottom: 0, left: -15 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              minTickGap={24}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })
              }
            />
            <YAxis
              width={55}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(value: number) =>
                value >= 1000 ? `${number(value / 1000)} т` : number(value)
              }
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
              labelFormatter={(value) =>
                new Date(Number(value)).toLocaleDateString("uk-UA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              }
              formatter={(value) => [`${number(Number(value))} кг`, LABELS[metric]]}
            />
            <Line
              type="linear"
              dataKey={metric}
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 px-5">
        <p className="text-muted-foreground text-xs">
          Максимум за період: {number(summary.best)} кг · днів із записами: {summary.points.length}
        </p>
        <p className="text-muted-foreground text-xs leading-5">
          {metric === "estimated1RM"
            ? "1ПМ — оцінка за записаними підходами, а не результат максимальної спроби."
            : metric === "totalVolume"
              ? "Об’єм підсумовано за день. Для гантелей враховано пару."
              : "Найбільша записана вага підходу за кожен тренувальний день."}
        </p>
      </CardFooter>
    </Card>
  );
}
