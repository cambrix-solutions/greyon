/** Display helpers for dates and hotel check-in/out times. */

const DEFAULT_CHECK_IN_TIME = "14:00";
const DEFAULT_CHECK_OUT_TIME = "12:00";

export function parseYmd(value: string): Date | null {
  if (!value) return null;
  // Date-only YYYY-MM-DD → local midnight (avoid UTC shift)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y!, m! - 1, d!);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** e.g. Sat, 6 Sep 2026 */
export function formatDate(value: string, locale = "en-GB"): string {
  const d = parseYmd(value);
  if (!d) return value;
  return d.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

/** e.g. 6 Sep 2026, 14:32 */
export function formatDateTime(value: string, locale = "en-GB"): string {
  const d = parseYmd(value);
  if (!d) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDate(value, locale);
  }
  return d.toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

/** Normalize "14:00" / "2:00 PM" style strings for display. */
export function formatTime(value?: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(":");
    return `${h!.padStart(2, "0")}:${m}`;
  }
  return trimmed;
}

export function hotelCheckInTime(time?: string | null) {
  return formatTime(time) || DEFAULT_CHECK_IN_TIME;
}

export function hotelCheckOutTime(time?: string | null) {
  return formatTime(time) || DEFAULT_CHECK_OUT_TIME;
}

/** e.g. Sat, 6 Sep 2026 · 14:00 */
export function formatDateWithTime(
  date: string,
  time?: string | null,
  locale = "en-GB"
): string {
  const t = formatTime(time);
  return t ? `${formatDate(date, locale)} · ${t}` : formatDate(date, locale);
}

/** Stay range with hotel check-in / check-out times. */
export function formatStayRange(
  checkIn: string,
  checkOut: string,
  opts?: {
    checkInTime?: string | null | undefined;
    checkOutTime?: string | null | undefined;
  }
): string {
  const inPart = formatDateWithTime(
    checkIn,
    hotelCheckInTime(opts?.checkInTime)
  );
  const outPart = formatDateWithTime(
    checkOut,
    hotelCheckOutTime(opts?.checkOutTime)
  );
  return `${inPart} → ${outPart}`;
}

/** Local calendar YYYY-MM-DD (avoids UTC day-shift). */
export function toLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addLocalDays(dateStr: string, days: number): string {
  const d = parseYmd(dateStr) ?? new Date();
  d.setDate(d.getDate() + days);
  return toLocalYmd(d);
}

export function nightsBetweenLocal(checkIn: string, checkOut: string): number {
  const start = parseYmd(checkIn);
  const end = parseYmd(checkOut);
  if (!start || !end) return 0;
  return Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
}
