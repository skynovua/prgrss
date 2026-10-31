import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/shared/api") {
      return {
        url: "data:text/javascript,export const supabase = { rpc: (...args) => globalThis.__progressTestRpc(...args) }",
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});

const { fetchExerciseProgress, fetchExerciseProgressById } = await import("./stats.ts");

const point = (date) => ({ date, best_weight: 40, total_volume: 400, estimated_1rm: 53.3 });
const entry = (id, dates) => ({
  exercise_id: id,
  exercise_name: id,
  data: dates.map(point),
});

test("статистика вправи доступна після першого дня і поза першою десяткою", async () => {
  const entries = Array.from({ length: 11 }, (_, index) =>
    entry(`exercise-${index}`, ["2026-10-01", "2026-10-02"])
  );
  entries.push(entry("first-workout", ["2026-10-31"]));
  globalThis.__progressTestRpc = async () => ({ data: entries, error: null });

  const firstWorkout = await fetchExerciseProgressById("first-workout", null);
  assert.equal(firstWorkout?.data.length, 1);
  assert.equal(firstWorkout?.data[0].bestWeight, 40);
  assert.equal((await fetchExerciseProgressById("exercise-10", null))?.exerciseId, "exercise-10");

  const overview = await fetchExerciseProgress(null);
  assert.equal(overview.length, 10);
  assert.equal(
    overview.some((exercise) => exercise.exerciseId === "first-workout"),
    false
  );
});

test("помилка завантаження статистики не перетворюється на порожній стан", async () => {
  const error = new Error("Database unavailable");
  globalThis.__progressTestRpc = async () => ({ data: null, error });

  await assert.rejects(fetchExerciseProgressById("exercise-1", null), error);
});
