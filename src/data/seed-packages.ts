import type { AdminRole, ProductPackage } from "@/types/greyon";

const ALWAYS = ["features", "dashboard"] as const;

const LOCATION_SUB = [
  "locations",
  "locations_list",
  "locations_managers",
  "locations_hotels",
  "locations_publish",
  "locations_seo"
] as const;

const CORE_KEYS = [
  ...ALWAYS,
  ...LOCATION_SUB,
  "hotels",
  "rooms",
  "bookings",
  "enquiries",
  "settings",
  "users",
  "booking_public",
  "contact_public"
];

const CONTENT_KEYS = [...CORE_KEYS, "news", "news_public"];

const BOOKING_KEYS = [...CONTENT_KEYS, "rates"];

const FULL_KEYS = [...BOOKING_KEYS, "media", "portfolios"];

export const FOUNDATION_ROLES: AdminRole[] = [
  "admin",
  "manager",
  "hotel_admin",
  "customer"
];

/**
 * Packages grant many roles + many features.
 * Developer assigns packages to users via user_package (M2M).
 */
export const seedPackages: ProductPackage[] = [
  {
    id: "pkg-developer",
    name: "Platform Developer",
    description: "Internal seat — all features and package builder.",
    priceNote: "Internal",
    roles: ["developer"],
    featureKeys: [...FULL_KEYS],
    isSystem: true
  },
  {
    id: "pkg-admin-full",
    name: "Admin · Full suite",
    description: "Org admin with full modules including location managers & hotels.",
    priceNote: "Enterprise",
    roles: ["admin"],
    featureKeys: [...FULL_KEYS],
    isSystem: true
  },
  {
    id: "pkg-manager-booking",
    name: "Manager · Booking Pro",
    description: "Location manager with rates — scoped to assigned destinations.",
    priceNote: "Pro",
    roles: ["manager"],
    featureKeys: [...BOOKING_KEYS],
    isSystem: true
  },
  {
    id: "pkg-manager-content",
    name: "Manager · Content+",
    description: "Location manager with news — no rates calendar.",
    priceNote: "Mid",
    roles: ["manager"],
    featureKeys: [...CONTENT_KEYS],
    isSystem: true
  },
  {
    id: "pkg-hotel-booking",
    name: "Hotel Admin · Booking Pro",
    description: "Property seat with rates — scoped to assigned hotels.",
    priceNote: "Pro",
    roles: ["hotel_admin"],
    featureKeys: [...BOOKING_KEYS],
    isSystem: true
  },
  {
    id: "pkg-hotel-core",
    name: "Hotel Admin · Core",
    description: "Property starter seat.",
    priceNote: "Starter",
    roles: ["hotel_admin"],
    featureKeys: [...CORE_KEYS],
    isSystem: true
  },
  {
    id: "pkg-ops-booking",
    name: "Ops · Booking + Admin",
    description: "Combo seat: admin + manager roles for multi-site ops.",
    priceNote: "Pro",
    roles: ["admin", "manager"],
    featureKeys: [...BOOKING_KEYS],
    isSystem: true
  },
  {
    id: "pkg-customer",
    name: "Customer",
    description: "Guest account — public site only.",
    priceNote: "Free",
    roles: ["customer"],
    featureKeys: ["booking_public", "contact_public", "news_public"],
    isSystem: true
  }
];

export const DEFAULT_ACTIVE_PACKAGE_ID = "pkg-admin-full";
export const PACKAGE_CLIENT_ROLES = FOUNDATION_ROLES;
