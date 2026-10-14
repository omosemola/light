"use client";

import { useEffect } from "react";

/**
 * Automatically cleans up legacy Service Workers and stale Workbox CacheStorage
 * caches from user browsers to prevent ChunkLoadErrors, stale HTML, and broken routes.
 */
export function ServiceWorkerCleaner() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Unregister all active and legacy Service Workers
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().catch(() => {});
          }
        })
        .catch(() => {});
    }

    // 2. Delete all legacy Workbox / PWA CacheStorage entries
    if ("caches" in window) {
      caches
        .keys()
        .then((names) => {
          for (const name of names) {
            caches.delete(name).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, []);

  return null;
}
