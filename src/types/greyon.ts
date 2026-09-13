export type ContentStatus = "draft" | "published" | "archived";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";
export type EnquiryStatus = "new" | "in_progress" | "closed";

/**
 * Access roles:
 * - developer: platform owner — feature packages + everything
 * - org_admin: client full admin (all paid features)
 * - location_admin: scoped to assigned locationIds
 * - hotel_admin: scoped to assigned hotelIds
 * - customer: guest account (no admin modules)
 * Legacy presets: super_admin, content_admin, booking_admin
 */
export type AdminRole =
  | "developer"
  | "org_admin"
  | "location_admin"
  | "hotel_admin"
  | "customer"
  | "super_admin"
  | "content_admin"
  | "booking_admin";

export type FeatureCategory = "admin" | "public";

/** Paid / enabled product capability — catalog row (public site uses active/default package) */
export interface ProductFeature {
  id: string;
  key: string;
  label: string;
  description: string;
  category: FeatureCategory;
  /** Derived from site default package (activePackageId) for public gating */
  enabled: boolean;
  /** Billing hint in catalog */
  paidAddOn: boolean;
}

/** Customizable user package (user_package) — owns role + features */
export interface ProductPackage {
  id: string;
  name: string;
  description: string;
  /** Optional price / plan note shown in admin */
  priceNote: string;
  /**
   * The single role this package grants.
   * Users do not store role — they inherit it from their package.
   */
  role: AdminRole;
  /** Modules unlocked by this package */
  featureKeys: string[];
  /** Seed presets cannot be deleted */
  isSystem?: boolean;
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

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  /**
   * FK to user_package — role + features come from this package only.
   * Do not store role on the user.
   */
  packageId: string;
  /** When package.role is location_admin: assigned destinations */
  locationIds?: string[];
  /** When package.role is hotel_admin: assigned properties */
  hotelIds?: string[];
}
