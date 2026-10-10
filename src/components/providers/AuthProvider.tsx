"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useUserStore } from "@/lib/userStore";
import { prefetchUserData } from "@/lib/prefetchUserData";

function SessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { updateProfile, setHasSeenOnboarding, profile } = useUserStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user && session.user.email) {
      setHasSeenOnboarding(true);
      const sessionEmail = session.user.email.trim().toLowerCase();
      const currentEmail = profile.email?.trim().toLowerCase();

      // If user is authenticated via NextAuth/Google, pre-fetch full profile, avatar image, and data
      if (
        currentEmail !== sessionEmail ||
        profile.name === "Platform Super Admin" ||
        profile.role === "ADMIN" ||
        profile.isVisitor ||
        !profile.hostel ||
        !profile.avatar
      ) {
        prefetchUserData(sessionEmail);
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
