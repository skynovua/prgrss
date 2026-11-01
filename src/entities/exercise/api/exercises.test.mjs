import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/shared/api") {
      return {
        url: "data:text/javascript,export const supabase = { rpc: (...args) => globalThis.__exerciseTestRpc(...args), from: (...args) => globalThis.__exerciseTestFrom(...args), auth: { getUser: () => globalThis.__exerciseTestGetUser() } }",
        shortCircuit: true,
      };
    }
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      return nextResolve(new URL(`${specifier}.ts`, context.parentURL).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { archiveExercise, createExercise } = await import("./exercises.ts");

const exercise = {
  name: "  Власна вправа  ",
  equipment: "dumbbell",
  muscles: [
    { muscleKey: "biceps_brachii", activationScore: 10 },
    { muscleKey: "brachialis", activationScore: 5 },
  ],
};

test("створює вправу та м’язи одним викликом транзакційної функції", async () => {
  const calls = [];
  globalThis.__exerciseTestRpc = async (...args) => {
    calls.push(args);
    return { data: "exercise-id", error: null };
  };

  await createExercise(exercise);
  assert.deepEqual(calls, [
    [
      "create_custom_exercise",
      {
        payload: {
          name: "Власна вправа",
          equipment: "dumbbell",
          muscles: [
            { muscle_key: "biceps_brachii", activation_score: 10 },
            { muscle_key: "brachialis", activation_score: 5 },
          ],
        },
      },
    ],
  ]);
});

test("повертає помилку RPC без повторних запитів", async () => {
  let calls = 0;
  globalThis.__exerciseTestRpc = async () => {
    calls += 1;
    return { data: null, error: { message: "Один або кілька м'язів недоступні" } };
  };

  await assert.rejects(createExercise(exercise), { message: "Один або кілька м'язів недоступні" });
  assert.equal(calls, 1);
});

test("не надсилає запит, коли назва або м’язи невалідні", async () => {
  globalThis.__exerciseTestRpc = () => assert.fail("Некоректні дані не повинні надсилатися");
  const invalid = [
    { ...exercise, name: "   " },
    { ...exercise, muscles: [] },
    { ...exercise, muscles: [exercise.muscles[0], exercise.muscles[0]] },
    { ...exercise, muscles: [{ muscleKey: "biceps_brachii", activationScore: 11 }] },
    { ...exercise, muscles: [{ muscleKey: "biceps_brachii", activationScore: 7 }] },
  ];

  for (const input of invalid) await assert.rejects(createExercise(input));
});

test("видаляє з каталогу лише активну власну вправу", async () => {
  const calls = [];
  const query = {
    update: (value) => (calls.push(["update", value]), query),
    eq: (column, value) => (calls.push([column, value]), query),
    select: (value) => (calls.push(["select", value]), query),
    maybeSingle: async () => ({ data: { id: "exercise-id" }, error: null }),
  };
  globalThis.__exerciseTestGetUser = async () => ({ data: { user: { id: "owner" } }, error: null });
  globalThis.__exerciseTestFrom = (table) => (calls.push(["from", table]), query);

  await archiveExercise("exercise-id");
  assert.deepEqual(calls, [
    ["from", "exercises"],
    ["update", { is_active: false }],
    ["id", "exercise-id"],
    ["user_id", "owner"],
    ["is_custom", true],
    ["is_active", true],
    ["select", "id"],
  ]);
});

test("не повідомляє про успішне видалення, якщо вправа недоступна", async () => {
  const query = {
    update: () => query,
    eq: () => query,
    select: () => query,
    maybeSingle: async () => ({ data: null, error: null }),
  };
  globalThis.__exerciseTestGetUser = async () => ({ data: { user: { id: "owner" } }, error: null });
  globalThis.__exerciseTestFrom = () => query;
  await assert.rejects(archiveExercise("other-exercise"), /неможливо видалити/);
});

test("завантажує деталі видаленої вправи за ідентифікатором для історії", async () => {
  const filters = [];
  const query = {
    select: () => query,
    eq: (column, value) => (filters.push([column, value]), query),
    order: () => query,
    then: (resolve) =>
      resolve({
        data: [
          {
            id: "archived-exercise",
            name: "Видалена вправа",
            is_active: false,
            exercise_muscles: [
              {
                activation_score: 10,
                anatomical_muscles: {
                  key: "biceps_brachii",
                  name: "Біцепси",
                  muscle_group: "arms",
                  sort_order: 1,
                },
              },
            ],
          },
        ],
        error: null,
      }),
  };
  globalThis.__exerciseTestFrom = () => query;
  const { fetchExercises } = await import("./exercises.ts");
  const [details] = await fetchExercises("archived-exercise");
  assert.deepEqual(filters, [["id", "archived-exercise"]]);
  assert.equal(details.muscles[0].muscleKey, "biceps_brachii");
});
