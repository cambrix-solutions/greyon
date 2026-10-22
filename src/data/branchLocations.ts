/**
 * Contact-page branch pins.
 *
 * Coordinates and Google Maps links come from the client. Catalog destinations
 * are matched by name or slug — do not add places that are not in this list.
 */
export type BranchKey = "phnom-penh" | "sihanoukville" | "kampot";

export type BranchLocation = {
  key: BranchKey;
  /** Lowercase name/slug aliases used to match a catalog destination. */
  aliases: readonly string[];
  city: string;
  /** Property name from the client's Google Maps listing. */
  placeName: string;
  lat: number;
  lng: number;
  mapsUrl: string;
};

export const BRANCH_LOCATIONS: readonly BranchLocation[] = [
  {
    key: "phnom-penh",
    aliases: ["phnom-penh", "phnom penh"],
    city: "Phnom Penh",
    placeName: "Greyon Serviced Apartment - Tuol Tom Poung II",
    lat: 11.5399542,
    lng: 104.9108457,
    mapsUrl: "https://maps.app.goo.gl/QxV2DSzBfwmpKQbj7"
  },
  {
    key: "sihanoukville",
    aliases: [
      "sihanoukville",
      "sihanouk ville",
      "sihanouk-ville",
      "kampong som",
      "kampong-som"
    ],
    city: "Sihanoukville",
    placeName: "Greyon Serviced Apartment Sihanouk Ville",
    lat: 10.6253316,
    lng: 103.5162819,
    mapsUrl: "https://maps.app.goo.gl/7UxZtkTRBMu3rdeo6"
  },
  {
    key: "kampot",
    aliases: ["kampot"],
    city: "Kampot",
    placeName: "Greyon Boutique Kampot",
    lat: 10.6135445,
    lng: 104.1710821,
    mapsUrl: "https://maps.app.goo.gl/6w35nbDJxwwN7C5LA"
  }
];

const DEFAULT_BRANCH_KEY: BranchKey = "phnom-penh";

export function defaultBranchLocation(): BranchLocation {
  return (
    BRANCH_LOCATIONS.find(branch => branch.key === DEFAULT_BRANCH_KEY) ??
    BRANCH_LOCATIONS[0]!
  );
}

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Match a catalog destination to a known branch by name or slug.
 * Returns null when the destination is not one of the configured branches.
 */
export function matchBranchLocation(
  name: string | null | undefined,
  slug: string | null | undefined
): BranchLocation | null {
  const normalizedName = normalizeLabel(name ?? "");
  const normalizedSlug = normalizeLabel(slug ?? "");
  const rawSlug = (slug ?? "").trim().toLowerCase();
  if (!normalizedName && !normalizedSlug && !rawSlug) return null;

  for (const branch of BRANCH_LOCATIONS) {
    for (const alias of branch.aliases) {
      const normalizedAlias = normalizeLabel(alias);
      const aliasSlug = alias.trim().toLowerCase();
      const exact =
        normalizedName === normalizedAlias ||
        normalizedSlug === normalizedAlias ||
        rawSlug === aliasSlug;
      const contained =
        normalizedAlias.length >= 5 &&
        (normalizedName.includes(normalizedAlias) ||
          normalizedSlug.includes(normalizedAlias));
      if (exact || contained) return branch;
    }
  }

  return null;
}
