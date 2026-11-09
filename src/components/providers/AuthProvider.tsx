"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useUserStore } from "@/lib/userStore";
import { prefetchUserData } from "@/lib/prefetchUserData";
import { resolveAuthRole } from "@/lib/machines/authMachine";

function SessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { updateProfile, setHasSeenOnboarding, profile } = useUserStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user && session.user.email) {
      setHasSeenOnboarding(true);
      const sessionEmail = session.user.email.trim().toLowerCase();
      const currentEmail = profile.email?.trim().toLowerCase();
      const role = resolveAuthRole(sessionEmail, profile.role, profile.name);

      // If user is authenticated via NextAuth/Google, pre-fetch full profile, avatar image, and data
      if (
        currentEmail !== sessionEmail ||
        profile.name === "Platform Super Admin" ||
        role === "ADMIN" ||
        profile.isVisitor ||
        !profile.hostel ||
        !profile.avatar
      ) {
        prefetchUserData(sessionEmail);
      }
    } else if (status === "unauthenticated") {
      // If unauthenticated on web app but store still has stale admin/vendor identity, reset to clean student
      const role = resolveAuthRole(profile.email, profile.role, profile.name);
      if (role === "ADMIN" || role === "VENDOR") {
        updateProfile({
          name: "",
          email: "",
          hostel: "",
          phone: "",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
          role: "STUDENT",
          isVisitor: false,
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
