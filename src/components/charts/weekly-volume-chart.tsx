import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/src/components/ui/card";

interface WeeklyVolumePoint {
  week: string;
  volume: number;
  workouts: number;
}

interface Props {
  data: WeeklyVolumePoint[];
}

export function WeeklyVolumeChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">Недостатньо даних для графіку об&apos;єму</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-4 text-sm font-medium">Тижневий об&apos;єм (кг)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}т` : `${v}`)}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: 12,
                color: "var(--card-foreground)",
              }}
              formatter={(value) => [`${Number(value).toLocaleString("uk-UA")} кг`, "Об'єм"]}
              labelFormatter={(label) => `Тиждень від ${label}`}
            />
            <Bar dataKey="volume" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
