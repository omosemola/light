import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  getUserDbNotifications, 
  createDbNotification, 
  markDbNotificationRead, 
  markAllDbNotificationsRead, 
  deleteDbNotification, 
  clearAllDbNotifications 
} from "@/actions/notifications";

export interface AppNotification {
  id: string;
  userEmail: string;
  title: string;
  desc: string;
  type: "order" | "promo" | "account" | "system";
  time: string;
  createdAt: number;
  read: boolean;
  link?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  syncWithDb: (userEmail: string) => Promise<void>;
  addNotification: (notification: Omit<AppNotification, "id" | "createdAt" | "read">) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userEmail: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllForUser: (userEmail: string) => Promise<void>;
  ensureWelcomeNotification: (userEmail: string, userName?: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: "notif-welcome-demo",
          userEmail: "visitor@light.app",
          title: "Welcome to Lightson Campus! 🚀",
          desc: "Browse verified campus kitchens, stationery stores, and student provisions delivered directly to your hostel.",
          type: "account",
          time: "Just now",
          createdAt: Date.now() - 3600000,
          read: false,
        },
        {
          id: "notif-promo-demo",
          userEmail: "visitor@light.app",
          title: "Student Discount Perk 🎁",
          desc: "Enjoy seamless hostel deliveries and campus-exclusive pricing on all student meal combos.",
          type: "promo",
          time: "1 hour ago",
          createdAt: Date.now() - 7200000,
          read: false,
        },
      ],

      syncWithDb: async (userEmail: string) => {
        if (!userEmail || userEmail === "visitor@light.app") return;
        try {
          const res = await getUserDbNotifications(userEmail);
          if (res.success && res.notifications) {
            set((state) => {
              // Merge db notifications with state (db takes precedence for matching IDs)
              const dbNotifMap = new Map(res.notifications.map((n) => [n.id, n]));
              const nonUserNotifs = state.notifications.filter(
                (n) => n.userEmail?.toLowerCase() !== userEmail.toLowerCase()
              );
              return {
                notifications: [...res.notifications, ...nonUserNotifs],
              };
            });
          }
        } catch (e) {
          console.error("Error syncing notifications with db:", e);
        }
      },

      addNotification: async (notif) => {
        const tempId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newNotif: AppNotification = {
          ...notif,
          id: tempId,
          createdAt: Date.now(),
          read: false,
          time: notif.time || "Just now",
        };

        // Optimistically update local state
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
        }));

        // Persist to PostgreSQL database if it's a registered user
        if (notif.userEmail && notif.userEmail !== "visitor@light.app") {
          try {
            const dbRes = await createDbNotification({
              userEmail: notif.userEmail,
              title: notif.title,
              desc: notif.desc,
              type: notif.type,
              link: notif.link,
            });

            if (dbRes.success && dbRes.notification) {
              set((state) => ({
                notifications: state.notifications.map((n) =>
                  n.id === tempId ? { ...n, id: dbRes.notification.id } : n
                ),
              }));
            }
          } catch (e) {
            console.error("Database notification creation error:", e);
          }
        }
      },

      markAsRead: async (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));

        // Sync with db
        if (!id.startsWith("notif-welcome") && !id.startsWith("notif-promo")) {
          markDbNotificationRead(id).catch((e) => console.error("Db mark read error:", e));
        }
      },

      markAllAsRead: async (userEmail: string) => {
        const email = userEmail?.trim().toLowerCase() || "";
        set((state) => ({
          notifications: state.notifications.map((n) => {
            const notifEmail = n.userEmail?.trim().toLowerCase() || "";
            if (!email || notifEmail === email) {
              return { ...n, read: true };
            }
            return n;
          }),
        }));

        if (userEmail && userEmail !== "visitor@light.app") {
          markAllDbNotificationsRead(userEmail).catch((e) => console.error("Db mark all read error:", e));
        }
      },

      deleteNotification: async (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));

        if (!id.startsWith("notif-welcome") && !id.startsWith("notif-promo")) {
          deleteDbNotification(id).catch((e) => console.error("Db delete notification error:", e));
        }
      },

      clearAllForUser: async (userEmail: string) => {
        const email = userEmail?.trim().toLowerCase() || "";
        set((state) => ({
          notifications: state.notifications.filter((n) => {
            const notifEmail = n.userEmail?.trim().toLowerCase() || "";
            return email && notifEmail !== email;
          }),
        }));

        if (userEmail && userEmail !== "visitor@light.app") {
          clearAllDbNotifications(userEmail).catch((e) => console.error("Db clear all error:", e));
        }
      },

      ensureWelcomeNotification: async (userEmail: string, userName?: string) => {
        if (!userEmail || userEmail === "visitor@light.app") return;
        const normalized = userEmail.trim().toLowerCase();
        
        // First sync with database
        await get().syncWithDb(userEmail);

        const existing = get().notifications.filter(
          (n) => n.userEmail?.trim().toLowerCase() === normalized
        );

        if (existing.length === 0) {
          const firstName = userName ? userName.split(" ")[0] : "Student";
          
          await get().addNotification({
            userEmail: userEmail,
            title: `Welcome to Lightson, ${firstName}! 🎉`,
            desc: "Your campus account is active! Order hot meals, stationery, and hostel groceries directly to your room.",
            type: "account",
            time: "Just now",
          });

          await get().addNotification({
            userEmail: userEmail,
            title: "Campus Stores & Kitchens Live 🛍️",
            desc: "Explore verified kitchens and student shops. Real-time store fulfillment is now online.",
            type: "promo",
            time: "Just now",
          });
        }
      },
    }),
    {
      name: "lightson-notifications-storage-v2",
    }
  )
);
