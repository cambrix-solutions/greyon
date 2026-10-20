import type { Hotel } from "@/types/greyon";

/** Classify CMS propertyType for header Hotel / Apartment menus. */
export function isApartmentProperty(hotel: Hotel): boolean {
  const t = (hotel.propertyType ?? "").toLowerCase();
  return /\b(apartment|serviced|residence|condo)\b/.test(t);
}

export function isHotelProperty(hotel: Hotel): boolean {
  const t = (hotel.propertyType ?? "").toLowerCase();
  if (!t.trim()) return true;
  if (/\bhotel\b/.test(t)) return true;
  // Pure apartment listings stay out of the Hotel menu.
  return !isApartmentProperty(hotel);
}
