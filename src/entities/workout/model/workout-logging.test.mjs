import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

import { extendRestClock, getRestSeconds, startRestClock, toggleRestClock } from "./rest-clock.ts";
import {
  createWorkoutSet,
  formatSetSummary,
  getExerciseTrackingType,
  getSetErrors,
  getWorkoutReview,
  isSetValid,
  parseWorkoutNumber,
} from "./workout-logging.ts";

// Node запускає TS без збирача; відносні імпорти застосунку не містять розширень.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      return nextResolve(new URL(`${specifier}.ts`, context.parentURL).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { buildSaveWorkoutPayload, buildWorkoutSetsPayload } = await import("../api/workout-rpc.ts");
const { createInitialState, workoutReducer } = await import("./reducer.ts");

const validSet = () => ({
  id: "set-1",
  setNumber: 1,
  weight: 17.5,
  reps: 8,
  durationS: null,
  rpe: null,
  completed: true,
});

test("порожню, від’ємну та завелику вагу не можна підтвердити", () => {
  for (const weight of [null, -1, 0, 10000, Infinity, NaN, 17.555]) {
    assert.ok(getSetErrors({ ...validSet(), weight }, "weight-reps").weight);
  }
  for (const weight of [0.01, 17.5, 102.5, 9999.99]) {
    assert.equal(isSetValid({ ...validSet(), weight }, "weight-reps"), true);
  }
});

test("власна вага допускає порожню додаткову вагу, але вимагає повторення", () => {
  assert.equal(isSetValid({ ...validSet(), weight: null }, "bodyweight"), true);
  assert.equal(isSetValid({ ...validSet(), weight: 0 }, "bodyweight"), true);
  for (const reps of [null, 0, -1, 1.5, 1000]) {
    assert.ok(getSetErrors({ ...validSet(), reps }, "bodyweight").reps);
  }
});

test("нечисловий текст у необов’язковій вазі не перетворюється на порожнє поле після відновлення", () => {
  const invalid = { ...validSet(), weight: null, inputValues: { weight: "abc" } };
  assert.ok(getSetErrors(invalid, "bodyweight").weight);
  assert.ok(getSetErrors(JSON.parse(JSON.stringify(invalid)), "bodyweight").weight);
  assert.equal(isSetValid({ ...invalid, inputValues: { weight: "" } }, "bodyweight"), true);
  assert.equal(isSetValid({ ...validSet(), inputValues: { weight: "17,5" } }, "weight-reps"), true);
});

test("вправа на час вимагає секунди й не вимагає ваги або повторень", () => {
  const timed = { ...validSet(), weight: null, reps: null, durationS: 45 };
  assert.equal(isSetValid(timed, "duration"), true);
  for (const durationS of [null, 0, -30, 1.5, 86401]) {
    assert.ok(getSetErrors({ ...timed, durationS }, "duration").durationS);
  }
});

test("RPE необов’язковий, приймає лише 6–10 із кроком 0,5", () => {
  for (const rpe of [null, 6, 6.5, 8, 10]) {
    assert.equal(getSetErrors({ ...validSet(), rpe }, "weight-reps").rpe, undefined);
  }
  for (const rpe of [1, 5.5, 8.2, 10.5, NaN]) {
    assert.ok(getSetErrors({ ...validSet(), rpe }, "weight-reps").rpe);
  }
});

test("введення підтримує десяткову кому без підміни порожнього поля", () => {
  assert.equal(parseWorkoutNumber("102,5"), 102.5);
  assert.equal(parseWorkoutNumber("17."), 17);
  assert.equal(parseWorkoutNumber("-2"), -2);
  for (const value of ["", " ", "abc", "1,2,3", "1e3", "Infinity"]) {
    assert.equal(parseWorkoutNumber(value), null);
  }
});

test("планки визначаються ключем каталогу; історія з часом працює для власної вправи", () => {
  assert.equal(
    getExerciseTrackingType({ equipment: "bodyweight", catalog_key: "plank" }),
    "duration"
  );
  assert.equal(
    getExerciseTrackingType({ equipment: "bodyweight", catalog_key: "side-plank" }),
    "duration"
  );
  assert.equal(
    getExerciseTrackingType({ equipment: "bodyweight", catalog_key: "pull-up" }),
    "bodyweight"
  );
  assert.equal(getExerciseTrackingType({ equipment: "machine" }, [{ durationS: 60 }]), "duration");
  assert.equal(getExerciseTrackingType({ equipment: "barbell" }), "weight-reps");
});

