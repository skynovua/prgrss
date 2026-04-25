/// <reference lib="webworker" />

import { ExpirationPlugin } from "workbox-expiration";
import { createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
}

precacheAndRoute(self.__WB_MANIFEST);

const navigationHandler = createHandlerBoundToURL("/index.html");

registerRoute(
  new NavigationRoute(navigationHandler, {
    denylist: [/^\/api/, /^\/auth/],
  })
);

registerRoute(
  ({ url }) => /^https:\/\/.*\.supabase\.co\/auth\/.*/i.test(url.href),
  new NetworkFirst({
    cacheName: "supabase-auth",
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
    ],
  })
);

registerRoute(
  ({ url }) => /^https:\/\/.*\.supabase\.co\/rest\/.*/i.test(url.href),
  new NetworkFirst({
    cacheName: "supabase-api",
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24,
      }),
    ],
  })
);

registerRoute(
  ({ url }) => /^https:\/\/.*\.supabase\.co\/storage\/.*/i.test(url.href),
  new CacheFirst({
    cacheName: "supabase-storage",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

registerRoute(
  ({ url }) => /^https:\/\/fonts\.googleapis\.com\/.*/i.test(url.href),
  new StaleWhileRevalidate({
    cacheName: "google-fonts-stylesheets",
  })
);

registerRoute(
  ({ url }) => /^https:\/\/fonts\.gstatic\.com\/.*/i.test(url.href),
  new CacheFirst({
    cacheName: "google-fonts-webfonts",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  })
);

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event);

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "PRGRSS", {
      body: payload.body ?? "Час на тренування. Зайди в застосунок і продовжуй прогрес.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag ?? "workout-reminder",
      data: {
        url: payload.url ?? "/dashboard",
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url ?? "/dashboard", self.location.origin)
    .href;

  event.waitUntil(focusOrOpenClient(targetUrl));
});

function readPushPayload(event: PushEvent): PushPayload {
  if (!event.data) {
    return {};
  }

  try {
    return event.data.json() as PushPayload;
  } catch {
    return {
      body: event.data.text(),
    };
  }
}

async function focusOrOpenClient(targetUrl: string) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

  for (const client of clients) {
    if (client.url === targetUrl) {
      await client.focus();
      return;
    }
  }

  await self.clients.openWindow(targetUrl);
}
