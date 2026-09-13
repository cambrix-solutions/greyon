import type { AdminUser } from "@/types/greyon";

/**
 * Demo users — only packageId (+ scope). Role comes from the package.
 */
export const seedUsers: AdminUser[] = [
  {
    id: "usr-dev",
    name: "Greyon Developer",
    email: "dev@greyon.com.kh",
    packageId: "pkg-developer"
  },
  {
    id: "usr-org-full",
    name: "Sovann Meas",
    email: "admin@greyon.com.kh",
    packageId: "pkg-org-full"
  },
  {
    id: "usr-loc-pp",
    name: "Phnom Penh Manager",
    email: "pp@greyon.com.kh",
    packageId: "pkg-loc-booking",
    locationIds: ["loc-pp"]
  },
  {
    id: "usr-loc-sr",
    name: "Siem Reap Manager",
    email: "sr@greyon.com.kh",
    packageId: "pkg-loc-content",
    locationIds: ["loc-sr"]
  },
  {
    id: "usr-hotel-angkor",
    name: "Angkor Front Desk",
    email: "angkor@greyon.com.kh",
    packageId: "pkg-hotel-booking",
    hotelIds: ["htl-angkor"]
  },
  {
    id: "usr-hotel-riverside",
    name: "Riverside Front Desk",
    email: "hotel@greyon.com.kh",
    packageId: "pkg-hotel-core",
    hotelIds: ["htl-riverside"]
  },
  {
    id: "usr-content",
    name: "Dara Chhim",
    email: "content@greyon.com.kh",
    packageId: "pkg-content-admin"
  },
  {
    id: "usr-booking",
    name: "Kanha Sok",
    email: "bookings@greyon.com.kh",
    packageId: "pkg-booking-admin"
  },
  {
    id: "usr-guest",
    name: "Guest Customer",
    email: "guest@example.com",
    packageId: "pkg-customer"
  }
];

/** Bump when package/user matrix redesigns — forces re-seed */
export const USERS_SEED_REV = 5;
