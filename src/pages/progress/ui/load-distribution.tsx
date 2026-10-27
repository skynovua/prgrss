import type { MuscleGroupTonnage, TopExercise } from "@/entities/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";

import { formatNumber, formatVolume } from "../model/statistics";

export function LoadDistribution({
  muscles,
  exercises,
}: {
  muscles: MuscleGroupTonnage[];
  exercises: TopExercise[];
}) {
  const totalVolume = muscles.reduce((total, muscle) => total + muscle.volume, 0);
  const rows = (items: { id: string; label: string; volume: number; helper?: string }[]) => (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const percent = totalVolume > 0 ? (item.volume / totalVolume) * 100 : 0;
        return (
          <div key={item.id} className="flex min-w-0 flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-sm leading-5">{item.label}</span>
                {item.helper && (
                  <span className="text-muted-foreground text-xs">{item.helper}</span>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm tabular-nums">{formatVolume(item.volume)}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {formatNumber(percent)}%
                </span>
              </div>
            </div>
            <span className="bg-muted block h-1.5 overflow-hidden rounded-full" aria-hidden="true">
              <span
                className="bg-chart-1 block h-full rounded-full"
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
  return (
    <Tabs defaultValue={muscles.length ? "muscles" : "exercises"}>
      <Card className="gap-4 py-5">
        <CardHeader className="gap-3 px-5">
          <div className="flex flex-col gap-1">
            <CardTitle>Куди йде навантаження</CardTitle>
            <CardDescription>Частка загального об’єму за період</CardDescription>
          </div>
          <TabsList aria-label="Розподіл навантаження">
            <TabsTrigger value="muscles">М’язи</TabsTrigger>
            <TabsTrigger value="exercises">Вправи</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="px-5">
          <TabsContent value="muscles">
            {muscles.length ? (
              rows(
                muscles.map((item) => ({
                  id: item.muscleGroup,
                  label: item.label,
                  volume: item.volume,
                }))
              )
            ) : (
              <p className="text-muted-foreground py-4 text-sm leading-6">
                Для розподілу об’єму потрібні підходи з вагою. Вправи без ваги можна переглянути у
                вкладці «Вправи».
              </p>
            )}
          </TabsContent>
          <TabsContent value="exercises">
            {rows(
              exercises.map((item) => ({
                id: item.exerciseId,
                label: item.exerciseName,
                volume: item.volume,
                helper: `${formatNumber(item.sets)} підх.`,
              }))
            )}
            <p className="text-muted-foreground mt-4 text-xs">
              Показано до 8 вправ із найбільшим об’ємом.
            </p>
          </TabsContent>
        </CardContent>
        <CardFooter className="px-5">
          <p className="text-muted-foreground text-xs leading-5">
            Об’єм = вага × повторення. Для гантелей враховано пару. Вправи без ваги не додають
            кілограмів до об’єму.
          </p>
        </CardFooter>
      </Card>
    </Tabs>
  );
}
