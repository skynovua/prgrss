import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  backfillExerciseAnatomy,
  planExerciseAnatomyBackfill,
  resolveExerciseAnatomy,
} from "./exercise-anatomy-backfill.mjs";
import { anatomicalMuscles, systemExercises } from "./exercise-catalog-config.mjs";

const exercise = (overrides = {}) => ({
  id: "legacy-curl",
  name: "Згинання рук зі штангою",
  equipment: "barbell",
  catalog_key: null,
  is_custom: false,
  user_id: null,
  exercise_muscles: [],
  ...overrides,
});

test("dry-run не пише, а запис спочатку додає відсутній довідниковий м’яз", async (t) => {
  t.mock.method(console, "log", () => {});
  const writes = [];
  const client = {
    from(table) {
      return {
        select() {
          return table === "exercises"
            ? {
                eq() {
                  return this;
                },
                is() {
                  return this;
                },
                order: async () => ({
                  data: [exercise({ name: "Hack-присідання", equipment: "machine" })],
                }),
              }
            : Promise.resolve({
                data: anatomicalMuscles.filter((m) => m.key !== "rectus_femoris"),
              });
        },
        async upsert(records, options) {
          writes.push({ table, records, options });
          return { error: null };
        },
      };
    },
  };
  await backfillExerciseAnatomy(client);
  assert.equal(writes.length, 0);
  await backfillExerciseAnatomy(client, { apply: true });
  assert.deepEqual(
    writes.map((write) => write.table),
    ["anatomical_muscles", "exercise_muscles"]
  );
  assert.equal(writes[0].records[0].key, "rectus_femoris");
  assert.equal(writes[1].records.length, 3);
  assert.ok(writes.every((write) => write.options.ignoreDuplicates));
});

test("старі записи отримують анатомію навіть коли канонічна вправа вже існує", () => {
  const legacy = exercise();
  const canonical = exercise({
    id: "canonical-curl",
    catalog_key: "barbell-curl",
    exercise_muscles: [{ muscle_key: "biceps_brachii" }],
  });
  const plan = planExerciseAnatomyBackfill([legacy, canonical]);
  assert.equal(plan.resolved.length, 1);
  assert.equal(plan.resolved[0].exercise.id, legacy.id);
  assert.ok(
    plan.resolved[0].muscles.some(
      (m) => m.muscle_key === "biceps_brachii" && m.activation_score >= 8
    )
  );
  assert.equal(legacy.catalog_key, null);
});

test("не змінює вже задану користувачем анатомію та повторно не додає прив’язки", () => {
  const annotated = exercise({
    is_custom: true,
    exercise_muscles: [{ muscle_key: "forearm_muscles" }],
  });
  const plan = planExerciseAnatomyBackfill([annotated]);
  assert.deepEqual(plan, { resolved: [], unresolved: [] });
});

test("власні вправи завжди пропускаються, навіть із системною назвою або ключем", () => {
  const custom = exercise({ is_custom: true, catalog_key: "barbell-curl" });
  const owned = exercise({ user_id: "owner" });
  assert.equal(resolveExerciseAnatomy(custom), null);
  assert.equal(resolveExerciseAnatomy(owned), null);
  assert.deepEqual(planExerciseAnatomyBackfill([custom, owned]), { resolved: [], unresolved: [] });
});

test("регістр і зайві пробіли не створюють пропусків, обладнання перевіряється", () => {
  assert.deepEqual(
    resolveExerciseAnatomy(exercise({ name: "  ЗГИНАННЯ   рук зі штангою " })),
    resolveExerciseAnatomy(exercise())
  );
  assert.equal(resolveExerciseAnatomy(exercise({ equipment: "machine" })), null);
});

test("не вгадує анатомію неоднозначних чи невідомих назв", () => {
  for (const name of ["Сміт у нахилі", "Абдутор", "Моя вправа", "Жим"]) {
    assert.equal(resolveExerciseAnatomy(exercise({ name, equipment: "machine" })), null);
  }
});

test("усі старі системні вправи мають відповідність", () => {
  const seed = readFileSync(
    new URL("../../supabase/migrations/00002_seed_exercises.sql", import.meta.url),
    "utf8"
  );
  const legacy = [...seed.matchAll(/\('([^']+)', '[^']+', '([^']+)'\)/g)];
  assert.equal(legacy.length, 50);
  for (const [, name, equipment] of legacy) {
    assert.ok(resolveExerciseAnatomy(exercise({ name, equipment })), name);
  }
});

test("профілі використовують наявні м’язи схеми, цілі оцінки 1–10 та мають основний м’яз", () => {
  const svg = ["front", "back"]
    .map((view) =>
      readFileSync(
        new URL(`../entities/exercise/ui/anatomy-assets/${view}-organized.svg`, import.meta.url),
        "utf8"
      )
    )
    .join("");
  const svgKeys = new Set([...svg.matchAll(/data-muscle-key="([^"]+)"/g)].map((m) => m[1]));
  const knownKeys = new Set(anatomicalMuscles.map((m) => m.key));
  const profiles = systemExercises.map((e) => e.muscles);
  for (const muscles of profiles) {
    assert.ok(muscles.some((m) => m.activation_score >= 8));
    assert.equal(new Set(muscles.map((m) => m.muscle_key)).size, muscles.length);
    for (const target of muscles) {
      assert.ok(knownKeys.has(target.muscle_key) && svgKeys.has(target.muscle_key));
      assert.ok(
        Number.isInteger(target.activation_score) &&
          target.activation_score >= 1 &&
          target.activation_score <= 10
      );
    }
  }
});

test("мапа містить усі м’язи каталогу та доступний вибір для кожного ключа", () => {
  const mapKeys = new Set();
  for (const view of ["front", "back"]) {
    const svg = readFileSync(
      new URL(`../entities/exercise/ui/anatomy-assets/${view}-organized.svg`, import.meta.url),
      "utf8"
    );
    const paths = [...svg.matchAll(/<path\b[^>]*data-muscle-key="([^"]+)"[^>]*>/g)];
    const keys = new Set(paths.map((match) => match[1]));
    for (const key of keys) {
      mapKeys.add(key);
      const interactive = paths.filter(
        (match) => match[1] === key && /tabindex="0"/.test(match[0])
      );
      assert.equal(interactive.length, 1, `${view}: ${key}`);
      assert.match(interactive[0][0], /role="button"/);
      assert.match(interactive[0][0], /aria-label="[^"]+"/);
    }
  }
  assert.deepEqual(mapKeys, new Set(anatomicalMuscles.map((muscle) => muscle.key)));
});
