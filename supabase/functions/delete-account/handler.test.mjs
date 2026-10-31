import assert from "node:assert/strict";
import test from "node:test";

import { createDeleteAccountHandler } from "./handler.ts";

const request = (method = "POST", token = "Bearer user-token") =>
  new Request("https://example.test/delete-account", {
    method,
    headers: token ? { Authorization: token } : {},
  });

test("CORS preflight дозволяє заголовки клієнта без авторизації та видалення", async () => {
  const handler = createDeleteAccountHandler({
    getUserId: async () => {
      throw new Error("Unexpected authentication");
    },
    ensureReady: async () => {
      throw new Error("Unexpected database access");
    },
    deleteAvatars: async () => {
      throw new Error("Unexpected deletion");
    },
    deleteUser: async () => {
      throw new Error("Unexpected deletion");
    },
  });
  const response = await handler(
    new Request("https://example.test/delete-account", {
      method: "OPTIONS",
      headers: {
        Origin: "https://prgrss.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization, apikey, content-type, x-client-info",
      },
    })
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.ok(response.headers.get("access-control-allow-methods")?.includes("POST"));
  const allowedHeaders = response.headers.get("access-control-allow-headers")?.split(/,\s*/);
  for (const header of ["authorization", "apikey", "content-type", "x-client-info"]) {
    assert.ok(allowedHeaders?.includes(header), `${header} має бути дозволений`);
  }
});

test("видаляє файли й акаунт лише перевіреного користувача", async () => {
  const calls = [];
  const handler = createDeleteAccountHandler({
    getUserId: async (authorization) => {
      calls.push(["auth", authorization]);
      return "current-user";
    },
    ensureReady: async () => calls.push(["ready"]),
    deleteAvatars: async (id) => calls.push(["avatars", id]),
    deleteUser: async (id) => calls.push(["user", id]),
  });

  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(calls, [
    ["auth", "Bearer user-token"],
    ["ready"],
    ["avatars", "current-user"],
    ["user", "current-user"],
  ]);
});

test("без дійсної авторизації видалення не виконується", async () => {
  const calls = [];
  const handler = createDeleteAccountHandler({
    getUserId: async () => null,
    ensureReady: async () => calls.push("ready"),
    deleteAvatars: async () => calls.push("avatars"),
    deleteUser: async () => calls.push("user"),
  });
  assert.equal((await handler(request("POST", ""))).status, 401);
  assert.equal((await handler(request())).status, 401);
  assert.equal((await handler(request("GET"))).status, 405);
  assert.deepEqual(calls, []);
});

test("помилка видалення файлів не видаляє акаунт", async () => {
  let deleted = false;
  const handler = createDeleteAccountHandler({
    getUserId: async () => "current-user",
    ensureReady: async () => {},
    deleteAvatars: async () => {
      throw new Error("storage error");
    },
    deleteUser: async () => {
      deleted = true;
    },
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.equal((await handler(request())).status, 500);
    assert.equal(deleted, false);
  } finally {
    console.error = originalError;
  }
});

test("без підготовленої бази файли та акаунт залишаються недоторканими", async () => {
  const calls = [];
  const handler = createDeleteAccountHandler({
    getUserId: async () => "current-user",
    ensureReady: async () => {
      throw new Error("migration missing");
    },
    deleteAvatars: async () => calls.push("avatars"),
    deleteUser: async () => calls.push("user"),
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.equal((await handler(request())).status, 500);
    assert.deepEqual(calls, []);
  } finally {
    console.error = originalError;
  }
});
