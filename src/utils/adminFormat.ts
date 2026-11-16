/** Small display helpers shared by the Guests / Reports / People admin screens. */

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric"
});

const shortDayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short"
});

function parse(value: string) {
  // Plain Y-m-d is a calendar date — read it as local, not UTC midnight.
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
}

/** "14 Nov 2026" */
export function formatDay(value: string | null | undefined) {
  if (!value) return "—";
  const d = parse(value);
  return Number.isNaN(d.getTime()) ? "—" : dayFormat.format(d);
}

/** "14 Nov" */
export function formatShortDay(value: string | null | undefined) {
  if (!value) return "—";
  const d = parse(value);
  return Number.isNaN(d.getTime()) ? "—" : shortDayFormat.format(d);
}

/** "$14,260" — whole dollars unless there are cents. */
export function formatMoney(value: number | null | undefined) {
  const n = Number(value ?? 0);
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2
  })}`;
}

/** "walk_in" → "Walk-in", "website" → "Website" */
export function formatSource(value: string | null | undefined) {
  const labels: Record<string, string> = {
    website: "Website",
    admin: "Staff",
    phone: "Phone",
    walk_in: "Walk-in",
    email: "Email",
    unknown: "Unknown"
  };
  const key = String(value ?? "unknown");
  return labels[key] ?? key.replaceAll("_", " ");
}

export function capitalise(value: string | null | undefined) {
  const s = String(value ?? "");
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}
