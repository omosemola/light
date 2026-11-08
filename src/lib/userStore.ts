import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_STUDENT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80";
export const DEFAULT_VISITOR_CARTOON_AVATAR = DEFAULT_STUDENT_AVATAR;

export interface UserProfile {
  name: string;
  email: string;
  hostel: string;
  addressDetail: string;
  phone: string;
  avatar: string;
  points: number;
  savedStoresCount: number;
  savedLocations?: Array<{ id: string; title: string; address: string; isDefault: boolean }>;
  isVisitor?: boolean;
  role?: string;
  ordersCount?: number;
  reviewsCount?: number;
  storeId?: string;
  storeName?: string;
  twoFactorEnabled?: boolean;
  smsAlerts?: boolean;
  emailReceipts?: boolean;
  promoAlerts?: boolean;
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
        name: "",
        email: "",
        hostel: "",
        addressDetail: "",
        phone: "",
        avatar: DEFAULT_STUDENT_AVATAR,
        points: 0,
        savedStoresCount: 0,
        savedLocations: [],
        ordersCount: 0,
        reviewsCount: 0,
        isVisitor: false,
        role: "STUDENT",
        twoFactorEnabled: true,
        smsAlerts: true,
        emailReceipts: true,
        promoAlerts: false,
      },
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
      updateProfile: (updated) =>
        set((state) => ({
          profile: { ...state.profile, ...updated },
        })),
      logoutUser: () =>
        set({
          profile: {
            name: "",
            email: "",
            hostel: "",
            addressDetail: "",
            phone: "",
            avatar: DEFAULT_STUDENT_AVATAR,
            points: 0,
            savedStoresCount: 0,
            savedLocations: [],
            ordersCount: 0,
            reviewsCount: 0,
            isVisitor: false,
            role: "STUDENT",
            twoFactorEnabled: true,
            smsAlerts: true,
            emailReceipts: true,
            promoAlerts: false,
          },
          hasSeenOnboarding: false,
        }),
    }),
    {
      name: "lightson-user-app-storage-v11",
      version: 3,
      migrate: (persistedState: any) => {
        if (!persistedState || !persistedState.profile) {
          return {
            profile: {
              name: "",
              email: "",
              hostel: "",
              addressDetail: "",
              phone: "",
              avatar: DEFAULT_STUDENT_AVATAR,
              points: 0,
              savedStoresCount: 0,
              savedLocations: [],
              ordersCount: 0,
              reviewsCount: 0,
              isVisitor: false,
              role: "STUDENT",
              twoFactorEnabled: true,
              smsAlerts: true,
              emailReceipts: true,
              promoAlerts: false,
            },
            hasSeenOnboarding: false,
          };
        }
        return persistedState;
      },
    }
  )
);
