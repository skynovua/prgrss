import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/shared/api") {
      return {
        url: "data:text/javascript,export const supabase = { from: (...args) => globalThis.__programFrom(...args) }",
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
const { saveProgram, deleteProgram } = await import("./programs.ts");
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

test("не повідомляє про збереження або видалення недоступної програми", async () => {
  const query = {
    update: () => query,
    delete: () => query,
    eq: () => query,
    select: () => query,
    maybeSingle: async () => ({ data: null, error: null }),
  };
  globalThis.__programFrom = () => query;
  await assert.rejects(saveProgram("owner", "Сила", exercises, "unknown"), /недоступна/);
  await assert.rejects(deleteProgram("owner", "unknown"), /недоступна/);
});
