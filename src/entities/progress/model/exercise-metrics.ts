import type { ExerciseProgressData, ExerciseProgressPoint } from "../api/stats";

export type ExerciseMetric = keyof Pick<
  ExerciseProgressPoint,
  "bestWeight" | "estimated1RM" | "totalVolume"
>;
export const EXERCISE_METRICS: { value: ExerciseMetric; label: string }[] = [
  { value: "bestWeight", label: "Вага" },
  { value: "estimated1RM", label: "1ПМ" },
  { value: "totalVolume", label: "Об’єм" },
];

export function summarizeExercise(exercise: ExerciseProgressData, metric: ExerciseMetric) {
  const points = [...exercise.data].sort((a, b) => a.date.localeCompare(b.date));
  const first = points[0]?.[metric] ?? 0;
  const latest = points.at(-1)?.[metric] ?? 0;
  return {
    points,
    latest,
    delta: points.length >= 2 ? latest - first : null,
    percent: points.length >= 2 && first > 0 ? ((latest - first) / first) * 100 : null,
    best: points.reduce((max, point) => Math.max(max, point[metric]), 0),
  };
}
