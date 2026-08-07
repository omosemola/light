import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  name: string;
  email: string;
  hostel: string;
  phone: string;
  avatar: string;
  points: number;
  savedStoresCount: number;
  isVisitor?: boolean;
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
        name: "Alex John",
        email: "alex.johnson@gmail.com",
        hostel: "Main Campus (Mellanby Hall)",
        phone: "+234 812 345 6789",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        points: 450,
        savedStoresCount: 5,
      },
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
      updateProfile: (updated) =>
        set((state) => ({
          profile: { ...state.profile, ...updated },
        })),
      logoutUser: () => set({ hasSeenOnboarding: false }),
    }),
    {
      name: "campus-user-storage",
    }
  )
);
