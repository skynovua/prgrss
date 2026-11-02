import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/shared/api") {
      return {
        url: "data:text/javascript,export const supabase = { from: (...args) => globalThis.__programFrom(...args), rpc: (...args) => globalThis.__programRpc(...args) }",
        shortCircuit: true,
      };
    }
    if (specifier === "@/entities/workout") {
      return nextResolve(
        new URL("../../../entities/workout/model/workout-logging.ts", context.parentURL).href,
        context
      );
    }
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      return nextResolve(new URL(`${specifier}.ts`, context.parentURL).href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { saveProgram, deleteProgram, updateProgramTemplate } = await import("./programs.ts");
const exercises = [
  { exercise: { id: "exercise", name: "Жим" }, sets: [{ reps: 8 }], trackingType: "weight-reps" },
];

test("зберігає шаблон разом із користувачем та назвою одним запитом", async () => {
  let inserted;
  const query = {
    insert: (value) => ((inserted = value), query),
    select: () => query,
    single: async () => ({ data: { id: "program" }, error: null }),
  };
  globalThis.__programFrom = (table) => {
    assert.equal(table, "programs");
    return query;
  };
  await saveProgram("owner", "  Сила  ", exercises);
  assert.deepEqual(inserted, {
    name: "Сила",
    is_template: true,
    workout_template: exercises,
    user_id: "owner",
  });
});

test("не повідомляє про збереження або видалення недоступного шаблону", async () => {
  const query = {
    update: () => query,
    delete: () => query,
    eq: () => query,
    select: () => query,
    maybeSingle: async () => ({ data: null, error: null }),
  };
  globalThis.__programFrom = () => query;
  await assert.rejects(saveProgram("owner", "Сила", exercises, "unknown"), /недоступний/);
  await assert.rejects(deleteProgram("owner", "unknown"), /недоступний/);
});

test("оновлює шаблон через транзакційну перевірку початкового стану", async () => {
  const original = [
    {
      exercise: { id: "exercise", name: "Жим" },
      trackingType: "weight-reps",
      sets: [{ weight: 30, reps: 8 }],
    },
  ];
  let call;
  globalThis.__programRpc = async (...args) => {
    call = args;
    return { data: true, error: null };
  };
  await updateProgramTemplate("program", original, exercises);
  assert.equal(call[0], "update_program_template_if_unchanged");
  assert.equal(call[1].target_program_id, "program");
  assert.deepEqual(call[1].original_template, original);
  assert.equal(call[1].updated_template[0].sets[0].completed, false);
  assert.equal(call[1].updated_template[0].sets[0].rpe, null);
});

test("повідомляє про конфлікт замість перезапису зміненого шаблону", async () => {
  globalThis.__programRpc = async () => ({ data: false, error: null });
  await assert.rejects(updateProgramTemplate("program", [], exercises), /змінено або видалено/);
});

test("не перезаписує шаблон некоректним незавершеним підходом", async () => {
  globalThis.__programRpc = () => assert.fail("Запит не має виконуватися");
  const invalid = [{ ...exercises[0], sets: [{ reps: null, inputValues: { reps: "abc" } }] }];
  await assert.rejects(updateProgramTemplate("program", [], invalid), /некоректні значення/);
});
