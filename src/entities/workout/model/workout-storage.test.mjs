import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { beforeEach, test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      return nextResolve(new URL(`${specifier}.ts`, context.parentURL).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const {
  clearActiveWorkoutDraft,
  hasLegacyWorkoutDraft,
  restoreActiveWorkoutDraft,
  restoreLegacyWorkoutDraft,
  saveActiveWorkoutDraft,
} = await import("./workout-draft.ts");
const {
  clearExerciseLogPreferences,
  getExerciseLogPreferences,
  hasLegacyExerciseLogPreferences,
  restoreLegacyExerciseLogPreferences,
  saveExerciseLogPreferences,
} = await import("./exercise-log-preferences.ts");

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
globalThis.window = new EventTarget();

beforeEach(() => storage.clear());

const draft = (userId, name) => ({
  userId,
  workoutId: `workout-${name}`,
  exercises: [
    {
      instanceId: name,
      exercise: { id: name, equipment: null },
      sets: [],
      trackingType: "weight-reps",
      restSeconds: 90,
    },
  ],
  startedAt: "2026-01-01T10:00:00.000Z",
  restClock: null,
  name,
  notes: "",
});

test("чернетки ізольовані між акаунтами й очищення одного не зачіпає інший", () => {
  saveActiveWorkoutDraft(draft("a", "A"));
  assert.equal(restoreActiveWorkoutDraft("b"), null);
  saveActiveWorkoutDraft(draft("b", "B"));
  assert.equal(restoreActiveWorkoutDraft("a").name, "A");
  assert.equal(restoreActiveWorkoutDraft("b").name, "B");
  clearActiveWorkoutDraft("b");
  assert.equal(restoreActiveWorkoutDraft("b"), null);
  assert.equal(restoreActiveWorkoutDraft("a").name, "A");
});

test("порожнє активне тренування зберігає час і відновлюється", () => {
  const empty = { ...draft("a", ""), exercises: [], name: "" };
  saveActiveWorkoutDraft(empty);
  const restored = restoreActiveWorkoutDraft("a");
  assert.equal(restored.startedAt, empty.startedAt);
  assert.equal(restored.workoutId, empty.workoutId);
  assert.deepEqual(restored.exercises, []);
});

test("скасування не видаляє іншу чернетку того самого користувача", () => {
  saveActiveWorkoutDraft(draft("a", "new"));
  assert.equal(clearActiveWorkoutDraft("a", "workout-old"), false);
  assert.equal(restoreActiveWorkoutDraft("a").name, "new");
  assert.equal(clearActiveWorkoutDraft("a", "workout-new"), true);
  assert.equal(restoreActiveWorkoutDraft("a"), null);
});

test("скасування повідомляє про недоступне сховище і залишає чернетку", () => {
  saveActiveWorkoutDraft(draft("a", "current"));
  const removeItem = localStorage.removeItem;
  localStorage.removeItem = () => {
    throw new Error("storage unavailable");
  };
  try {
    assert.equal(clearActiveWorkoutDraft("a", "workout-current"), false);
    assert.equal(restoreActiveWorkoutDraft("a").name, "current");
  } finally {
    localStorage.removeItem = removeItem;
  }
});

test("стару чернетку можна явно відновити поверх нового порожнього тренування", () => {
  storage.set("prgrss.activeWorkout", JSON.stringify(draft(undefined, "legacy")));
  saveActiveWorkoutDraft({ ...draft("a", ""), exercises: [], name: "" });
  assert.equal(hasLegacyWorkoutDraft("a"), true);
  assert.equal(restoreLegacyWorkoutDraft("a"), true);
  assert.equal(restoreActiveWorkoutDraft("a").name, "legacy");
});

test("налаштування тієї самої вправи належать окремим акаунтам", () => {
  saveExerciseLogPreferences("a", "squat", { restSeconds: 60 });
  saveExerciseLogPreferences("b", "squat", { restSeconds: 180 });
  assert.equal(getExerciseLogPreferences("a", "squat").restSeconds, 60);
  assert.equal(getExerciseLogPreferences("b", "squat").restSeconds, 180);
  clearExerciseLogPreferences("a");
  assert.equal(getExerciseLogPreferences("a", "squat").restSeconds, undefined);
  assert.equal(getExerciseLogPreferences("b", "squat").restSeconds, 180);
});

test("без ідентифікатора акаунта локальні дані не читаються і не змінюються", () => {
  saveActiveWorkoutDraft(draft("a", "A"));
  saveExerciseLogPreferences("a", "squat", { restSeconds: 60 });
  saveActiveWorkoutDraft(draft(undefined, "unknown"));
  saveExerciseLogPreferences(undefined, "squat", { restSeconds: 300 });
  clearActiveWorkoutDraft(undefined);
  clearExerciseLogPreferences(undefined);
  assert.equal(restoreActiveWorkoutDraft(undefined), null);
  assert.equal(getExerciseLogPreferences(undefined, "squat").restSeconds, undefined);
  assert.equal(restoreActiveWorkoutDraft("a").name, "A");
  assert.equal(getExerciseLogPreferences("a", "squat").restSeconds, 60);
});

test("старі дані залишаються ізольованими до явного відновлення", () => {
  const legacy = JSON.stringify(draft(undefined, "legacy"));
  storage.set("prgrss.activeWorkout", legacy);
  storage.set("prgrss.exerciseLogPreferences", JSON.stringify({ squat: { restSeconds: 120 } }));
  assert.equal(restoreActiveWorkoutDraft("a"), null);
  assert.equal(getExerciseLogPreferences("a", "squat").restSeconds, undefined);
  assert.equal(hasLegacyWorkoutDraft("a"), true);
  assert.equal(hasLegacyExerciseLogPreferences("a"), true);
  assert.equal(restoreLegacyWorkoutDraft("a"), true);
  assert.equal(restoreLegacyExerciseLogPreferences("a"), true);
  assert.equal(restoreActiveWorkoutDraft("a").name, "legacy");
  assert.equal(getExerciseLogPreferences("a", "squat").restSeconds, 120);
  assert.equal(restoreActiveWorkoutDraft("b"), null);
  assert.equal(storage.has("prgrss.activeWorkout"), false);
  assert.equal(storage.has("prgrss.exerciseLogPreferences"), false);
});

test("відновлення не перезаписує наявні дані акаунта і не видаляє старі", () => {
  saveActiveWorkoutDraft(draft("a", "current"));
  saveExerciseLogPreferences("a", "squat", { restSeconds: 60 });
  storage.set("prgrss.activeWorkout", JSON.stringify(draft(undefined, "legacy")));
  storage.set("prgrss.exerciseLogPreferences", JSON.stringify({ squat: { restSeconds: 120 } }));
  assert.equal(restoreLegacyWorkoutDraft("a"), false);
  assert.equal(restoreLegacyExerciseLogPreferences("a"), false);
  assert.equal(restoreActiveWorkoutDraft("a").name, "current");
  assert.equal(getExerciseLogPreferences("a", "squat").restSeconds, 60);
  assert.equal(storage.has("prgrss.activeWorkout"), true);
  assert.equal(storage.has("prgrss.exerciseLogPreferences"), true);
});

test("за помилки запису старі дані зберігаються", () => {
  storage.set("prgrss.activeWorkout", JSON.stringify(draft(undefined, "legacy")));
  const setItem = localStorage.setItem;
  localStorage.setItem = () => {
    throw new Error("storage unavailable");
  };
  try {
    assert.equal(restoreLegacyWorkoutDraft("a"), false);
    assert.equal(storage.has("prgrss.activeWorkout"), true);
  } finally {
    localStorage.setItem = setItem;
  }
});

test("джерело шаблону зберігається після перезавантаження та ізольоване між акаунтами", () => {
  const source = { id: "program", name: "Сила", template: [{ exercise: { id: "squat" } }] };
  saveActiveWorkoutDraft({ ...draft("a", "A"), programSource: source });
  assert.deepEqual(restoreActiveWorkoutDraft("a").programSource, source);
  assert.equal(restoreActiveWorkoutDraft("b"), null);
  saveActiveWorkoutDraft(draft("b", "B"));
  assert.equal(restoreActiveWorkoutDraft("b").programSource, null);
});

test("пошкоджене джерело шаблону не заважає відновити тренування", () => {
  saveActiveWorkoutDraft({
    ...draft("a", "A"),
    programSource: { id: 4, name: "Сила", template: [] },
  });
  assert.equal(restoreActiveWorkoutDraft("a").programSource, null);
  assert.equal(restoreActiveWorkoutDraft("a").name, "A");
});