test("новий підхід копіює результат, але не виконання, RPE чи нотатку", () => {
  const previous = { ...validSet(), rpe: 8, notes: "старе" };
  const set = createWorkoutSet("weight-reps", 2, previous);
  assert.equal(set.weight, previous.weight);
  assert.equal(set.reps, previous.reps);
  assert.equal(set.completed, false);
  assert.equal(set.rpe, null);
  assert.equal(set.notes, null);
  assert.notEqual(set.id, previous.id);
  const timed = createWorkoutSet("duration", 1, { ...previous, durationS: 45 });
  assert.equal(timed.durationS, 45);
  assert.equal(timed.reps, null);
  assert.equal(timed.weight, null);
});

test("перегляд відрізняє незавершені підходи від помилкових виконаних", () => {
  const exercise = {
    instanceId: "exercise-1",
    exercise: { id: "bench", name: "Жим" },
    trackingType: "weight-reps",
    restSeconds: 90,
  };
  const review = getWorkoutReview([
    {
      ...exercise,
      sets: [
        validSet(),
        { ...validSet(), id: "pending", completed: false },
        { ...validSet(), id: "invalid", weight: null },
      ],
    },
  ]);
  assert.equal(review.completedSets, 2);
  assert.equal(review.unfinishedSets, 1);
  assert.equal(review.completedExercises, 1);
  assert.deepEqual(review.invalidSets, [
    { exerciseIndex: 0, setId: "invalid", label: "Жим, підхід 1" },
  ]);
});

test("історія показує одиниці, повторення й тривалість відповідного типу", () => {
  assert.equal(formatSetSummary(validSet(), "weight-reps"), "17,5 кг × 8");
  assert.equal(formatSetSummary({ ...validSet(), weight: null }, "bodyweight"), "8 повт.");
  assert.equal(formatSetSummary({ ...validSet(), durationS: 45 }, "duration"), "45 с");
  assert.equal(formatSetSummary({ ...validSet(), durationS: null }, "duration"), null);
});

test("таймер рахує від кінцевого часу після пропущених інтервалів і відновлення", () => {
  const clock = startRestClock(90, 1000);
  assert.equal(getRestSeconds(clock, 1000), 90);
  assert.equal(getRestSeconds(clock, 46500), 45);
  assert.equal(getRestSeconds(JSON.parse(JSON.stringify(clock)), 61000), 30);
  assert.equal(getRestSeconds(clock, 999999), 0);
  assert.equal(extendRestClock(clock, 15, 46500).endsAt, clock.endsAt + 15000);
});

test("пауза зберігає залишок; +15 секунд працює на паузі й під час відліку", () => {
  const clock = startRestClock(90, 1000);
  const paused = toggleRestClock(clock, 31000);
  assert.equal(getRestSeconds(paused, 999999), 60);
  const extended = extendRestClock(paused, 15, 999999);
  assert.equal(getRestSeconds(extended, 999999), 75);
  const resumed = toggleRestClock(extended, 1000000);
  assert.equal(getRestSeconds(resumed, 1030000), 45);
  assert.equal(getRestSeconds(extendRestClock(resumed, 15, 1030000), 1030000), 60);
});

test("reducer не завершує порожній підхід і не запускає таймер", () => {
  const state = workoutReducer(createInitialState(), {
    type: "ADD_EXERCISE",
    exercise: { id: "bench", name: "Жим", equipment: "barbell" },
  });
  const completed = { ...state.exercises[0].sets[0], completed: true };
  const next = workoutReducer(state, {
    type: "COMPLETE_SET",
    exerciseIndex: 0,
    set: completed,
    autoTimer: true,
  });
  assert.equal(next.exercises[0].sets[0].completed, false);
  assert.equal(next.restClock, null);
});

