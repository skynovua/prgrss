import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/src/components/ui/card";
import type { MuscleGroupTonnage } from "@/src/lib/api/stats";

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
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              formatter={(value) => [`${Number(value).toLocaleString("uk-UA")} кг`, "Тонаж"]}
            />
            <Bar dataKey="volume" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
