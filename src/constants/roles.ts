import type { AdminRole } from "@/types/greyon";

/** Client-facing roles assignable on packages (excludes developer). */
export const FOUNDATION_ROLES: AdminRole[] = [
  "admin",
  "manager",
  "hotel_admin",
  "customer"
];

export const PACKAGE_CLIENT_ROLES = FOUNDATION_ROLES;
