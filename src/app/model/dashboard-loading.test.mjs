import assert from "node:assert/strict";
import { test } from "node:test";

import { QueryClient, QueryObserver } from "@tanstack/react-query";

import { isDashboardLoading } from "./dashboard-loading.ts";

test("головна очікує перше завантаження шаблонів, але показує кеш під час оновлення", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["dashboard"], { ready: true });
  const dashboard = new QueryObserver(client, { queryKey: ["dashboard"], enabled: false });
  let resolvePrograms;
  const programs = new QueryObserver(client, {
    queryKey: ["programs", "user"],
    queryFn: () =>
      new Promise((resolve) => {
        resolvePrograms = resolve;
      }),
  });
  const stop = programs.subscribe(() => {});
  try {
    assert.equal(
      isDashboardLoading(dashboard.getCurrentResult(), programs.getCurrentResult()),
      true
    );
    const request = programs.refetch();
    resolvePrograms([{ id: "template" }]);
    await request;
    assert.equal(
      isDashboardLoading(dashboard.getCurrentResult(), programs.getCurrentResult()),
      false
    );
    const refresh = programs.refetch();
    assert.equal(
      isDashboardLoading(dashboard.getCurrentResult(), programs.getCurrentResult()),
      false
    );
    resolvePrograms([{ id: "template" }]);
    await refresh;
    assert.equal(
      isDashboardLoading(dashboard.getCurrentResult(), { isPending: true, fetchStatus: "paused" }),
      false
    );
  } finally {
    stop();
    client.clear();
  }
});
