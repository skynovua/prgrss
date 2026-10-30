import assert from "node:assert/strict";
import test from "node:test";

import { combineTricepsTargets, isTricepsHead } from "./anatomy-targets.ts";

const muscle = (muscleKey, activationScore) => ({
  muscleKey,
  name: muscleKey,
  muscleGroup: "arms",
  sortOrder: 19,
  activationScore,
});

test("об’єднує старі головки трицепса за найбільшою оцінкою, не змінюючи дані", () => {
  const input = [
    muscle("triceps_brachii", 4),
    muscle("triceps_long_head", 9),
    muscle("triceps_lateral_head", 6),
    muscle("biceps_brachii", 7),
  ];
  const result = combineTricepsTargets(input);
  assert.deepEqual(
    result.map((entry) => [entry.muscleKey, entry.activationScore]),
    [
      ["triceps_brachii", 9],
      ["biceps_brachii", 7],
    ]
  );
  assert.equal(result[0].name, "Трицепси");
  assert.equal(input[1].muscleKey, "triceps_long_head");
  assert.equal(isTricepsHead("triceps_lateral_head"), true);
  assert.equal(isTricepsHead("triceps_brachii"), false);
});
