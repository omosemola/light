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
        hostel: "Mellanby Hall",
        addressDetail: "Block B, Room 14",
        phone: "+234 812 345 6789",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        points: 450,
        savedStoresCount: 5,
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
            hostel: "Campus Guest",
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
      name: "lightson-user-app-storage-v3",
    }
  )
);
