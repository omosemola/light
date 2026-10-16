import { getUserProfileDb } from "@/actions/account";
import { getUserOrders } from "@/actions/orders";
import { getUserReviews } from "@/actions/reviews";
import { useUserStore } from "@/lib/userStore";
import { useFavoritesStore } from "@/lib/favoritesStore";
import { useNotificationStore } from "@/lib/notificationStore";

/**
 * Preloads an image into the browser's HTTP/memory cache so it renders instantly with 0ms delay.
 */
export function preloadBrowserImage(url?: string | null) {
  if (typeof window !== "undefined" && url && (url.startsWith("http") || url.startsWith("/"))) {
    try {
      const img = new window.Image();
      img.src = url;
    } catch {}
  }
}

/**
 * Centralized comprehensive data pre-fetcher for the authenticated user.
 * Loads profile photo, hostel, phone, locations, vendor status, order history,
 * reviews, favorites, notifications, and campus points in parallel.
 */
export async function prefetchUserData(email: string) {
  if (!email || !email.trim()) return null;
  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Prioritize critical profile fetch first to unblock UI header & identity
    const profileRes = await getUserProfileDb(cleanEmail);

    if (profileRes?.success && profileRes?.user) {
      const user = profileRes.user;

      // Preload user profile picture into browser image cache
      if (user.image) {
        preloadBrowserImage(user.image);
      }

      const ordersCount = user.ordersCount ?? 0;
      const reviewsCount = user.reviewsCount ?? 0;
      const points = ordersCount * 50;

      // Commit core profile data into persistent userStore immediately
      useUserStore.getState().updateProfile({
        name: user.name || (cleanEmail.includes("@") ? cleanEmail.split("@")[0].replace(".", " ") : "Student"),
        email: cleanEmail,
        phone: user.phone || "",
        avatar: user.image || undefined,
        role: user.role || "STUDENT",
        hostel: user.hostel || "",
        addressDetail: user.addressDetail || "",
        savedLocations: user.savedLocations || [],
        storeId: user.storeId,
        storeName: user.storeName,
        ordersCount,
        reviewsCount,
        points,
        isVisitor: false,
      });

      // 2. Schedule non-critical background data synchronization during browser idle time
      // This prevents socket contention on low internet speeds, reserving bandwidth for page rendering
      const scheduleIdle = typeof window !== "undefined" && "requestIdleCallback" in window
        ? (cb: () => void) => (window as any).requestIdleCallback(cb, { timeout: 3500 })
        : (cb: () => void) => setTimeout(cb, 2500);

      scheduleIdle(async () => {
        try {
          const [favRes, notifRes, ordersRes, reviewsRes] = await Promise.allSettled([
            useFavoritesStore.getState().syncWithUserAccount(cleanEmail),
            useNotificationStore.getState().syncWithDb(cleanEmail),
            getUserOrders(cleanEmail),
            getUserReviews(cleanEmail),
          ]);

          if (typeof window !== "undefined") {
            if (ordersRes.status === "fulfilled" && ordersRes.value?.success && ordersRes.value?.orders) {
              try {
                sessionStorage.setItem(`cached_orders_${cleanEmail}`, JSON.stringify(ordersRes.value.orders));
              } catch {}
            }
            if (reviewsRes.status === "fulfilled" && reviewsRes.value?.success && reviewsRes.value?.reviews) {
              try {
                sessionStorage.setItem("cached_user_reviews", JSON.stringify(reviewsRes.value.reviews));
              } catch {}
            }
          }
        } catch {}
      });

      return user;
    }
  } catch (err) {
    console.error("Error prefetching user profile data:", err);
  }

  return null;
}
