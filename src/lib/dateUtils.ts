import { formatInTimeZone } from "date-fns-tz"

// The whole app displays and filters dates in IST regardless of the viewer's device/browser
// timezone — plain date-fns `format()`/`toLocaleDateString()` use the *local* timezone, which
// silently drifts from what the backend computes (backend date-range filters are IST-aligned,
// see leadController.ts) whenever a viewer isn't physically in IST or their device clock/tz is off.
export const IST_TIMEZONE = "Asia/Kolkata"

export function formatIST(date: Date | string | number | null | undefined, formatStr: string, fallback = "-"): string {
  if (!date) return fallback
  try {
    return formatInTimeZone(new Date(date), IST_TIMEZONE, formatStr)
  } catch {
    return fallback
  }
}

// yyyy-MM-dd for the given instant's IST calendar day — use this instead of
// `format(new Date(), 'yyyy-MM-dd')` anywhere a date is sent to the backend as a day filter,
// so "today"/"yesterday" etc. match the IST day the backend actually filters on.
export function toISTDateString(date: Date | string | number = new Date()): string {
  return formatIST(date, "yyyy-MM-dd", "")
}

// A Date object whose LOCAL getters (getFullYear/getMonth/getDate/getDay/...) read back IST wall-clock
// values, for feeding into date-fns helpers (subDays/startOfWeek/startOfMonth/etc.) that only understand
// the environment's local timezone. Same trick already used in the backend's isUserAvailable() check.
export function getISTNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: IST_TIMEZONE }))
}
