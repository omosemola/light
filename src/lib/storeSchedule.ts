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
 * Gets the current time in "HH:MM" format based on a timezone.
 * Defaults to "Africa/Lagos" for local operations.
 */
export function getCurrentTime(timezone = "Africa/Lagos"): string {
  try {
    const d = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(d);
    
    let h = parts.find(p => p.type === 'hour')?.value.padStart(2, '0') || "00";
    const m = parts.find(p => p.type === 'minute')?.value.padStart(2, '0') || "00";
    
    // Some implementations return "24" instead of "00"
    if (h === "24") h = "00";
    
    return `${h}:${m}`;
  } catch {
    // Fallback if timezone is invalid
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }
}

/**
 * Store operating hours helper
 * Determines if a store is dynamically open based on current time and manual pause switch.
 */
export function computeIsStoreOpen(store: {
  isOpen?: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
}): boolean {
  if (store.isOpen === false) return false; // Manually paused by merchant

  const openTime = store.openingTime || "08:00";
  const closeTime = store.closingTime || "22:00";
  const currentTime = getCurrentTime();

  if (closeTime < openTime) {
    // Overnight operation (e.g. 20:00 to 04:00)
    return currentTime >= openTime || currentTime <= closeTime;
  }
  
  // Standard operation (e.g. 08:00 to 22:00)
  return currentTime >= openTime && currentTime <= closeTime;
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
  const isOpenNow = computeIsStoreOpen(store);
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

  if (!isOpenNow) {
    return {
      isOpen: true,
      isOpenNow: false,
      badgeText: `Closed • Opens at ${openFormatted}`,
      statusSubtext: `Closed now • Hours: ${scheduleText}`,
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