test("історія для доданої пізніше вправи не змінює вже введені підходи", () => {
  const exercise = { id: "bench", name: "Жим", equipment: "barbell" };
  let state = workoutReducer(createInitialState(), { type: "ADD_EXERCISE", exercise });
  const entered = { ...state.exercises[0].sets[0], weight: 37.5, reps: 9 };
  state = workoutReducer(state, { type: "UPDATE_SET", exerciseIndex: 0, set: entered });
  const previous = { setNumber: 1, weight: 40, reps: 8, rpe: null, durationS: null };
  const next = workoutReducer(state, { type: "ADD_EXERCISE", exercise, previousSets: [previous] });
  assert.deepEqual(next.exercises[0].sets[0], entered);
  assert.equal(next.exercises[1].sets[0].weight, 40);
  assert.equal(next.exercises[1].sets[0].completed, false);
});

test("автоматичний таймер запускається на виконанні, а редагування його не перезапускає", () => {
  let state = workoutReducer(createInitialState(), {
    type: "ADD_EXERCISE",
    exercise: { id: "bench", name: "Жим", equipment: "barbell" },
    preferences: { restSeconds: 120 },
  });
  const completed = { ...state.exercises[0].sets[0], weight: 20, completed: true };
  const before = Date.now();
  state = workoutReducer(state, {
    type: "COMPLETE_SET",
    exerciseIndex: 0,
    set: completed,
    autoTimer: true,
  });
  assert.ok(state.restClock.endsAt >= before + 120000);
  assert.equal(state.timerOpen, false);
  const clock = state.restClock;
  state = workoutReducer(state, {
    type: "UPDATE_SET",
    exerciseIndex: 0,
    set: { ...completed, weight: 22.5 },
  });
  assert.deepEqual(state.restClock, clock);
  assert.equal(state.exercises[0].sets[0].completed, true);
});

test("скасування видалення відновлює потрібний екземпляр вправи та порядок підходів", () => {
  let state = workoutReducer(createInitialState(), {
    type: "ADD_EXERCISE",
    exercise: { id: "bench", name: "Жим", equipment: "barbell" },
  });
  state = workoutReducer(state, { type: "ADD_SET", exerciseIndex: 0 });
  state = workoutReducer(state, {
    type: "ADD_EXERCISE",
    exercise: { id: "bench", name: "Жим", equipment: "barbell" },
  });
  const original = state.exercises[0];
  const set = original.sets[0];
  state = workoutReducer(state, { type: "DELETE_SET", exerciseIndex: 0, setId: set.id });
  state = workoutReducer(state, {
    type: "REORDER_EXERCISE",
    instanceId: original.instanceId,
    toIndex: 1,
  });
  state = workoutReducer(state, { type: "RESTORE_SET", exercise: original, exerciseIndex: 0, set });
  assert.deepEqual(
    state.exercises[1].sets.map((item) => item.id),
    original.sets.map((item) => item.id)
  );
  assert.deepEqual(
    state.exercises[1].sets.map((item) => item.setNumber),
    [1, 2]
  );
  assert.equal(state.exercises[0].sets.length, 1);
});

test("payload містить лише виконане, перенумеровує підходи та зберігає секунди й нотатки", () => {
  const exercises = [
    {
      instanceId: "a",
      exercise: { id: "bench", name: "Жим" },
      trackingType: "weight-reps",
      restSeconds: 90,
      sets: [
        { ...validSet(), completed: false },
        { ...validSet(), id: "done", setNumber: 2, notes: " Рівний темп " },
      ],
    },
    {
      instanceId: "b",
      exercise: { id: "plank", name: "Планка" },
      trackingType: "duration",
      restSeconds: 60,
      sets: [{ ...validSet(), durationS: 45, weight: null, reps: null }],
    },
    {
      instanceId: "c",
      exercise: { id: "pending", name: "Не виконана" },
      trackingType: "weight-reps",
      restSeconds: 90,
      sets: [{ ...validSet(), completed: false }],
    },
  ];
  const payload = buildSaveWorkoutPayload({
    workoutId: "stable-id",
    workoutExercises: exercises,
    startedAt: "start",
    finishedAt: "finish",
  });
  assert.equal(payload.workout_id, "stable-id");
  assert.equal(payload.name, "Жим, Планка");
  assert.equal(payload.sets.length, 2);
  assert.equal(payload.sets[0].set_number, 1);
  assert.equal(payload.sets[0].notes, "Рівний темп");
  assert.equal(payload.sets[1].duration_s, 45);
  assert.equal(payload.sets[1].weight, null);
  assert.equal(payload.sets[1].reps, null);
});

