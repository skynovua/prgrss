import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent } from "@/shared/ui";

interface WorkoutFrequencyPoint {
  week: string;
  count: number;
}

interface Props {
  data: WorkoutFrequencyPoint[];
}

export function WorkoutFrequencyChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">Недостатньо даних для частоти тренувань</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-4 text-sm font-medium">Тренувань на тиждень</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              allowDecimals={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: 12,
                color: "var(--card-foreground)",
              }}
              formatter={(value) => [`${value} тренувань`, undefined]}
              labelFormatter={(label) => `Тиждень від ${label}`}
            />
            <Bar dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
