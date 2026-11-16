import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

interface PrecacheManifestItem {
  url: string;
  revision: string | null;
}

interface SwWindowClient {
  url: string;
  focused?: boolean;
  focus: () => Promise<SwWindowClient>;
  navigate?: (url: string) => Promise<SwWindowClient | null>;
}

interface SwGlobalScope {
  __WB_MANIFEST: Array<PrecacheManifestItem | string>;
  skipWaiting: () => Promise<void>;
  registration: ServiceWorkerRegistration;
  location: Location;
  clients: {
    matchAll: (options?: {
      type?: 'window' | 'worker' | 'sharedworker' | 'all';
      includeUncontrolled?: boolean;
    }) => Promise<SwWindowClient[]>;
    openWindow: (url: string) => Promise<SwWindowClient | null>;
  };
  addEventListener: (
    type: string,
    listener: (event: any) => void
  ) => void;
}

const sw = self as unknown as SwGlobalScope;

sw.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

precacheAndRoute((self as unknown as SwGlobalScope).__WB_MANIFEST);

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api\//],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

sw.addEventListener('push', (event: any) => {
  let payload: {
    title?: string;
    body?: string;
    tag?: string;
    url?: string;
  } = {};

  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch {
    try {
      payload = { body: event.data?.text() };
    } catch {
      payload = {};
    }
  }

  const title = payload.title || 'HOY · Recordatorio';
  const body =
    payload.body || 'Tienes una actividad pendiente en tu jornada de hoy.';
  const tag = payload.tag || 'hoy-push-alert';
  const targetUrl = payload.url || '/';

  const options: NotificationOptions & { renotify?: boolean } = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag,
    renotify: true,
    data: { url: targetUrl },
  };

  event.waitUntil(sw.registration.showNotification(title, options));
});

sw.addEventListener('notificationclick', (event: any) => {
  event.notification?.close();
  const targetPath = String(event.notification?.data?.url || '/');
  const fullTargetUrl = new URL(targetPath, sw.location.origin).href;

  event.waitUntil(
    (async () => {
      const clientList = await sw.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if (client.url.startsWith(sw.location.origin)) {
          await client.focus();
          if (client.url !== fullTargetUrl && typeof client.navigate === 'function') {
            await client.navigate(fullTargetUrl);
          }
          return;
        }
      }

      if (typeof sw.clients.openWindow === 'function') {
        await sw.clients.openWindow(fullTargetUrl);
      }
    })()
  );
});
