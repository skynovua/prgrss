import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { beforeEach, test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/shared/api") {
      return {
        url: "data:text/javascript,export const createClient = () => globalThis.__workoutClient; export const withQueryTimeout = fn => fn();",
        shortCircuit: true,
      };
    }
    if (specifier === "@/entities/workout") {
      return nextResolve(new URL("../api/workout-rpc.ts", context.parentURL).href, context);
    }
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      return nextResolve(new URL(`${specifier}.ts`, context.parentURL).href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { finishWorkout } = await import("./persistence.ts");
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
globalThis.window = new EventTarget();
const exercises = [
  {
    exercise: { id: "bench", name: "Жим" },
    trackingType: "weight-reps",
    sets: [
      { id: "set", setNumber: 1, weight: 40, reps: 8, durationS: null, rpe: null, completed: true },
    ],
  },
];

function client({
  program = { id: "program" },
  programError = null,
  responses = [{ error: null }],
} = {}) {
  const calls = [];
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({ data: program, error: programError }),
  };
  globalThis.__workoutClient = {
    auth: { getSession: async () => ({ data: { session: { user: { id: "owner" } } } }) },
    from: () => query,
    rpc: (name, args) => {
      calls.push({ name, payload: args.payload });
      return { single: async () => responses[calls.length - 1] };
    },
  };
  return calls;
}

beforeEach(() => storage.clear());

test("зберігає тренування з посиланням на доступний власний шаблон", async () => {
  const calls = client();
  const result = await finishWorkout(
    "owner",
    exercises,
    "2026-01-01T10:00:00Z",
    "workout",
    {},
    "program"
  );
  assert.equal(result.programLinked, true);
  assert.equal(calls[0].payload.program_id, "program");
});

test("недоступний шаблон не блокує збереження тренування", async () => {
  const calls = client({ program: null });
  const result = await finishWorkout(
    "owner",
    exercises,
    "2026-01-01T10:00:00Z",
    "workout",
    {},
    "deleted"
  );
  assert.equal(result.programLinked, false);
  assert.equal(calls[0].payload.program_id, null);
});

test("при видаленні шаблону під час збереження повторює транзакцію без посилання", async () => {
  const calls = client({
    responses: [{ error: { code: "23503", message: "workouts_program_id_fkey" } }, { error: null }],
  });
  const result = await finishWorkout(
    "owner",
    exercises,
    "2026-01-01T10:00:00Z",
    "workout",
    {},
    "program"
  );
  assert.equal(result.programLinked, false);
  assert.deepEqual(
    calls.map((call) => call.payload.program_id),
    ["program", null]
  );
});

test("інша помилка збереження не очищає чернетку й не виконує повторний запис", async () => {
  storage.set("prgrss.activeWorkout:owner", "draft");
  const calls = client({
    responses: [{ error: { code: "23503", message: "sets_exercise_id_fkey" } }],
  });
  await assert.rejects(
    finishWorkout("owner", exercises, "2026-01-01T10:00:00Z", "workout", {}, "program")
  );
  assert.equal(calls.length, 1);
  assert.equal(storage.get("prgrss.activeWorkout:owner"), "draft");
});
