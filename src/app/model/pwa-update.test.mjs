import assert from "node:assert/strict";
import { test } from "node:test";

import { canOfferPwaUpdate, createPwaUpdateManager } from "./pwa-update.ts";

class Worker extends EventTarget {
  state = "installing";
  messages = [];

  postMessage(message) {
    this.messages.push(message);
  }

  changeState(state) {
    this.state = state;
    this.dispatchEvent(new Event("statechange"));
  }
}

test("не пропонує перезавантаження на екранах тренування й редагування", () => {
  for (const path of [
    "/workout/new",
    "/workout/123/edit",
    "/programs",
    "/programs/123",
    "/exercises/new",
    "/settings",
  ])
    assert.equal(canOfferPwaUpdate(path), false, path);
  for (const path of ["/dashboard", "/exercises", "/progress", "/progress/exercise/123"])
    assert.equal(canOfferPwaUpdate(path), true, path);
});

function setup({ controlled = true, waiting = null } = {}) {
  const registration = new EventTarget();
  registration.waiting = waiting;
  registration.installing = null;
  registration.updateCount = 0;
  registration.update = async () => {
    registration.updateCount++;
  };

  const serviceWorker = new EventTarget();
  serviceWorker.controller = controlled ? new Worker() : null;
  serviceWorker.registrations = 0;
  serviceWorker.register = async () => {
    serviceWorker.registrations++;
    return registration;
  };

  const page = new EventTarget();
  page.visibilityState = "visible";
  const browser = new EventTarget();
  let reloads = 0;
  let safe = true;
  const manager = createPwaUpdateManager({
    serviceWorker,
    page,
    browser,
    reload: () => reloads++,
    canReload: () => safe,
  });
  return {
    manager,
    registration,
    serviceWorker,
    page,
    browser,
    reloads: () => reloads,
    setSafe: (value) => (safe = value),
  };
}

test("чекає на дію користувача та перезавантажує після активації", async () => {
  const { manager, registration, serviceWorker, reloads } = setup();
  manager.start();
  await Promise.resolve();
  const next = new Worker();
  registration.installing = next;
  registration.dispatchEvent(new Event("updatefound"));
  registration.waiting = next;
  next.changeState("installed");

  assert.equal(manager.getSnapshot(), true);
  assert.equal(reloads(), 0);
  assert.equal(manager.applyUpdate(), true);
  assert.deepEqual(next.messages, [{ type: "SKIP_WAITING" }]);
  assert.equal(reloads(), 0);

  registration.waiting = null;
  next.changeState("activated");
  serviceWorker.controller = next;
  serviceWorker.dispatchEvent(new Event("controllerchange"));
  assert.equal(reloads(), 1);
});

test("перше встановлення не показує оновлення й не перезавантажує сторінку", async () => {
  const { manager, registration, serviceWorker, reloads } = setup({ controlled: false });
  manager.start();
  await Promise.resolve();
  const first = new Worker();
  registration.installing = first;
  registration.dispatchEvent(new Event("updatefound"));
  first.changeState("installed");
  serviceWorker.controller = first;
  serviceWorker.dispatchEvent(new Event("controllerchange"));
  assert.equal(manager.getSnapshot(), false);
  assert.equal(reloads(), 0);
});

test("виявляє оновлення, яке вже очікує, після відкриття сторінки", async () => {
  const worker = new Worker();
  worker.changeState("installed");
  const { manager } = setup({ waiting: worker });
  manager.start();
  await Promise.resolve();
  assert.equal(manager.getSnapshot(), true);
  assert.equal(manager.applyUpdate(), true);
  assert.deepEqual(worker.messages, [{ type: "SKIP_WAITING" }]);
});

test("оновлення з іншої вкладки не перезавантажує її примусово", async () => {
  const { manager, serviceWorker, reloads } = setup();
  manager.start();
  await Promise.resolve();
  serviceWorker.controller = new Worker();
  serviceWorker.dispatchEvent(new Event("controllerchange"));
  assert.equal(manager.getSnapshot(), true);
  assert.equal(reloads(), 0);
  assert.equal(manager.applyUpdate(), true);
  assert.equal(reloads(), 1);
});

test("відкритий редактор не перезавантажується під час активації оновлення", async () => {
  const worker = new Worker();
  worker.changeState("installed");
  const { manager, serviceWorker, setSafe, reloads } = setup({ waiting: worker });
  manager.start();
  await Promise.resolve();
  assert.equal(manager.applyUpdate(), true);
  setSafe(false);
  worker.changeState("activated");
  serviceWorker.controller = worker;
  serviceWorker.dispatchEvent(new Event("controllerchange"));
  assert.equal(reloads(), 0);
  assert.equal(manager.getSnapshot(), true);
  assert.equal(manager.applyUpdate(), false);
  setSafe(true);
  assert.equal(manager.applyUpdate(), true);
  assert.equal(reloads(), 1);
});

test("перевіряє оновлення при поверненні або відновленні мережі", async () => {
  const { manager, registration, serviceWorker, page, browser } = setup();
  manager.start();
  manager.start();
  await Promise.resolve();
  assert.equal(serviceWorker.registrations, 1);
  page.visibilityState = "hidden";
  page.dispatchEvent(new Event("visibilitychange"));
  assert.equal(registration.updateCount, 0);
  page.visibilityState = "visible";
  page.dispatchEvent(new Event("visibilitychange"));
  browser.dispatchEvent(new Event("online"));
  assert.equal(registration.updateCount, 2);
});

test("повторює невдалу реєстрацію після відновлення мережі", async () => {
  const { manager, serviceWorker, browser } = setup();
  let attempts = 0;
  serviceWorker.register = async () => {
    attempts++;
    if (attempts === 1) throw new Error("offline");
    return new EventTarget();
  };
  manager.start();
  await Promise.resolve();
  browser.dispatchEvent(new Event("online"));
  await Promise.resolve();
  assert.equal(attempts, 2);
});
