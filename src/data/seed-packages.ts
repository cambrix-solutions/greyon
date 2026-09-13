import type { AdminRole, ProductPackage } from "@/types/greyon";

const ALWAYS = ["features", "dashboard"] as const;

const CORE_KEYS = [
  ...ALWAYS,
  "hotels",
  "rooms",
  "locations",
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

/** Roles that can be set on a sellable package (developer is platform seat) */
export const PACKAGE_CLIENT_ROLES: AdminRole[] = [
  "org_admin",
  "location_admin",
  "hotel_admin",
  "content_admin",
  "booking_admin",
  "customer"
];

/**
 * Each package is a seat: one role + feature set.
 * Users only store packageId — role is never on the user.
 */
export const seedPackages: ProductPackage[] = [
  {
    id: "pkg-developer",
    name: "Platform Developer",
    description: "Greyon platform seat — full access including User packages.",
    priceNote: "Internal",
    role: "developer",
    featureKeys: [...FULL_KEYS],
    isSystem: true
  },
  {
    id: "pkg-org-full",
    name: "Org Admin · Full suite",
    description: "Enterprise org owner — all modules except package builder.",
    priceNote: "Enterprise",
    role: "org_admin",
    featureKeys: [...FULL_KEYS],
    isSystem: true
  },
  {
    id: "pkg-loc-booking",
    name: "Location Admin · Booking Pro",
    description: "Destination manager with rates & bookings.",
    priceNote: "Pro",
    role: "location_admin",
    featureKeys: [...BOOKING_KEYS],
    isSystem: true
  },
  {
    id: "pkg-loc-content",
    name: "Location Admin · Content+",
    description: "Destination manager with news CMS (no rates).",
    priceNote: "Mid",
    role: "location_admin",
    featureKeys: [...CONTENT_KEYS],
    isSystem: true
  },
  {
    id: "pkg-hotel-booking",
    name: "Hotel Admin · Booking Pro",
    description: "Property front desk with rates calendar.",
    priceNote: "Pro",
    role: "hotel_admin",
    featureKeys: [...BOOKING_KEYS],
    isSystem: true
  },
  {
    id: "pkg-hotel-core",
    name: "Hotel Admin · Core",
    description: "Property front desk on the starter feature set.",
    priceNote: "Starter",
    role: "hotel_admin",
    featureKeys: [...CORE_KEYS],
    isSystem: true
  },
  {
    id: "pkg-content-admin",
    name: "Content Admin · Content+",
    description: "Editorial seat for hotels, locations, and news.",
    priceNote: "Mid",
    role: "content_admin",
    featureKeys: [...CONTENT_KEYS],
    isSystem: true
  },
  {
    id: "pkg-booking-admin",
    name: "Booking Admin · Booking Pro",
    description: "Reservations & rates operations seat.",
    priceNote: "Pro",
    role: "booking_admin",
    featureKeys: [...BOOKING_KEYS],
    isSystem: true
  },
  {
    id: "pkg-customer",
    name: "Customer · Core",
    description: "Guest account — public site only, no admin.",
    priceNote: "Free",
    role: "customer",
    featureKeys: ["booking_public", "contact_public", "news_public"],
    isSystem: true
  }
];

/** Site default package for public feature catalog */
export const DEFAULT_ACTIVE_PACKAGE_ID = "pkg-org-full";
