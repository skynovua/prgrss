import assert from "node:assert/strict";
import { test } from "node:test";

import { programMuscles } from "./program-muscles.ts";

const muscle = (key, score, sortOrder = 1) => ({
  muscleKey: key,
  name: key,
  muscleGroup: "test",
  activationScore: score,
  sortOrder,
});
const exercise = (id) => ({ exercise: { id } });

test("анатомія об'єднує вправи за найвищим залученням та позначає відсутні дані", () => {
  const result = programMuscles(
    [exercise("a"), exercise("b"), exercise("missing")],
    [
      { id: "a", muscles: [muscle("back", 5, 2), muscle("arms", 8, 1)] },
      { id: "b", muscles: [muscle("back", 9, 2)] },
    ]
  );
  assert.deepEqual(
    result.muscles.map(({ muscleKey, activationScore }) => [muscleKey, activationScore]),
    [
      ["arms", 8],
      ["back", 9],
    ]
  );
  assert.equal(result.hasUnmappedExercises, true);
  assert.deepEqual(programMuscles([], []).muscles, []);
});
