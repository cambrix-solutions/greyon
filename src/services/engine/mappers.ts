import type {
  AdminRole,
  AdminUser,
  Availability,
  AvailabilityResult,
  Booking,
  BookingGuest,
  BookingStatus,
  ContentStatus,
  Enquiry,
  EnquiryStatus,
  FeatureCategory,
  Hotel,
  Location,
  NewsArticle,
  ProductFeature,
  ProductPackage,
  RateCalendar,
  RatePlan,
  RoomType
} from "@/types/greyon";

/** Site SEO / contact settings (matches cms-store SiteSettings). */
export interface HeroSlide {
  src: string;
  alt: string;
}

export interface SiteSettings {
  siteName: string;
  defaultTitle: string;
  defaultDescription: string;
  ogImage: string;
  heroSlides: HeroSlide[];
  analyticsId: string;
  contactEmail: string;
  contactPhone: string;
  siteUrl: string;
  paymentEnabled: boolean;
  paymentNote: string;
}

export interface MediaItem {
  id: string;
  src: string;
  alt: string;
  createdAt: string;
}

/** greyon-engine AdminResource package entry */
export interface EngineAdminPackage {
  id: number | string;
  name: string;
  roles: Array<{
    id: number | string;
    name: string;
    description?: string | null;
    isGlobal?: boolean;
    scope?: "none" | "location" | "hotel" | string;
  }>;
  featureKeys: string[];
  /** Location sub-keys etc. — SPA treats these like featureKeys for can() */
  permissionKeys?: string[];
  locationIds: Array<number | string>;
  hotelIds: Array<number | string>;
}

export interface EngineAdmin {
  id: number | string;
  name: string;
  email: string;
  status: string;
  packages?: EngineAdminPackage[];
}

export interface EngineDeveloper {
  id: number | string;
  name: string;
  email: string;
  status: string;
}

export interface EngineLocation {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
  heroImage?: string | null;
  gallery?: string[];
  highlights?: string[];
  status: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  hotelCount?: number;
}

export interface EngineHotel {
  id: number | string;
  locationId: number | string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  address?: string | null;
  coordinates?: { lat: number | null; lng: number | null };
  mapEmbedUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  heroImage?: string | null;
  gallery?: string[];
  amenities?: string[];
  policies?: string[];
  checkInTime?: string | null;
  checkOutTime?: string | null;
  featured?: boolean;
  status: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

const knownRoles = new Set<string>([
  "developer",
  "admin",
  "manager",
  "hotel_admin",
  "customer",
  "org_admin",
  "location_admin",
  "super_admin",
  "content_admin",
  "booking_admin"
]);

function asAdminRole(name: string): AdminRole | null {
  return knownRoles.has(name) ? (name as AdminRole) : null;
}

function asStatus(value: string | undefined): ContentStatus {
  if (value === "published" || value === "draft" || value === "archived") {
    return value;
  }
  return "draft";
}

export function mapEngineAdminToUser(admin: EngineAdmin): {
  user: AdminUser;
  roles: AdminRole[];
  featureKeys: string[];
} {
  const packages = admin.packages ?? [];
  const roleSet = new Set<AdminRole>();
  const featureSet = new Set<string>();
  const locationIds = new Set<string>();
  const hotelIds = new Set<string>();

  for (const pkg of packages) {
    for (const role of pkg.roles ?? []) {
      const mapped = asAdminRole(role.name);
      if (mapped) roleSet.add(mapped);
    }
    for (const key of pkg.featureKeys ?? []) featureSet.add(key);
    for (const key of pkg.permissionKeys ?? []) featureSet.add(key);
    for (const id of pkg.locationIds ?? []) locationIds.add(String(id));
    for (const id of pkg.hotelIds ?? []) hotelIds.add(String(id));
  }

  // Platform developers authenticate on a separate guard — treat as full admin seat.
  if (!packages.length && !roleSet.size) {
    // leave empty; caller may mark developer separately
  }

  const user: AdminUser = {
    id: String(admin.id),
    name: admin.name,
    email: admin.email,
    locationIds: [...locationIds],
    hotelIds: [...hotelIds]
  };

  return {
    user,
    roles: [...roleSet],
    featureKeys: [...featureSet]
  };
}

export function mapEngineDeveloperToUser(dev: EngineDeveloper): {
  user: AdminUser;
  roles: AdminRole[];
  featureKeys: string[];
} {
  return {
    user: {
      id: String(dev.id),
      name: dev.name,
      email: dev.email
    },
    roles: ["developer"],
    featureKeys: []
  };
}

export function mapEngineLocation(row: EngineLocation): Location {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    heroImage: row.heroImage ?? "",
    gallery: row.gallery ?? [],
    highlights: row.highlights ?? [],
    status: asStatus(row.status),
    ...(row.seoTitle ? { seoTitle: row.seoTitle } : {}),
    ...(row.seoDescription ? { seoDescription: row.seoDescription } : {})
  };
}

