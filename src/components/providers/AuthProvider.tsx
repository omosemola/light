"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useUserStore } from "@/lib/userStore";

function SessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { updateProfile, setHasSeenOnboarding, profile } = useUserStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setHasSeenOnboarding(true);
      if (session.user.email && (!profile.email || profile.isVisitor)) {
        updateProfile({
          name: session.user.name || session.user.email.split("@")[0],
          email: session.user.email,
          avatar: session.user.image || profile.avatar,
          isVisitor: false,
        });
      }
    }
  }, [session, status, updateProfile, setHasSeenOnboarding, profile.email, profile.isVisitor, profile.avatar]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionSync>{children}</SessionSync>
    </SessionProvider>
  );
}
