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
 * Supports daytime and overnight campus kitchen schedules
 */
export function computeIsStoreOpen(store: {
  isOpen?: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
}): boolean {
  if (store.isOpen === false) return false;
  if (!store.openingTime || !store.closingTime) return store.isOpen ?? true;

  try {
    const now = new Date();
    // Nigeria timezone UTC+1 (WAT)
    const currentHour = (now.getUTCHours() + 1) % 24;
    const currentMinute = now.getUTCMinutes();
    const currentTotalMins = currentHour * 60 + currentMinute;

    const [openH, openM] = store.openingTime.split(":").map(Number);
    const [closeH, closeM] = store.closingTime.split(":").map(Number);

    const openTotalMins = openH * 60 + (openM || 0);
    const closeTotalMins = closeH * 60 + (closeM || 0);

    if (openTotalMins <= closeTotalMins) {
      // Daytime schedule (e.g. 08:00 to 22:00)
      return currentTotalMins >= openTotalMins && currentTotalMins <= closeTotalMins;
    } else {
      // Overnight student kitchen schedule (e.g. 19:00 to 03:00)
      return currentTotalMins >= openTotalMins || currentTotalMins <= closeTotalMins;
    }
  } catch {
    return store.isOpen ?? true;
  }
}

/**
 * Returns user-friendly opening hours breakdown and status indicators
 */
export function getStoreScheduleStatus(store: {
  isOpen?: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
}) {
  const isOpenNow = computeIsStoreOpen(store);
  const openFormatted = formatTime12Hour(store.openingTime || "08:00");
  const closeFormatted = formatTime12Hour(store.closingTime || "22:00");
  const scheduleText = `${openFormatted} – ${closeFormatted}`;

  if (store.isOpen === false) {
    return {
      isOpen: false,
      isOpenNow: false,
      badgeText: "Temporarily Closed",
      statusSubtext: "This merchant is currently not accepting orders",
      scheduleText,
      openTimeFormatted: openFormatted,
      closeTimeFormatted: closeFormatted,
    };
  }

  if (isOpenNow) {
    return {
      isOpen: true,
      isOpenNow: true,
      badgeText: `Open Now • Closes at ${closeFormatted}`,
      statusSubtext: `Open today from ${scheduleText}`,
      scheduleText,
      openTimeFormatted: openFormatted,
      closeTimeFormatted: closeFormatted,
    };
  }

  return {
    isOpen: true,
    isOpenNow: false,
    badgeText: `Closed • Opens at ${openFormatted}`,
    statusSubtext: `Operating hours: ${scheduleText}`,
    scheduleText,
    openTimeFormatted: openFormatted,
    closeTimeFormatted: closeFormatted,
  };
}
