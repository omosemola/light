"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useUserStore, UserProfile } from "@/lib/userStore";

export type AuthRole = "STUDENT" | "VENDOR" | "ADMIN";

export type AuthMachineState =
  | {
      status: "INITIALIZING";
      isAuthenticated: false;
      role: null;
      profile: UserProfile | null;
      session: null;
    }
  | {
      status: "UNAUTHENTICATED";
      isAuthenticated: false;
      role: null;
      profile: UserProfile;
      session: null;
    }
  | {
      status: "AUTHENTICATED";
      isAuthenticated: true;
      role: AuthRole;
      profile: UserProfile;
      session: any;
    };

export function resolveAuthRole(email?: string | null, roleString?: string | null, name?: string | null): AuthRole {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanRole = (roleString || "").toUpperCase().trim();
  const cleanName = (name || "").trim();

  if (
    cleanRole === "ADMIN" ||
    cleanEmail === "lightmarketplace01@gmail.com" ||
    cleanEmail === "admin@campuslightson.com" ||
    cleanName === "Platform Super Admin"
  ) {
    return "ADMIN";
  }

  if (cleanRole === "VENDOR") {
    return "VENDOR";
  }

  return "STUDENT";
}

export function computeAuthState(
  session: any,
  sessionStatus: "loading" | "authenticated" | "unauthenticated",
  profile: UserProfile,
  isMounted: boolean
): AuthMachineState {
  if (!isMounted) {
    return {
      status: "INITIALIZING",
      isAuthenticated: false,
      role: null,
      profile: null,
      session: null,
    };
  }

  const hasNextAuth = sessionStatus === "authenticated" && Boolean(session?.user?.email);
  const hasLocalAccount = Boolean(profile?.email) && !profile?.isVisitor && profile?.email !== "visitor@light.app";

  // If session is still loading from NextAuth, but we already have an existing local profile account,
  // authenticate immediately to prevent UI flashes or onboarding leaks on page reload
  if (sessionStatus === "loading") {
    if (hasLocalAccount) {
      const role = resolveAuthRole(profile.email, profile.role, profile.name);
      return {
        status: "AUTHENTICATED",
        isAuthenticated: true,
        role,
        profile,
        session: null,
      };
    }
    return {
      status: "INITIALIZING",
      isAuthenticated: false,
      role: null,
      profile,
      session: null,
    };
  }

  if (hasNextAuth || hasLocalAccount) {
    const activeEmail = session?.user?.email || profile.email;
    const role = resolveAuthRole(activeEmail, profile.role, profile.name);

    return {
      status: "AUTHENTICATED",
      isAuthenticated: true,
      role,
      profile,
      session: session || null,
    };
  }

  return {
    status: "UNAUTHENTICATED",
    isAuthenticated: false,
    role: null,
    profile,
    session: null,
  };
}

/**
 * useAuthMachine()
 * Canonical, single-source-of-truth hook for user authentication,
 * identity lifecycle, and role state management across Lightson Marketplace.
 */
export function useAuthMachine() {
  const { data: session, status: sessionStatus } = useSession();
  const { profile, hasSeenOnboarding, updateProfile, setHasSeenOnboarding, logoutUser } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const state = useMemo(
    () => computeAuthState(session, sessionStatus, profile, isMounted),
    [session, sessionStatus, profile, isMounted]
  );

  return {
    state,
    status: state.status,
    role: state.role,
    isAuthenticated: state.isAuthenticated,
    isStudent: state.isAuthenticated && state.role === "STUDENT",
    isVendor: state.isAuthenticated && state.role === "VENDOR",
    isAdmin: state.isAuthenticated && state.role === "ADMIN",
    isReady: isMounted && state.status !== "INITIALIZING",
    profile,
    session,
    hasSeenOnboarding,
    updateProfile,
    setHasSeenOnboarding,
    logoutUser,
  };
}