export function mapEngineHotel(row: EngineHotel): Hotel {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    locationId: String(row.locationId),
    shortDescription: row.shortDescription ?? "",
    description: row.description ?? "",
    address: row.address ?? "",
    coordinates: {
      lat: row.coordinates?.lat ?? 0,
      lng: row.coordinates?.lng ?? 0
    },
    ...(row.mapEmbedUrl ? { mapEmbedUrl: row.mapEmbedUrl } : {}),
    phone: row.phone ?? "",
    email: row.email ?? "",
    heroImage: row.heroImage ?? "",
    gallery: row.gallery ?? [],
    amenities: row.amenities ?? [],
    policies: row.policies ?? [],
    checkInTime: row.checkInTime ?? "",
    checkOutTime: row.checkOutTime ?? "",
    featured: Boolean(row.featured),
    status: asStatus(row.status),
    ...(row.seoTitle ? { seoTitle: row.seoTitle } : {}),
    ...(row.seoDescription ? { seoDescription: row.seoDescription } : {})
  };
}

export interface EngineRoomType {
  id: number | string;
  hotelId: number | string;
  name: string;
  slug: string;
  description?: string | null;
  images?: string[];
  bedType?: string | null;
  roomSize?: string | null;
  maxAdults?: number | null;
  maxChildren?: number | null;
  maxGuests?: number | null;
  amenities?: string[];
  baseInventory?: number | null;
  status: string;
}

export interface EngineRatePlan {
  id: number | string;
  roomTypeId: number | string;
  name: string;
  description?: string | null;
  mealBenefit?: string | null;
  cancellationPolicy?: string | null;
  basePrice?: number | null;
  taxPercent?: number | null;
  serviceFeePercent?: number | null;
  status: string;
}

export function mapEngineRoomType(row: EngineRoomType): RoomType {
  return {
    id: String(row.id),
    hotelId: String(row.hotelId),
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    images: row.images ?? [],
    bedType: row.bedType ?? "",
    roomSize: row.roomSize ?? "",
    maxAdults: row.maxAdults ?? 2,
    maxChildren: row.maxChildren ?? 0,
    maxGuests: row.maxGuests ?? 2,
    amenities: row.amenities ?? [],
    baseInventory: row.baseInventory ?? 0,
    status: asStatus(row.status)
  };
}

export function mapEngineRatePlan(row: EngineRatePlan): RatePlan {
  return {
    id: String(row.id),
    roomTypeId: String(row.roomTypeId),
    name: row.name,
    description: row.description ?? "",
    mealBenefit: row.mealBenefit ?? "",
    cancellationPolicy: row.cancellationPolicy ?? "",
    basePrice: Number(row.basePrice ?? 0),
    taxPercent: Number(row.taxPercent ?? 0),
    serviceFeePercent: Number(row.serviceFeePercent ?? 0),
    status: asStatus(row.status)
  };
}

