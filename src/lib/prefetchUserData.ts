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
    // 1. Parallel fetch across all user datasets
    const [profileRes, ordersRes, reviewsRes] = await Promise.all([
      getUserProfileDb(cleanEmail),
      getUserOrders(cleanEmail),
      getUserReviews(cleanEmail),
      useFavoritesStore.getState().syncWithUserAccount(cleanEmail),
      useNotificationStore.getState().syncWithDb(cleanEmail),
    ]);

    // 2. Cache orders in sessionStorage for instant /orders navigation
    if (typeof window !== "undefined" && ordersRes?.success && ordersRes?.orders) {
      try {
        sessionStorage.setItem(`cached_orders_${cleanEmail}`, JSON.stringify(ordersRes.orders));
      } catch {}
    }

    // 3. Cache reviews in sessionStorage for instant /profile/reviews navigation
    if (typeof window !== "undefined" && reviewsRes?.success && reviewsRes?.reviews) {
      try {
        sessionStorage.setItem("cached_user_reviews", JSON.stringify(reviewsRes.reviews));
      } catch {}
    }

    // 4. Extract and cache profile data & preload avatar into browser cache
    if (profileRes?.success && profileRes?.user) {
      const user = profileRes.user;

      // Preload user profile picture into browser image cache
      if (user.image) {
        preloadBrowserImage(user.image);
      }

      const ordersCount = ordersRes?.success && ordersRes?.orders ? ordersRes.orders.length : (user.ordersCount ?? 0);
      const reviewsCount = reviewsRes?.success && reviewsRes?.reviews ? reviewsRes.reviews.length : (user.reviewsCount ?? 0);
      const points = ordersCount * 50;

      // 5. Commit all data into persistent userStore (localStorage)
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

      return user;
    }
  } catch (err) {
    console.error("Error prefetching comprehensive user data:", err);
  }

  return null;
}
