import type { Hotel } from "@/types/greyon";
import { isApartmentProperty, isHotelProperty } from "@/utils/propertyKind";

export type ServiceNavItem = {
  id: string;
  slug: string;
  name: string;
  city: string;
  thumb: string;
};

const PLACEHOLDER_THUMB =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect fill="#F1F1F1" width="96" height="96"/>
      <rect x="28" y="36" width="40" height="28" rx="4" fill="#627063" opacity="0.35"/>
    </svg>`
  );

export function toServiceNavItem(
  hotel: Hotel,
  cityName: string | undefined
): ServiceNavItem {
  return {
    id: hotel.id,
    slug: hotel.slug,
    name: hotel.name,
    city: cityName?.trim() || hotel.area?.trim() || "Cambodia",
    thumb: hotel.heroImage?.trim() || PLACEHOLDER_THUMB
  };
}

/**
 * Hotels column: prefer hotel-classified properties; if classification yields
 * nothing but the catalog has published properties, fall back to the full list
 * so the drawer never looks empty while hotels exist.
 */
export function filterHotelServices(hotels: Hotel[]): Hotel[] {
  const classified = hotels.filter(h => isHotelProperty(h));
  const source = classified.length ? classified : hotels;
  return source.slice().sort((a, b) => a.name.localeCompare(b.name));
}

/** Apartments column: apartment-like propertyType only. */
export function filterApartmentServices(hotels: Hotel[]): Hotel[] {
  return hotels
    .filter(h => isApartmentProperty(h))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
}