export interface EngineNews {
  id: number | string;
  title: string;
  slug: string;
  coverImage?: string | null;
  excerpt?: string | null;
  body?: string | null;
  publishedAt?: string | null;
  status: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface EngineBooking {
  id: number | string;
  reference: string;
  hotelId: number | string;
  roomTypeId: number | string;
  ratePlanId: number | string;
  hotel?: {
    id?: number | string;
    name?: string;
    slug?: string;
    heroImage?: string | null;
  };
  roomType?: { id?: number | string; name?: string };
  ratePlan?: { id?: number | string; name?: string };
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  guest?: {
    fullName?: string;
    email?: string;
    phone?: string;
    specialRequests?: string;
  };
  guestFullName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string | null;
  subtotal?: number | null;
  taxesFees?: number | null;
  total?: number | null;
  status: string;
  source?: string;
  notes?: string | null;
  createdAt?: string | null;
}

export interface EngineEnquiry {
  id: number | string;
  locationId?: number | string | null;
  location?: { id: number | string; name: string; slug?: string } | null;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  consent?: boolean;
  status: string;
  internalNotes?: string | null;
  createdAt?: string | null;
}

export interface EngineAvailability {
  id: number | string;
  roomTypeId: number | string;
  date: string;
  availableUnits: number;
  stopSell?: boolean;
}

export interface EngineRateCalendar {
  id: number | string;
  ratePlanId: number | string;
  date: string;
  price?: number | null;
  minStay?: number | null;
  maxStay?: number | null;
}

export interface EngineMediaItem {
  id: number | string;
  src: string;
  alt?: string | null;
  createdAt?: string | null;
}

export interface EngineSiteSettings {
  id?: number | string;
  siteName?: string | null;
  defaultTitle?: string | null;
  defaultDescription?: string | null;
  ogImage?: string | null;
  heroSlides?: Array<{ src?: string | null; alt?: string | null }> | null;
  analyticsId?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  siteUrl?: string | null;
  paymentEnabled?: boolean;
  paymentNote?: string | null;
}

export interface EnginePermission {
  id: number | string;
  key: string;
  label: string;
  description?: string | null;
  featureKey?: string | null;
  sortOrder?: number;
}

export interface EngineFeature {
  id: number | string;
  key: string;
  label: string;
  description?: string | null;
  category?: string;
  sortOrder?: number;
  permissions?: EnginePermission[];
}

export interface EngineRole {
  id: number | string;
  name: string;
  description?: string | null;
  isGlobal?: boolean;
  scope?: "none" | "location" | "hotel" | string;
}

export interface EnginePackageRole {
  id?: number | string;
  name: string;
  description?: string | null;
  isGlobal?: boolean;
  scope?: string;
}

export interface EnginePackage {
  id: number | string;
  name: string;
  description?: string | null;
  priceNote?: string | null;
  isSystem?: boolean;
  roles?: EnginePackageRole[];
  featureKeys?: string[];
  permissionKeys?: string[];
}

export interface EngineAvailabilityResult {
  hotel: EngineHotel;
  roomType: EngineRoomType;
  ratePlan: EngineRatePlan;
  nights: number;
  availableUnits: number;
  subtotal: number;
  taxesFees: number;
  total: number;
}

function asBookingStatus(value: string | undefined): BookingStatus {
  if (
    value === "pending" ||
    value === "confirmed" ||
    value === "cancelled" ||
    value === "completed"
  ) {
    return value;
  }
  return "pending";
}

function asEnquiryStatus(value: string | undefined): EnquiryStatus {
  if (value === "new" || value === "in_progress" || value === "closed") {
    return value;
  }
  return "new";
}

function asFeatureCategory(value: string | undefined): FeatureCategory {
  return value === "public" ? "public" : "admin";
}

export function mapEngineNews(row: EngineNews): NewsArticle {
  return {
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    coverImage: row.coverImage ?? "",
    excerpt: row.excerpt ?? "",
    body: row.body ?? "",
    publishedAt: row.publishedAt ?? "",
    status: asStatus(row.status),
    ...(row.seoTitle ? { seoTitle: row.seoTitle } : {}),
    ...(row.seoDescription ? { seoDescription: row.seoDescription } : {})
  };
}

export function mapEngineBooking(row: EngineBooking): Booking {
  const guest: BookingGuest = {
    fullName: row.guest?.fullName ?? row.guestFullName ?? "",
    email: row.guest?.email ?? row.guestEmail ?? "",
    phone: row.guest?.phone ?? row.guestPhone ?? ""
  };
  const special =
    row.guest?.specialRequests || row.specialRequests || undefined;
  if (special) guest.specialRequests = special;

  const booking: Booking = {
    id: String(row.id),
    reference: row.reference,
    hotelId: String(row.hotelId),
    roomTypeId: String(row.roomTypeId),
    ratePlanId: String(row.ratePlanId),
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    rooms: Number(row.rooms ?? 1),
    adults: Number(row.adults ?? 1),
    children: Number(row.children ?? 0),
    guest,
    subtotal: Number(row.subtotal ?? 0),
    taxesFees: Number(row.taxesFees ?? 0),
    total: Number(row.total ?? 0),
    status: asBookingStatus(row.status),
    source: row.source === "admin" ? "admin" : "website",
    createdAt: row.createdAt ?? new Date().toISOString()
  };
  if (row.notes) booking.notes = row.notes;
  if (row.hotel?.name) booking.hotelName = row.hotel.name;
  if (row.hotel?.slug) booking.hotelSlug = row.hotel.slug;
  if (row.hotel?.heroImage) booking.hotelHeroImage = row.hotel.heroImage;
  if (row.roomType?.name) booking.roomTypeName = row.roomType.name;
  if (row.ratePlan?.name) booking.ratePlanName = row.ratePlan.name;
  return booking;
}

export function mapEngineEnquiry(row: EngineEnquiry): Enquiry {
  return {
    id: String(row.id),
    ...(row.locationId != null
      ? { locationId: String(row.locationId) }
      : {}),
    ...(row.location?.name ? { locationName: row.location.name } : {}),
    name: row.name,
    email: row.email,
    phone: row.phone ?? "",
    subject: row.subject,
    message: row.message,
    consent: Boolean(row.consent),
    status: asEnquiryStatus(row.status),
    internalNotes: row.internalNotes ?? "",
    createdAt: row.createdAt ?? new Date().toISOString()
  };
}

export function mapEngineAvailability(row: EngineAvailability): Availability {
  return {
    id: String(row.id),
    roomTypeId: String(row.roomTypeId),
    date: row.date,
    availableUnits: Number(row.availableUnits ?? 0),
    stopSell: Boolean(row.stopSell)
  };
}

export function mapEngineRateCalendar(row: EngineRateCalendar): RateCalendar {
  const mapped: RateCalendar = {
    id: String(row.id),
    ratePlanId: String(row.ratePlanId),
    date: row.date,
    price: Number(row.price ?? 0)
  };
  if (row.minStay != null) mapped.minStay = row.minStay;
  if (row.maxStay != null) mapped.maxStay = row.maxStay;
  return mapped;
}

export function mapEngineMedia(row: EngineMediaItem): MediaItem {
  return {
    id: String(row.id),
    src: row.src,
    alt: row.alt ?? "",
    createdAt: row.createdAt ?? new Date().toISOString()
  };
}

export function mapEngineSettings(
  row: EngineSiteSettings | null | undefined,
  fallback: SiteSettings
): SiteSettings {
  if (!row) return { ...fallback, heroSlides: [...fallback.heroSlides] };
  const slides = Array.isArray(row.heroSlides)
    ? row.heroSlides
        .filter((s): s is { src: string; alt?: string | null } =>
          Boolean(s && typeof s.src === "string" && s.src.trim())
        )
        .map(s => ({
          src: s.src.trim(),
          alt: (s.alt ?? "").trim()
        }))
    : fallback.heroSlides;
  return {
    siteName: row.siteName ?? fallback.siteName,
    defaultTitle: row.defaultTitle ?? fallback.defaultTitle,
    defaultDescription: row.defaultDescription ?? fallback.defaultDescription,
    ogImage: row.ogImage ?? fallback.ogImage,
    heroSlides: slides.length ? slides : [...fallback.heroSlides],
    analyticsId: row.analyticsId ?? fallback.analyticsId,
    contactEmail: row.contactEmail ?? fallback.contactEmail,
    contactPhone: row.contactPhone ?? fallback.contactPhone,
    siteUrl: row.siteUrl ?? fallback.siteUrl,
    paymentEnabled: Boolean(row.paymentEnabled ?? fallback.paymentEnabled),
    paymentNote: row.paymentNote ?? fallback.paymentNote
  };
}

/**
 * Flatten engine features + nested permissions into SPA ProductFeature rows
 * (permissions become parentKey children, matching the old seed-features shape).
 */
export function mapEngineFeatureCatalog(
  features: EngineFeature[]
): ProductFeature[] {
  const rows: ProductFeature[] = [];
  for (const f of features) {
    rows.push({
      id: String(f.id),
      key: f.key,
      label: f.label,
      description: f.description ?? "",
      category: asFeatureCategory(f.category),
      parentKey: null,
      enabled: true,
      paidAddOn: f.key === "media"
    });
    for (const p of f.permissions ?? []) {
      rows.push({
        id: `perm-${p.id}`,
        key: p.key,
        label: p.label,
        description: p.description ?? "",
        category: "admin",
        parentKey: f.key,
        enabled: true,
        paidAddOn: false
      });
    }
  }
  return rows;
}

export function mapEnginePackage(row: EnginePackage): ProductPackage {
  const roles = Array.from(
    new Set(
      (row.roles ?? [])
        .map(r => asAdminRole(r.name))
        .filter((r): r is AdminRole => Boolean(r))
    )
  );
  const featureKeys = Array.from(
    new Set([...(row.featureKeys ?? []), ...(row.permissionKeys ?? [])])
  );
  return {
    id: String(row.id),
    name: row.name,
    description: row.description ?? "",
    priceNote: row.priceNote ?? "",
    roles: roles.length ? roles : (["admin"] as AdminRole[]),
    featureKeys,
    isSystem: Boolean(row.isSystem)
  };
}

export function mapEngineAvailabilityResult(
  row: EngineAvailabilityResult
): AvailabilityResult {
  return {
    hotel: mapEngineHotel(row.hotel),
    roomType: mapEngineRoomType(row.roomType),
    ratePlan: mapEngineRatePlan(row.ratePlan),
    nights: Number(row.nights ?? 0),
    availableUnits: Number(row.availableUnits ?? 0),
    subtotal: Number(row.subtotal ?? 0),
    taxesFees: Number(row.taxesFees ?? 0),
    total: Number(row.total ?? 0)
  };
}

/** Split SPA toggle keys into engine featureKeys vs permissionKeys. */
export function splitPackageKeys(
  keys: string[],
  catalog: ProductFeature[]
): { featureKeys: string[]; permissionKeys: string[] } {
  const permissionSet = new Set(
    catalog.filter(f => f.parentKey).map(f => f.key)
  );
  const featureKeys: string[] = [];
  const permissionKeys: string[] = [];
  for (const key of keys) {
    if (permissionSet.has(key)) permissionKeys.push(key);
    else featureKeys.push(key);
  }
  return { featureKeys, permissionKeys };
}
