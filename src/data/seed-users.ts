import type { AdminUser, UserPackage } from "@/types/greyon";

/**
 * Users hold no role/package columns — only scope.
 * Packages are linked via userPackages (many-to-many).
 */
export const seedUsers: AdminUser[] = [
  {
    id: "usr-dev",
    name: "Greyon Developer",
    email: "dev@greyon.com.kh"
  },
  {
    id: "usr-admin",
    name: "Sovann Meas",
    email: "admin@greyon.com.kh"
  },
  {
    id: "usr-mgr-pp",
    name: "Phnom Penh Manager",
    email: "pp@greyon.com.kh",
    locationIds: ["loc-pp"]
  },
  {
    id: "usr-mgr-sr",
    name: "Siem Reap Manager",
    email: "sr@greyon.com.kh",
    locationIds: ["loc-sr"]
  },
  {
    id: "usr-hotel-angkor",
    name: "Angkor Front Desk",
    email: "angkor@greyon.com.kh",
    hotelIds: ["htl-angkor"]
  },
  {
    id: "usr-hotel-riverside",
    name: "Riverside Front Desk",
    email: "hotel@greyon.com.kh",
    hotelIds: ["htl-riverside"]
  },
  {
    id: "usr-guest",
    name: "Guest Customer",
    email: "guest@example.com"
  }
];

/** M2M: user ↔ package (developer assigns; users cannot) */
export const seedUserPackages: UserPackage[] = [
  { id: "up-dev", userId: "usr-dev", packageId: "pkg-developer" },
  { id: "up-admin", userId: "usr-admin", packageId: "pkg-admin-full" },
  { id: "up-pp", userId: "usr-mgr-pp", packageId: "pkg-manager-booking" },
  { id: "up-sr", userId: "usr-mgr-sr", packageId: "pkg-manager-content" },
  { id: "up-angkor", userId: "usr-hotel-angkor", packageId: "pkg-hotel-booking" },
  { id: "up-riverside", userId: "usr-hotel-riverside", packageId: "pkg-hotel-core" },
  { id: "up-guest", userId: "usr-guest", packageId: "pkg-customer" }
];

export const USERS_SEED_REV = 6;
