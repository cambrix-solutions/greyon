export type ContentStatus = "draft" | "published" | "archived";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";
export type EnquiryStatus = "new" | "in_progress" | "closed";

/**
 * Foundation roles:
 * - developer: platform owner (packages, all features)
 * - admin: client org admin (all hotels/locations in scope of package features)
 * - manager: location manager — assigned locationIds
 * - hotel_admin: property front desk — assigned hotelIds
 * - customer: guest (no admin)
 *
 * Legacy aliases normalize in the store.
 */
export type AdminRole =
  | "developer"
  | "admin"
  | "manager"
  | "hotel_admin"
  | "customer"
  // legacy → mapped on normalize
  | "org_admin"
  | "location_admin"
  | "super_admin"
  | "content_admin"
  | "booking_admin";

export type FeatureCategory = "admin" | "public";

/**
 * Product feature catalog.
 * Parent features unlock modules; nested permissions (parentKey set) live under a feature
 * e.g. locations → locations_list, locations_managers.
 */
export interface ProductFeature {
  id: string;
  key: string;
  label: string;
  description: string;
  category: FeatureCategory;
  /** Parent feature key — null/undefined = top-level feature/module */
  parentKey?: string | null;
  /** Derived from site default package for public gating */
  enabled: boolean;
  paidAddOn: boolean;
}

/**
 * Sellable package flow: roles (+ scope type) → features → permissions.
 * Property scope lists are assigned on Users. Only a developer assigns packages.
 */
export interface ProductPackage {
  id: string;
  name: string;
  description: string;
  priceNote: string;
  /** Roles this package grants (user may hold several via multiple packages) */
  roles: AdminRole[];
  /** Feature keys (modules) and permission keys (nested under features) */
  featureKeys: string[];
  isSystem?: boolean;
}

/** Join: users ↔ packages (many-to-many) */
export interface UserPackage {
  id: string;
  userId: string;
  packageId: string;
}

/**
 * User account — no role/package fields on the row.
 * Role + features come from user_package → package.
 * Scope (locationIds / hotelIds) is assigned by developer for manager / hotel_admin.
 */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  /** manager: destinations they manage */
  locationIds?: string[];
  /** hotel_admin: properties they manage */
  hotelIds?: string[];
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  description: string;
  heroImage: string;
  gallery: string[];
  highlights: string[];
  status: ContentStatus;
  seoTitle?: string;
  seoDescription?: string;
}

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  locationId: string;
  shortDescription: string;
  description: string;
  address: string;
  coordinates: { lat: number; lng: number };
  phone: string;
  email: string;
  heroImage: string;
  gallery: string[];
  amenities: string[];
  policies: string[];
  checkInTime: string;
  checkOutTime: string;
  featured?: boolean;
  status: ContentStatus;
  seoTitle?: string;
  seoDescription?: string;
}

export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  bedType: string;
  roomSize: string;
  maxAdults: number;
  maxChildren: number;
  maxGuests: number;
  amenities: string[];
  baseInventory: number;
  status: ContentStatus;
}

export interface RatePlan {
  id: string;
  roomTypeId: string;
  name: string;
  description: string;
  mealBenefit: string;
  cancellationPolicy: string;
  basePrice: number;
  taxPercent: number;
  serviceFeePercent: number;
  status: ContentStatus;
}

/** Per room-type / date inventory override */
export interface Availability {
  id: string;
  roomTypeId: string;
  date: string; // YYYY-MM-DD
  availableUnits: number;
  stopSell: boolean;
}

/** Per rate-plan / date price override */
export interface RateCalendar {
  id: string;
  ratePlanId: string;
  date: string; // YYYY-MM-DD
  price: number;
  minStay?: number;
  maxStay?: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  excerpt: string;
  body: string;
  publishedAt: string;
  status: ContentStatus;
  seoTitle?: string;
  seoDescription?: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
  status: EnquiryStatus;
  internalNotes?: string;
  createdAt: string;
}

export interface BookingGuest {
  fullName: string;
  email: string;
  phone: string;
  nationality?: string;
  specialRequests?: string;
}

export interface Booking {
  id: string;
  reference: string;
  hotelId: string;
  roomTypeId: string;
  ratePlanId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  guest: BookingGuest;
  subtotal: number;
  taxesFees: number;
  total: number;
  status: BookingStatus;
  source: "website" | "admin";
  createdAt: string;
  notes?: string;
  /** Present on my-bookings / detail payloads from engine */
  hotelName?: string;
  hotelSlug?: string;
  hotelHeroImage?: string;
  roomTypeName?: string;
  ratePlanName?: string;
}

export interface AvailabilityResult {
  hotel: Hotel;
  roomType: RoomType;
  ratePlan: RatePlan;
  nights: number;
  availableUnits: number;
  subtotal: number;
  taxesFees: number;
  total: number;
}

export interface BookingSearchParams {
  locationSlug: string;
  hotelSlug: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
}

