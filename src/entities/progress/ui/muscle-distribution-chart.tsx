import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { MuscleGroupTonnage } from "@/entities/progress";
import { Card, CardContent } from "@/shared/ui";

interface Props {
  data: MuscleGroupTonnage[];
}

export function MuscleDistributionChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">Недостатньо даних</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-4 text-sm font-medium">Тонаж по м&apos;язових групах</h3>
        <ResponsiveContainer width="100%" height={data.length * 44 + 20}>
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}т` : `${v}`)}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: 12,
                color: "var(--card-foreground)",
              }}
              cursor={{ fill: "var(--accent)", opacity: 0.3 }}
              formatter={(value) => [`${Number(value).toLocaleString("uk-UA")} кг`, "Тонаж"]}
            />
            <Bar dataKey="volume" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
