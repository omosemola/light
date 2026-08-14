"use client";

/**
 * PWA Browser Push Notification Utility
 * Handles device permissions, native system notifications, and audio chimes
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export interface SendPushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

export function sendBrowserNotification({
  title,
  body,
  icon = "/icons/icon-192x192.png",
  badge = "/icons/icon-72x72.png",
  tag,
  url,
}: SendPushNotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge,
        tag: tag || `lightson-notif-${Date.now()}`,
      });

      if (url) {
        notification.onclick = (e) => {
          e.preventDefault();
          window.focus();
          window.location.href = url;
        };
      }
    } catch (e) {
      // Fallback for Service Worker notification if standalone
      if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon,
            badge,
            tag: tag || `lightson-notif-${Date.now()}`,
          });
        });
      }
    }
  }
}
