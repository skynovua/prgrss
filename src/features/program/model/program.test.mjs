import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/entities/workout") {
      return nextResolve(
        new URL("../../../entities/workout/model/workout-logging.ts", context.parentURL).href,
        context
      );
    }
    return nextResolve(specifier, context);
  },
});

const { programFromWorkout, programWorkoutDraft, readProgramExercises } =
  await import("./program.ts");

const workout = {
  name: "Сила",
  sets: [
    {
      id: "one",
      exercise_id: "bench",
      set_number: 1,
      weight: 40,
      reps: 8,
      duration_s: null,
      rpe: 9,
      notes: "важко",
    },
    {
      id: "two",
      exercise_id: "bench",
      set_number: 2,
      weight: 45,
      reps: 6,
      duration_s: null,
      rpe: null,
      notes: null,
    },
    {
      id: "three",
      exercise_id: "plank",
      set_number: 1,
      weight: null,
      reps: null,
      duration_s: 45,
      rpe: null,
      notes: null,
    },
  ],
};
const exercises = [
  { id: "bench", name: "Жим", equipment: "barbell", muscle_group: "chest", catalog_key: null },
  {
    id: "plank",
    name: "Планка",
    equipment: "bodyweight",
    muscle_group: "core",
    catalog_key: "plank",
  },
];

test("програма копіює порядок, вагу, повторення і час без результатів виконання", () => {
  const result = programFromWorkout(workout, exercises);
  assert.deepEqual(
    result.map((item) => item.exercise.id),
    ["bench", "plank"]
  );
  assert.deepEqual(
    result[0].sets.map((set) => [set.weight, set.reps]),
    [
      [40, 8],
      [45, 6],
    ]
  );
  assert.equal(result[1].trackingType, "duration");
  assert.equal(result[1].sets[0].durationS, 45);
  assert.equal(result[0].sets[0].completed, false);
  assert.equal(result[0].sets[0].rpe, null);
  assert.equal(result[0].sets[0].notes, null);
  assert.equal(workout.sets[0].rpe, 9);
});

test("запуск програми створює незалежну чернетку з новими ідентифікаторами", () => {
  const template = programFromWorkout(workout, exercises);
  const result = programWorkoutDraft(template);
  assert.notEqual(result[0].instanceId, template[0].instanceId);
  assert.notEqual(result[0].sets[0].id, template[0].sets[0].id);
  result[0].sets[0].weight = 99;
  assert.equal(template[0].sets[0].weight, 40);
  assert.ok(result.every((exercise) => exercise.sets.every((set) => !set.completed)));
});

test("пошкоджені шаблони не відкриваються як коректна програма", () => {
  assert.throws(() => readProgramExercises({}), /прочитати/);
  assert.throws(
    () =>
      readProgramExercises([
        { exercise: { id: "id", name: "Назва" }, trackingType: "unknown", sets: [] },
      ]),
    /прочитати/
  );
  assert.equal(readProgramExercises(programFromWorkout(workout, exercises)).length, 2);
});
