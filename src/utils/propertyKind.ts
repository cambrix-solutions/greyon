import type { Hotel } from "@/types/greyon";

/**
 * Public “Our Services” types. Matching uses `Hotel.propertyType` from the
 * engine when present. Compound values (e.g. "Hotel & Serviced Apartment") can
 * match more than one type. Boutique / Resort only match when those words
 * appear in propertyType — we do not invent labels from names or seed data.
 */
export type ServiceTypeSlug =
  | "serviced-apartment"
  | "apartel"
  | "boutique"
  | "resort";

export type ServiceTypeNavItem = {
  slug: ServiceTypeSlug;
  label: string;
  path: string;
};

export const SERVICE_TYPE_ITEMS: readonly ServiceTypeNavItem[] = [
  {
    slug: "serviced-apartment",
    label: "Serviced Apartment",
    path: "/services/serviced-apartment"
  },
  {
    slug: "apartel",
    label: "Apartel",
    path: "/services/apartel"
  },
  {
    slug: "boutique",
    label: "Boutique",
    path: "/services/boutique"
  },
  {
    slug: "resort",
    label: "Resort",
    path: "/services/resort"
  }
] as const;

export function serviceTypeLabel(slug: string): string {
  return SERVICE_TYPE_ITEMS.find(item => item.slug === slug)?.label ?? "Services";
}

export function isServiceTypeSlug(value: string): value is ServiceTypeSlug {
  return SERVICE_TYPE_ITEMS.some(item => item.slug === value);
}

function propertyTypeText(hotel: Hotel): string {
  return (hotel.propertyType ?? "").toLowerCase();
}

/** Classify CMS propertyType for legacy Hotel / Apartment helpers. */
export function isApartmentProperty(hotel: Hotel): boolean {
  const t = propertyTypeText(hotel);
  return /\b(apartment|serviced|residence|condo)\b/.test(t);
}

export function isHotelProperty(hotel: Hotel): boolean {
  const t = propertyTypeText(hotel);
  if (!t.trim()) return true;
  if (/\b(hotel|apartel)\b/.test(t)) return true;
  // Pure apartment listings stay out of the Apartel menu.
  return !isApartmentProperty(hotel);
}

/**
 * Whether a published property offers the given service type.
 *
 * Missing piece: if the engine leaves `propertyType` empty, only Apartel
 * receives the property (default). Boutique / Resort / Serviced Apartment
 * cannot be inferred from name or location alone.
 */
export function matchesServiceType(
  hotel: Hotel,
  slug: ServiceTypeSlug
): boolean {
  const t = propertyTypeText(hotel);
  switch (slug) {
    case "serviced-apartment":
      return /\b(serviced\s*apartment|apartment|serviced|residence|condo)\b/.test(
        t
      );
    case "boutique":
      return /\bboutique\b/.test(t);
    case "resort":
      return /\bresort\b/.test(t);
    case "apartel":
      if (/\b(apartel|hotel)\b/.test(t)) return true;
      return !t.trim();
    default:
      return false;
  }
}

export function filterByServiceType(
  hotels: Hotel[],
  slug: ServiceTypeSlug
): Hotel[] {
  return hotels
    .filter(hotel => matchesServiceType(hotel, slug))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
}
