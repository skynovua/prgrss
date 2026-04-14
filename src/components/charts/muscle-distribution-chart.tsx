import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent } from "@/src/components/ui/card";
import type { MuscleGroupDistribution } from "@/src/lib/api/stats";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

interface Props {
  data: MuscleGroupDistribution[];
}

export function MuscleDistributionChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">Недостатньо даних для розподілу</p>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((acc, d) => acc + d.sets, 0);

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-4 text-sm font-medium">М&apos;язові групи (30 днів)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="sets"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              label={({ name, value }: { name?: string; value?: number }) =>
                `${name ?? ""} ${Math.round(((value ?? 0) / total) * 100)}%`
              }
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              formatter={(value) => [`${value} підходів`, undefined]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
