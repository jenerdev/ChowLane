/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Shared service worker for console / rider / customer (D-015).
 * Precaches the app shell, caches static assets, and shows /~offline for documents when offline.
 * Private API data must never be cached here (Phase 2+).
 */
export function startServiceWorker() {
  const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
    fallbacks: {
      entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
    },
  });
  serwist.addEventListeners();
}
