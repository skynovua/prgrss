import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/shared/ui";
import type { ExerciseProgressData } from "@/entities/progress";

interface Props {
  data: ExerciseProgressData[];
}

type Metric = "estimated1RM" | "bestWeight" | "totalVolume";

const METRIC_LABELS: Record<Metric, string> = {
  bestWeight: "Макс вага",
  totalVolume: "Об'єм",
  estimated1RM: "Оц. 1RM",
};

export function ExerciseProgressChart({ data }: Props) {
  const [selectedExercise, setSelectedExercise] = useState(0);
  const [metric, setMetric] = useState<Metric>("bestWeight");

  if (data.length === 0) {
    return (
      <Card className="p-0">
        <CardContent className="flex h-48 items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">
            Потрібно хоча б 2 тренування з однією вправою
          </p>
        </CardContent>
      </Card>
    );
  }

  const exercise = data[selectedExercise];
  const chartData = exercise.data.map((p) => ({
    ...p,
    date: formatDate(p.date),
  }));

  return (
    <Card className="p-0">
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-medium">Прогрес вправи</h3>

        {/* Вибір вправи */}
        {data.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {data.map((ex, i) => (
              <button
                key={ex.exerciseId}
                onClick={() => setSelectedExercise(i)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  i === selectedExercise
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {ex.exerciseName}
              </button>
            ))}
          </div>
        )}

        {/* Вибір метрики */}
        <div className="mb-4 flex gap-1.5">
          {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                m === metric
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              width={50}
              tickFormatter={(v: number) =>
                metric === "totalVolume" && v >= 1000 ? `${(v / 1000).toFixed(0)}т` : `${v}`
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: 12,
                color: "var(--card-foreground)",
              }}
              formatter={(value) => [
                `${Number(value).toLocaleString("uk-UA")} кг`,
                METRIC_LABELS[metric],
              ]}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--chart-1)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}
