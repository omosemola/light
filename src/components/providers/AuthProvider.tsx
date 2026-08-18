"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useUserStore } from "@/lib/userStore";

function SessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { updateProfile, setHasSeenOnboarding, profile } = useUserStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user && session.user.email) {
      setHasSeenOnboarding(true);
      const sessionEmail = session.user.email.trim().toLowerCase();
      const currentEmail = profile.email?.trim().toLowerCase();

      // If user is authenticated via NextAuth/Google, sync the student's name, email, and avatar
      if (
        currentEmail !== sessionEmail ||
        profile.name === "Platform Super Admin" ||
        profile.role === "ADMIN" ||
        profile.isVisitor
      ) {
        updateProfile({
          name: session.user.name || session.user.email.split("@")[0],
          email: session.user.email,
          avatar: session.user.image || profile.avatar,
          role: "STUDENT",
          isVisitor: false,
        });
      }
    } else if (status === "unauthenticated") {
      // If unauthenticated on web app but store still has stale admin identity, reset to visitor
      if (profile.name === "Platform Super Admin" || profile.email === "admin@campuslightson.com") {
        updateProfile({
          name: "Campus Visitor",
          email: "",
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
