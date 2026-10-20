import type { LocationQuery, LocationQueryRaw } from "vue-router";
import type { BookingSearchParams } from "@/types/greyon";
import { isSpecialRateCode } from "@/data/specialRates";

/** Query keys shared by /booking and hotel discovery URLs. */
const KEYS = [
  "locationSlug",
  "hotelSlug",
  "checkIn",
  "checkOut",
  "rooms",
  "adults",
  "children",
  "specialRate",
  "promoCode"
] as const;

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

function asPositiveInt(value: unknown, fallback: number): number {
  const n = Number(asString(value));
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

/** Build router query from search params (omit empties / defaults). */
export function searchParamsToQuery(
  params: BookingSearchParams
): LocationQueryRaw {
  const q: LocationQueryRaw = {};
  if (params.locationSlug) q.locationSlug = params.locationSlug;
  if (params.hotelSlug) q.hotelSlug = params.hotelSlug;
  if (params.checkIn) q.checkIn = params.checkIn;
  if (params.checkOut) q.checkOut = params.checkOut;
  if (params.rooms > 0) q.rooms = String(params.rooms);
  if (params.adults > 0) q.adults = String(params.adults);
  q.children = String(params.children ?? 0);
  if (params.specialRate && params.specialRate !== "none") {
    q.specialRate = params.specialRate;
  }
  if (params.promoCode?.trim()) q.promoCode = params.promoCode.trim();
  return q;
}

/** Merge route query into a partial search update. */
export function searchParamsFromQuery(
  query: LocationQuery
): Partial<BookingSearchParams> {
  const partial: Partial<BookingSearchParams> = {};
  const locationSlug = asString(query.locationSlug);
  const hotelSlug = asString(query.hotelSlug);
  const checkIn = asString(query.checkIn);
  const checkOut = asString(query.checkOut);
  const specialRateRaw = asString(query.specialRate);
  const promoCode = asString(query.promoCode);

  if (locationSlug || "locationSlug" in query)
    partial.locationSlug = locationSlug;
  if (hotelSlug || "hotelSlug" in query) partial.hotelSlug = hotelSlug;
  if (checkIn) partial.checkIn = checkIn;
  if (checkOut) partial.checkOut = checkOut;
  if ("rooms" in query)
    partial.rooms = Math.max(1, asPositiveInt(query.rooms, 1));
  if ("adults" in query)
    partial.adults = Math.max(1, asPositiveInt(query.adults, 1));
  if ("children" in query)
    partial.children = Math.max(0, asPositiveInt(query.children, 0));
  if (isSpecialRateCode(specialRateRaw)) partial.specialRate = specialRateRaw;
  else if (specialRateRaw === "") partial.specialRate = "none";
  if (promoCode || "promoCode" in query) partial.promoCode = promoCode;

  // Ignore unknown keys; KEYS documents the contract for hotels/search + booking.
  void KEYS;
  return partial;
}

/** True when the query carries at least one search field we care about. */
export function queryHasSearchFields(query: LocationQuery): boolean {
  return KEYS.some(k => k in query && asString(query[k]) !== "");
}
