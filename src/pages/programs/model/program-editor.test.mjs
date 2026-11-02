import assert from "node:assert/strict";
import { test } from "node:test";

import { moveProgramExercise, updateProgramExerciseOptions } from "./program-editor.ts";

const exercises = [
  {
    instanceId: "one",
    trackingType: "weight-reps",
    restSeconds: 90,
    sets: [{ id: "a", weight: 40, reps: 8, durationS: null }],
  },
  {
    instanceId: "two",
    trackingType: "bodyweight",
    restSeconds: 60,
    sets: [{ id: "b", weight: null, reps: 12, durationS: null }],
  },
];

test("перестановка зберігає підходи й не змінює початковий список", () => {
  const reordered = moveProgramExercise(exercises, 0, 1);
  assert.deepEqual(
    reordered.map((item) => item.instanceId),
    ["two", "one"]
  );
  assert.equal(reordered[1].sets[0].weight, 40);
  assert.equal(exercises[0].instanceId, "one");
  assert.equal(moveProgramExercise(exercises, 0, -1), exercises);
});

test("зміна формату й відпочинку не втрачає введені значення", () => {
  const timed = updateProgramExerciseOptions(exercises[0], "duration", 120);
  assert.equal(timed.trackingType, "duration");
  assert.equal(timed.restSeconds, 120);
  assert.deepEqual(timed.sets, exercises[0].sets);
  const restored = updateProgramExerciseOptions(timed, "weight-reps", 90);
  assert.equal(restored.sets[0].weight, 40);
  assert.equal(restored.sets[0].reps, 8);
});
