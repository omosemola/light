import { computeIsStoreOpen, formatTime12Hour } from "@/lib/storeSchedule";

export type StoreAvailabilityState =
  | "OPEN_AVAILABLE"
  | "OPEN_BUSY"
  | "OPEN_AWAY"
  | "SCHEDULE_CLOSED"
  | "MANUALLY_CLOSED";

export interface StoreAvailabilityResult {
  state: StoreAvailabilityState;
  label: string;
  badgeClass: string;
  dotClass: string;
  canAcceptOrders: boolean;
  scheduleMessage: string;
}

/**
 * Pure state machine resolver for store operating status.
 */
export function resolveStoreAvailability(store?: {
  isOpen?: boolean | null;
  availabilityStatus?: string | null;
  openingTime?: string | null;
  closingTime?: string | null;
}): StoreAvailabilityResult {
  if (!store || store.isOpen === false) {
    return {
      state: "MANUALLY_CLOSED",
      label: "Closed",
      badgeClass: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700",
      dotClass: "bg-slate-400",
      canAcceptOrders: false,
      scheduleMessage: "Store is currently closed.",
    };
  }

  const isScheduleOpen = computeIsStoreOpen({
    isOpen: store.isOpen ?? true,
    openingTime: store.openingTime,
    closingTime: store.closingTime,
  });

  if (!isScheduleOpen) {
    return {
      state: "SCHEDULE_CLOSED",
      label: "Closed (Off Schedule)",
      badgeClass: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900",
      dotClass: "bg-rose-500",
      canAcceptOrders: false,
      scheduleMessage: `Opens at ${formatTime12Hour(store.openingTime || "08:00")}.`,
    };
  }

  const rawStatus = (store.availabilityStatus || "AVAILABLE").toUpperCase();

  if (rawStatus === "BUSY") {
    return {
      state: "OPEN_BUSY",
      label: "Busy (High Demand)",
      badgeClass: "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      dotClass: "bg-amber-500",
      canAcceptOrders: true,
      scheduleMessage: "High order volume. Delivery may take slightly longer.",
    };
  }

  if (rawStatus === "AWAY") {
    return {
      state: "OPEN_AWAY",
      label: "Temporarily Away",
      badgeClass: "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      dotClass: "bg-purple-500",
      canAcceptOrders: true,
      scheduleMessage: "Merchant briefly stepping out. Orders will be queued.",
    };
  }

  if (rawStatus === "CLOSED") {
    return {
      state: "MANUALLY_CLOSED",
      label: "Closed",
      badgeClass: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700",
      dotClass: "bg-slate-400",
      canAcceptOrders: false,
      scheduleMessage: "Store closed for now.",
    };
  }

  return {
    state: "OPEN_AVAILABLE",
    label: "Open Now",
    badgeClass: "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
    canAcceptOrders: true,
    scheduleMessage: `Open until ${formatTime12Hour(store.closingTime || "22:00")}.`,
  };
}