test("payload відхиляє невалідне виконане та порожнє тренування", () => {
  const exercise = {
    exercise: { id: "bench", name: "Жим" },
    trackingType: "weight-reps",
    sets: [{ ...validSet(), weight: null }],
  };
  assert.throws(() => buildWorkoutSetsPayload([exercise]), /не пройшли перевірку/);
  assert.throws(() => buildWorkoutSetsPayload([]), /не пройшли перевірку/);
});

test("послідовне додавання вибраних вправ зберігає порядок та історію кожної", () => {
  const selected = [
    { id: "bench", name: "Жим", equipment: "barbell" },
    { id: "squat", name: "Присідання", equipment: "barbell" },
  ];
  const history = {
    bench: [{ setNumber: 1, weight: 40, reps: 8, rpe: null, durationS: null }],
    squat: [{ setNumber: 1, weight: 60, reps: 5, rpe: null, durationS: null }],
  };
  const result = selected.reduce(
    (state, exercise) =>
      workoutReducer(state, {
        type: "ADD_EXERCISE",
        exercise,
        previousSets: history[exercise.id],
      }),
    createInitialState()
  );
  assert.deepEqual(
    result.exercises.map((item) => item.exercise.id),
    ["bench", "squat"]
  );
  assert.deepEqual(
    result.exercises.map((item) => item.sets[0].weight),
    [40, 60]
  );
  assert.notEqual(result.exercises[0].instanceId, result.exercises[1].instanceId);
});

test("перестановка зберігає підходи, порядок і стани окремих екземплярів", () => {
  let state = createInitialState();
  for (const id of ["first", "second", "third"]) {
    state = workoutReducer(state, {
      type: "ADD_EXERCISE",
      exercise: { id, name: id, equipment: "barbell" },
    });
  }
  const first = state.exercises[0];
  const edited = { ...first.sets[0], inputValues: { weight: "37,5" }, reps: 8 };
  state = workoutReducer(state, { type: "UPDATE_SET", exerciseIndex: 0, set: edited });
  const moved = workoutReducer(state, {
    type: "REORDER_EXERCISE",
    instanceId: first.instanceId,
    toIndex: 2,
  });
  assert.deepEqual(
    moved.exercises.map((item) => item.exercise.id),
    ["second", "third", "first"]
  );
  assert.deepEqual(moved.exercises[2].sets[0], edited);
  assert.equal(moved.exercises[2].instanceId, first.instanceId);
  assert.equal(
    workoutReducer(moved, { type: "REORDER_EXERCISE", instanceId: "missing", toIndex: 1 }),
    moved
  );
  assert.equal(
    workoutReducer(moved, { type: "REORDER_EXERCISE", instanceId: first.instanceId, toIndex: -1 }),
    moved
  );
});

test("збереження та відновлення зберігають порядок вправ і стару історію", async () => {
  const { orderWorkoutSets } = await import("./workout-order.ts");
  const sets = [
    { exercise_id: "a", set_number: 1 },
    { exercise_id: "b", set_number: 1 },
    { exercise_id: "a", set_number: 2 },
    { exercise_id: "c", set_number: 1 },
  ];
  assert.deepEqual(
    orderWorkoutSets(sets, ["b", "a"]).map((set) => set.exercise_id),
    ["b", "a", "a", "c"]
  );
  assert.deepEqual(orderWorkoutSets(sets, null), sets);
  assert.deepEqual(
    sets.map((set) => set.exercise_id),
    ["a", "b", "a", "c"]
  );
  let state = createInitialState();
  for (const id of ["b", "a"]) {
    state = workoutReducer(state, {
      type: "ADD_EXERCISE",
      exercise: { id, name: id, equipment: "barbell" },
    });
    const i = state.exercises.length - 1;
    state = workoutReducer(state, {
      type: "COMPLETE_SET",
      exerciseIndex: i,
      autoTimer: false,
      set: { ...state.exercises[i].sets[0], completed: true, weight: 10, reps: 5 },
    });
  }
  const payload = buildSaveWorkoutPayload({
    workoutExercises: state.exercises,
    startedAt: state.startedAt,
    finishedAt: state.startedAt,
  });
  assert.deepEqual(payload.exercise_order, ["b", "a"]);
});
