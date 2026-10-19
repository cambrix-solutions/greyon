/** Curated amenity labels for admin multi-select + public icon chips. */
export const STANDARD_AMENITIES = [
  "Free Wi‑Fi",
  "Swimming pool",
  "Restaurant",
  "Breakfast included",
  "Spa",
  "Fitness center",
  "Parking",
  "River view",
  "Ocean view",
  "Garden",
  "Terrace / balcony",
  "Air conditioning",
  "Bicycle rental",
  "Tour desk",
  "Bar",
  "Mini bar",
  "Safe",
  "Living area",
  "Room service",
  "Laundry"
] as const;

export type StandardAmenity = (typeof STANDARD_AMENITIES)[number];
