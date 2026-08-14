import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  name: string;
  email: string;
  hostel: string;
  addressDetail: string;
  phone: string;
  avatar: string;
  points: number;
  savedStoresCount: number;
  isVisitor?: boolean;
  role?: string;
}

interface UserState {
  profile: UserProfile;
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  logoutUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: {
        name: "Visitor",
        email: "",
        hostel: "",
        addressDetail: "",
        phone: "",
        avatar: "/visitor-avatar.png",
        points: 0,
        savedStoresCount: 0,
        isVisitor: true,
      },
      hasSeenOnboarding: true,
      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
      updateProfile: (updated) =>
        set((state) => ({
          profile: { ...state.profile, ...updated },
        })),
      logoutUser: () =>
        set({
          profile: {
            name: "Visitor",
            email: "",
            hostel: "",
            addressDetail: "",
            phone: "",
            avatar: "/visitor-avatar.png",
            points: 0,
            savedStoresCount: 0,
            isVisitor: true,
          },
          hasSeenOnboarding: true,
        }),
    }),
    {
      name: "lightson-user-app-storage-v4",
    }
  )
);
