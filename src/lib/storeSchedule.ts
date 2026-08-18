/**
 * Store operating hours helper
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
