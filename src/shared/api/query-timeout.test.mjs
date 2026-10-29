import assert from "node:assert/strict";
import { test } from "node:test";

import { QueryTimeoutError, withQueryTimeout } from "./query-timeout.ts";

test("зависле читання завершується помилкою; пізній результат відкидається", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let resolve;
  const result = withQueryTimeout(
    () =>
      new Promise((yes) => {
        resolve = yes;
      })
  );
  await Promise.resolve();
  const rejected = assert.rejects(result, QueryTimeoutError);
  t.mock.timers.tick(20_000);
  await rejected;
  resolve("late");
  await assert.rejects(result, QueryTimeoutError);
});

test("швидке читання та його помилка не підміняються timeout", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  assert.equal(await withQueryTimeout(async () => "ready"), "ready");
  const error = new Error("request failed");
  await assert.rejects(
    withQueryTimeout(async () => {
      throw error;
    }),
    (actual) => actual === error
  );
  t.mock.timers.tick(30_000);
});
