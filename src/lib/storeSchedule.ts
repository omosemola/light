/**
 * Formats 24h time "08:00" to "8:00 AM" or "22:00" to "10:00 PM"
 */
export function formatTime12Hour(timeStr?: string | null): string {
  if (!timeStr || !timeStr.includes(":")) return timeStr || "8:00 AM";
  try {
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr.padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
}

/**
 * Store operating hours helper
 */
export function computeIsStoreOpen(store: {
  isOpen?: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
}): boolean {
  return store.isOpen !== false;
}

/**
 * Returns user-friendly opening hours breakdown and status indicators
 */
export function getStoreScheduleStatus(store: {
  isOpen?: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
}) {
  const isStoreLive = store.isOpen !== false;
  const openFormatted = formatTime12Hour(store.openingTime || "08:00");
  const closeFormatted = formatTime12Hour(store.closingTime || "22:00");
  const scheduleText = `${openFormatted} – ${closeFormatted}`;

  if (!isStoreLive) {
    return {
      isOpen: false,
      isOpenNow: false,
      badgeText: "Closed • Paused by Merchant",
      statusSubtext: "This merchant is currently not taking orders",
      scheduleText,
      openTimeFormatted: openFormatted,
      closeTimeFormatted: closeFormatted,
    };
  }

  return {
    isOpen: true,
    isOpenNow: true,
    badgeText: `Open Now • Closes at ${closeFormatted}`,
    statusSubtext: `Active today • Hours: ${scheduleText}`,
    scheduleText,
    openTimeFormatted: openFormatted,
    closeTimeFormatted: closeFormatted,
  };
}
