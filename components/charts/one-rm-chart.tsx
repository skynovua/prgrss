"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { ExerciseOneRM } from "@/lib/actions/stats";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface Props {
  data: ExerciseOneRM[];
}

export function OneRMChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">Недостатньо даних для графіку 1RM</p>
        </CardContent>
      </Card>
    );
  }

  // Об'єднуємо всі дати в один масив для XAxis
  const allDates = new Set<string>();
  for (const exercise of data) {
    for (const point of exercise.data) {
      allDates.add(point.date);
    }
  }
  const sortedDates = [...allDates].sort();

  // Формуємо unified dataset
  const chartData = sortedDates.map((date) => {
    const entry: Record<string, string | number> = {
      date: formatDate(date),
    };
    for (const exercise of data) {
      const point = exercise.data.find((p) => p.date === date);
      if (point) {
        entry[exercise.exerciseName] = point.estimated1RM;
      }
    }
    return entry;
  });

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-4 text-sm font-medium">Estimated 1RM (90 днів)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              unit=" кг"
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              formatter={(value) => [`${value} кг`, undefined]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {data.map((exercise, i) => (
              <Line
                key={exercise.exerciseId}
                type="monotone"
                dataKey={exercise.exerciseName}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}
