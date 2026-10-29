import assert from "node:assert/strict";
import { test } from "node:test";

import { subscribeToSession } from "./session-bootstrap.ts";

function setup() {
  let resolve;
  let reject;
  let listener;
  let unsubscribed = false;
  const states = [];
  const auth = {
    getSession: () =>
      new Promise((yes, no) => {
        resolve = yes;
        reject = no;
      }),
    onAuthStateChange: (callback) => {
      listener = callback;
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              unsubscribed = true;
            },
          },
        },
      };
    },
  };
  const stop = subscribeToSession(auth, (state) => states.push(state));
  return {
    states,
    stop,
    resolve,
    reject,
    event: (user) => listener("SIGNED_IN", user ? { user } : null),
    unsubscribed: () => unsubscribed,
  };
}

test("сесія відновлюється; відсутня сесія є завершеним станом", async () => {
  for (const user of [null, { id: "user-a" }]) {
    const run = setup();
    run.resolve({ data: { session: user ? { user } : null }, error: null });
    await Promise.resolve();
    assert.deepEqual(run.states, [{ user, loading: false, error: null }]);
    run.stop();
  }
});

test("відхилений getSession та помилка Supabase завершують очікування", async () => {
  const rejected = setup();
  rejected.reject(new Error("offline"));
  await Promise.resolve();
  assert.equal(rejected.states[0].loading, false);
  assert.ok(rejected.states[0].error);
  rejected.stop();
  const failed = setup();
  failed.resolve({ data: { session: null }, error: { message: "expired" } });
  await Promise.resolve();
  assert.ok(failed.states[0].error);
  failed.stop();
});

test("пізня початкова відповідь не повертає старий акаунт після події auth", async () => {
  const run = setup();
  run.event({ id: "new-account" });
  run.resolve({ data: { session: { user: { id: "old-account" } } }, error: null });
  await Promise.resolve();
  assert.equal(run.states.length, 1);
  assert.equal(run.states[0].user.id, "new-account");
  run.event(null);
  assert.equal(run.states.at(-1).user, null);
  run.stop();
});

test("зависла перевірка має timeout; cleanup захищає повторну спробу й StrictMode", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const old = setup();
  t.mock.timers.tick(15_000);
  assert.equal(old.states[0].loading, false);
  assert.match(old.states[0].error, /довго/);
  old.stop();
  assert.ok(old.unsubscribed());
  const current = setup();
  current.event({ id: "current" });
  old.resolve({ data: { session: { user: { id: "old" } } }, error: null });
  old.event({ id: "late-event" });
  await Promise.resolve();
  assert.equal(old.states.length, 1);
  assert.equal(current.states[0].user.id, "current");
  t.mock.timers.tick(30_000);
  assert.equal(current.states.length, 1);
  current.stop();
});
