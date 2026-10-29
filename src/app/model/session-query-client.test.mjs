import assert from "node:assert/strict";
import { test } from "node:test";

import { onlineManager, QueryObserver } from "@tanstack/react-query";

import { QueryTimeoutError } from "../../shared/api/query-timeout.ts";
import { createSessionQueryClient } from "./session-query-client.ts";

test("timeout не запускає повторний паралельний запит автоматично", async () => {
  const client = createSessionQueryClient();
  let calls = 0;
  await assert.rejects(
    client.fetchQuery({
      queryKey: ["slow"],
      queryFn: async () => {
        calls++;
        throw new QueryTimeoutError();
      },
    }),
    QueryTimeoutError
  );
  assert.equal(calls, 1);
  client.clear();
});

test("повторний перехід використовує свіжий кеш без нового запиту", async () => {
  const client = createSessionQueryClient();
  let calls = 0;
  const options = {
    queryKey: ["dashboard"],
    queryFn: async () => {
      calls++;
      return { workouts: 3 };
    },
  };
  await client.prefetchQuery(options);
  assert.deepEqual(await client.fetchQuery(options), { workouts: 3 });
  assert.equal(calls, 1);
  client.clear();
});

test("помилка фонового оновлення зберігає останні дані", async () => {
  const client = createSessionQueryClient();
  const queryKey = ["profile"];
  client.setQueryData(queryKey, { name: "Атлет" });
  await assert.rejects(
    client.fetchQuery({
      queryKey,
      staleTime: 0,
      retry: false,
      queryFn: async () => {
        throw new Error("offline");
      },
    })
  );
  assert.deepEqual(client.getQueryData(queryKey), { name: "Атлет" });
  assert.equal(client.getQueryState(queryKey).status, "error");
  client.clear();
});

test("відповідь старого акаунта не потрапляє до кешу нового", async () => {
  const oldClient = createSessionQueryClient();
  let resolve;
  const request = oldClient.fetchQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      new Promise((yes) => {
        resolve = yes;
      }),
  });
  const nextClient = createSessionQueryClient();
  nextClient.setQueryData(["dashboard"], { user: "new" });
  resolve({ user: "old" });
  await request;
  assert.deepEqual(nextClient.getQueryData(["dashboard"]), { user: "new" });
  oldClient.clear();
  nextClient.clear();
});

test("offline-пауза не є завершеним порожнім результатом; мережа відновлює запит", async () => {
  const client = createSessionQueryClient();
  client.mount();
  onlineManager.setOnline(false);
  const observer = new QueryObserver(client, {
    queryKey: ["exercises"],
    queryFn: async () => ["Присідання"],
  });
  const stop = observer.subscribe(() => {});
  try {
    assert.equal(observer.getCurrentResult().isPending, true);
    assert.equal(observer.getCurrentResult().isPaused, true);
    onlineManager.setOnline(true);
    await observer.refetch();
    assert.deepEqual(observer.getCurrentResult().data, ["Присідання"]);
  } finally {
    stop();
    onlineManager.setOnline(true);
    client.unmount();
    client.clear();
  }
});
