// Тренування до появи поля порядку залишаються в початковій послідовності.
export function orderWorkoutSets<T extends { exercise_id: string }>(
  sets: T[],
  order: unknown
): T[] {
  if (!Array.isArray(order)) return sets;
  const positions = new Map<string, number>();
  for (const [index, id] of order.entries()) {
    if (typeof id === "string" && !positions.has(id)) positions.set(id, index);
  }
  return [...sets].sort(
    (left, right) =>
      (positions.get(left.exercise_id) ?? Number.MAX_SAFE_INTEGER) -
      (positions.get(right.exercise_id) ?? Number.MAX_SAFE_INTEGER)
  );
}
