"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useUserStore } from "@/lib/userStore";
import { useFavoritesStore } from "@/lib/favoritesStore";
import { useNotificationStore } from "@/lib/notificationStore";
import { getUserProfileDb } from "@/actions/account";

function SessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { updateProfile, setHasSeenOnboarding, profile } = useUserStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user && session.user.email) {
      setHasSeenOnboarding(true);
      const sessionEmail = session.user.email.trim().toLowerCase();
      const currentEmail = profile.email?.trim().toLowerCase();

      // If user is authenticated via NextAuth/Google, sync the student's name, email, avatar, hostel, and stats
      if (
        currentEmail !== sessionEmail ||
        profile.name === "Platform Super Admin" ||
        profile.role === "ADMIN" ||
        profile.isVisitor ||
        !profile.hostel
      ) {
        getUserProfileDb(sessionEmail).then((res) => {
          if (res.success && res.user) {
            updateProfile({
              name: res.user.name || session.user.name || session.user.email?.split("@")[0] || "Student",
              email: session.user.email || "",
              phone: res.user.phone || profile.phone || "",
              avatar: res.user.image || session.user.image || profile.avatar,
              role: (res.user.role as any) || "STUDENT",
              hostel: res.user.hostel || profile.hostel || "",
              addressDetail: res.user.addressDetail || profile.addressDetail || "",
              savedLocations: res.user.savedLocations || profile.savedLocations || [],
              ordersCount: res.user.ordersCount ?? profile.ordersCount ?? 0,
              reviewsCount: res.user.reviewsCount ?? profile.reviewsCount ?? 0,
              points: res.user.points ?? profile.points ?? 0,
              isVisitor: false,
            });
            useFavoritesStore.getState().syncWithUserAccount(sessionEmail);
            useNotificationStore.getState().syncWithDb(sessionEmail);
          } else {
            updateProfile({
              name: session.user.name || session.user.email?.split("@")[0] || "Student",
              email: session.user.email || "",
              avatar: session.user.image || profile.avatar,
              role: "STUDENT",
              isVisitor: false,
            });
          }
        });
      }
    } else if (status === "unauthenticated") {
      // If unauthenticated on web app but store still has stale admin/vendor identity, reset to visitor
      if (
        profile.name === "Platform Super Admin" ||
        profile.email === "admin@campuslightson.com" ||
        profile.role === "ADMIN" ||
        profile.role === "VENDOR"
      ) {
        updateProfile({
          name: "Visitor",
          email: "",
          hostel: "",
          phone: "",
          avatar: "https://api.dicebear.com/7.x/adventurer/png?seed=Midnight&backgroundColor=ffd5dc",
          role: "STUDENT",
          isVisitor: true,
        });
      }
    }
  }, [session, status, updateProfile, setHasSeenOnboarding, profile.email, profile.name, profile.role, profile.isVisitor, profile.avatar]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionSync>{children}</SessionSync>
    </SessionProvider>
  );
}
