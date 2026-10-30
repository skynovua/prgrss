import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui";

import { type buildActivityTimeline, formatCount } from "../model/statistics";

type Timeline = ReturnType<typeof buildActivityTimeline>;
const UNIT_LABELS = {
  day: "Тренувань за день",
  week: "Тренувань за тиждень",
  month: "Тренувань за місяць",
  year: "Тренувань за рік",
};

export function ActivityChart({ timeline }: { timeline: Timeline }) {
  return (
    <Card className="gap-4 py-5">
      <CardHeader className="gap-2 px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Твій ритм</CardTitle>
            <CardDescription>{UNIT_LABELS[timeline.unit]}</CardDescription>
          </div>
          <p className="text-primary text-sm font-medium">
            {formatCount(timeline.activeDays, ["активний день", "активні дні", "активних днів"])}
          </p>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 px-3">
        <ResponsiveContainer width="100%" height={170} minWidth={0}>
          <BarChart
            data={timeline.points}
            margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="key"
              axisLine={false}
              tickLine={false}
              minTickGap={24}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickMargin={10}
              tickFormatter={(key) =>
                timeline.points.find((point) => point.key === key)?.label ?? key
              }
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={35}
              tickCount={3}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              itemStyle={{ color: "var(--popover-foreground)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
              labelFormatter={(key) =>
                timeline.points.find((point) => point.key === key)?.range ?? key
              }
              formatter={(value) => [
                formatCount(Number(value), ["тренування", "тренування", "тренувань"]),
                "Завершено",
              ]}
              cursor={{ fill: "var(--muted)" }}
            />
            <Bar
              dataKey="count"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="px-5">
        <p className="text-muted-foreground text-xs">Враховано лише завершені тренування.</p>
      </CardFooter>
    </Card>
  );
}
