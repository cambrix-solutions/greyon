import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref } from "vue";
import { ApiError } from "@/helpers/api/createApiClient";
import {
  createHotel,
  createLocation,
  createRatePlan,
  createRoomType,
  destroyHotel,
  destroyLocation,
  destroyRatePlan,
  destroyRoomType,
  fetchAdminHotels,
  fetchAdminLocations,
  fetchAdminRatePlans,
  fetchAdminRoomTypes,
  updateHotel,
  updateLocation,
  updateRatePlan,
  updateRoomType
} from "@/services/engine/adminCatalog";
import {
  createMedia,
  createAdminBooking,
  destroyAvailability,
  destroyMedia,
  destroyNews,
  destroyRateCalendar,
  fetchAdminAvailabilities,
  fetchAdminBookings,
  fetchAdminEnquiries,
  fetchAdminMedia,
  fetchAdminNews,
  fetchAdminRateCalendars,
  fetchAdminSettings,
  fetchPublicSettings,
  updateAdminBooking,
  updateAdminEnquiry,
  updateAdminSettings,
  updateMediaItem,
  upsertAdminAvailability,
  upsertAdminRateCalendar,
  createNews,
  updateNews,
  type MediaItem,
  type SiteSettings
} from "@/services/engine/cmsOps";
import {
  createAdminTeamMember,
  destroyAdminTeamMember,
  fetchAdminSeats,
  fetchAdminTeam,
  updateAdminTeamMember
} from "@/services/engine/adminTeam";
import {
  createDeveloperAdmin,
  createPackage,
  destroyDeveloperAdmin,
  destroyPackage,
  duplicatePackageOnEngine,
  fetchDeveloperAdmins,
  fetchDeveloperFeatures,
  fetchDeveloperPackages,
  updateDeveloperAdmin,
  updatePackage
} from "@/services/engine/developer";
import { searchAvailability as fetchEngineAvailability } from "@/services/engine/ops";
import { fetchPublicCatalog } from "@/services/engine/publicCatalog";
import { useAuthStore } from "@/stores/auth-store";
import type {
  AdminRole,
  AdminUser,
  Availability,
  AvailabilityResult,
  Booking,
  BookingGuest,
  BookingSearchParams,
  BookingStatus,
  ContentStatus,
  Enquiry,
  EnquiryStatus,
  Hotel,
  Location,
  NewsArticle,
  ProductFeature,
  ProductPackage,
  RateCalendar,
  RatePlan,
  RoomType,
  UserPackage
} from "@/types/greyon";

export type { MediaItem, SiteSettings };

const defaultSettings: SiteSettings = {
  siteName: "Greyon",
  defaultTitle: "Greyon | Hotels in Cambodia",
  defaultDescription: "Discover and book Greyon hotels across Cambodia.",
  ogImage:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  heroSlides: [
    {
      src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80",
      alt: "Greyon resort at dusk"
    },
    {
      src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=80",
      alt: "Luxury hotel pool"
    },
    {
      src: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=80",
      alt: "Hotel terrace overlooking water"
    }
  ],
  analyticsId: "",
  contactEmail: "hello@greyon.com.kh",
  contactPhone: "+855 23 000 000",
  siteUrl: "https://www.greyon.com.kh",
  paymentEnabled: false,
  paymentNote:
    "Online payment is not enabled for this MVP. Submitting creates a reservation request; payment is handled offline per hotel policy."
};

function normalizeRole(role: AdminRole): AdminRole {
  if (
    role === "org_admin" ||
    role === "super_admin" ||
    role === "content_admin"
  )
    return "admin";
  if (role === "location_admin") return "manager";
  if (role === "booking_admin") return "hotel_admin";
  return role;
}

function normalizeUser(u: AdminUser): AdminUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    locationIds: u.locationIds ?? [],
    hotelIds: u.hotelIds ?? []
  };
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Drop undefined keys for exactOptionalPropertyTypes-friendly API payloads. */
function omitUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function applyPackageKeys(
  catalog: ProductFeature[],
  featureKeys: string[]
): ProductFeature[] {
  const set = new Set(featureKeys);
  return catalog.map(f => ({
    ...f,
    enabled: f.key === "features" ? true : set.has(f.key)
  }));
}

function parseLocalYmd(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

function toLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number) {
  const d = parseLocalYmd(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalYmd(d);
}

export type CatalogSyncMode = "public" | "admin" | "developer";

export const useCmsStore = defineStore("cms", () => {
  const hotels = ref<Hotel[]>([]);
  const roomTypes = ref<RoomType[]>([]);
  const ratePlans = ref<RatePlan[]>([]);
  const locations = ref<Location[]>([]);
  const news = ref<NewsArticle[]>([]);
  const bookings = ref<Booking[]>([]);
  const enquiries = ref<Enquiry[]>([]);
  const users = ref<AdminUser[]>([]);
  const userPackages = ref<UserPackage[]>([]);
  const media = ref<MediaItem[]>([]);
  const settings = ref<SiteSettings>({
    ...defaultSettings,
    heroSlides: defaultSettings.heroSlides.map(s => ({ ...s }))
  });
  const availability = ref<Availability[]>([]);
  const rateCalendar = ref<RateCalendar[]>([]);
  const features = ref<ProductFeature[]>([]);
  const packages = ref<ProductPackage[]>([]);
  const activePackageId = ref("");
  const catalogSource = ref<"public" | "admin" | "developer" | "empty">(
    "empty"
  );
  const catalogSyncing = ref(false);
  const catalogError = ref<string | null>(null);
  /** Tracks which resource keys have been fetched this session (lazy load). */
  const loadedKeys = ref(new Set<string>());
  const loadInflight = new Map<string, Promise<void>>();

  function markLoaded(key: string) {
    const next = new Set(loadedKeys.value);
    next.add(key);
    loadedKeys.value = next;
  }

  function clearLoaded(...keys: string[]) {
    if (!keys.length) {
      loadedKeys.value = new Set();
      return;
    }
    const next = new Set(loadedKeys.value);
    for (const k of keys) next.delete(k);
    loadedKeys.value = next;
  }

  function applyCatalog(data: {
    locations: Location[];
    hotels: Hotel[];
    roomTypes: RoomType[];
    ratePlans: RatePlan[];
  }) {
    locations.value = data.locations;
    hotels.value = data.hotels;
    roomTypes.value = data.roomTypes;
    ratePlans.value = data.ratePlans;
  }

  function applyActivePackage() {
    const pkg =
      packages.value.find(p => p.id === activePackageId.value) ??
      packages.value[0];
    if (!pkg) return;
    features.value = applyPackageKeys(features.value, pkg.featureKeys);
  }

  async function syncDeveloperBundle() {
    const [feat, pkgs, admins] = await Promise.all([
      fetchDeveloperFeatures(),
      fetchDeveloperPackages(),
      fetchDeveloperAdmins()
    ]);
    features.value = feat;
    packages.value = pkgs;
    users.value = admins.users.map(normalizeUser);
    userPackages.value = admins.userPackages;
    if (
      !activePackageId.value ||
      !packages.value.some(p => p.id === activePackageId.value)
    ) {
      activePackageId.value = packages.value[0]?.id ?? "";
    }
    applyActivePackage();
  }

  /** Org admin: seats (as roles) + team people — not full package editor. */
  async function syncAdminTeamBundle() {
    const [seats, team] = await Promise.all([
      fetchAdminSeats(),
      fetchAdminTeam()
    ]);
    packages.value = seats;
    users.value = team.users.map(normalizeUser);
    userPackages.value = team.userPackages;
    if (
      !activePackageId.value ||
      !packages.value.some(p => p.id === activePackageId.value)
    ) {
      activePackageId.value = packages.value[0]?.id ?? "";
    }
  }

  async function ensureTeamBundle(force = false) {
    const auth = useAuthStore();
    if (auth.isDeveloper) {
      await ensureDeveloperBundle(force);
      return;
    }
    await runEnsure(
      "admin-team",
      async () => {
        await syncAdminTeamBundle();
      },
      force
    );
  }

  /** Refresh feature+permission catalog after developer CRUD (keeps Packages in sync). */
  async function refreshDeveloperFeatures() {
    features.value = await fetchDeveloperFeatures();
    applyActivePackage();
  }

  async function runEnsure(
    key: string,
    loader: () => Promise<void>,
    force = false
  ) {
    if (!force && loadedKeys.value.has(key)) return;
    const existing = loadInflight.get(key);
    if (existing) {
      await existing;
      return;
    }
    const job = (async () => {
      try {
        await loader();
        markLoaded(key);
      } catch (e) {
        // Global 401 handler redirects; don't leave void ensure* callers uncaught.
        if (e instanceof ApiError && e.status === 401) return;
        throw e;
      }
    })().finally(() => {
      loadInflight.delete(key);
    });
    loadInflight.set(key, job);
    await job;
  }

  async function ensureLocations(force = false) {
    await runEnsure(
      "locations",
      async () => {
        locations.value = await fetchAdminLocations();
      },
      force
    );
  }

  async function ensureHotels(force = false) {
    await runEnsure(
      "hotels",
      async () => {
        hotels.value = await fetchAdminHotels();
      },
      force
    );
  }

  async function ensureRoomTypes(force = false) {
    await runEnsure(
      "roomTypes",
      async () => {
        roomTypes.value = await fetchAdminRoomTypes();
      },
      force
    );
  }

  async function ensureRatePlans(force = false) {
    await runEnsure(
      "ratePlans",
      async () => {
        ratePlans.value = await fetchAdminRatePlans();
      },
      force
    );
  }

  async function ensureNews(force = false) {
    await runEnsure(
      "news",
      async () => {
        news.value = await fetchAdminNews();
      },
      force
    );
  }

  async function ensureBookings(force = false) {
    await runEnsure(
      "bookings",
      async () => {
        bookings.value = await fetchAdminBookings();
      },
      force
    );
  }

  async function ensureEnquiries(force = false) {
    await runEnsure(
      "enquiries",
      async () => {
        enquiries.value = await fetchAdminEnquiries();
      },
      force
    );
  }

  async function ensureMedia(force = false) {
    await runEnsure(
      "media",
      async () => {
        media.value = await fetchAdminMedia();
      },
      force
    );
  }

  async function ensureAvailability(force = false) {
    await runEnsure(
      "availability",
      async () => {
        availability.value = await fetchAdminAvailabilities();
      },
      force
    );
  }

  async function ensureRateCalendars(force = false) {
    await runEnsure(
      "rateCalendars",
      async () => {
        rateCalendar.value = await fetchAdminRateCalendars();
      },
      force
    );
  }

  async function ensureSettings(force = false) {
    await runEnsure(
      "settings",
      async () => {
        settings.value = await fetchAdminSettings(defaultSettings);
      },
      force
    );
  }

  async function ensureDeveloperBundle(force = false) {
    await runEnsure(
      "developer",
      async () => {
        await syncDeveloperBundle();
      },
      force
    );
  }

  /** Dashboard: hotels + bookings + enquiries only. */
  async function ensureDashboardData() {
    await Promise.all([
      ensureHotels().catch(() => undefined),
      ensureBookings().catch(() => undefined),
      ensureEnquiries().catch(() => undefined)
    ]);
  }

  /** Marketing site: published catalog + public settings (once per session). */
  async function ensurePublicCatalog(force = false) {
    await runEnsure(
      "public",
      async () => {
        await syncCatalogFromEngine("public");
      },
      force
    );
  }

  /**
   * Public site hydrate only. Admin/developer modules load per page via ensure*.
   */
  async function syncCatalogFromEngine(mode: CatalogSyncMode = "public") {
    catalogSyncing.value = true;
    catalogError.value = null;
    try {
      if (mode === "public") {
        const [catalog, siteSettings] = await Promise.all([
          fetchPublicCatalog(),
          fetchPublicSettings(defaultSettings)
        ]);
        applyCatalog(catalog);
        news.value = catalog.news;
        settings.value = siteSettings;
        catalogSource.value = "public";
        clearLoaded();
        markLoaded("public");
        return;
      }

      catalogSource.value = mode;
      clearLoaded();
    } catch (e) {
      catalogError.value =
        e instanceof Error ? e.message : "Catalog sync failed.";
      throw e;
    } finally {
      catalogSyncing.value = false;
    }
  }

  const publishedHotels = computed(() =>
    hotels.value.filter(h => h.status === "published")
  );
  const publishedNews = computed(() =>
    [...news.value]
      .filter(n => n.status === "published")
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  );
  const publishedLocations = computed(() =>
    locations.value.filter(l => l.status === "published")
  );

  function getHotelBySlug(slug: string) {
    return publishedHotels.value.find(h => h.slug === slug);
  }
  function getHotelById(id: string) {
    return hotels.value.find(h => h.id === id);
  }
  function getLocationBySlug(slug: string) {
    return publishedLocations.value.find(l => l.slug === slug);
  }
  function getLocationById(id: string) {
    return locations.value.find(l => l.id === id);
  }
  function getNewsBySlug(slug: string) {
    return publishedNews.value.find(n => n.slug === slug);
  }
  function getRoomTypesByHotelId(hotelId: string) {
    return roomTypes.value.filter(
      r => r.hotelId === hotelId && r.status === "published"
    );
  }
  function getRatePlanByRoomTypeId(roomTypeId: string) {
    return ratePlans.value.find(
      r => r.roomTypeId === roomTypeId && r.status === "published"
    );
  }
  function getRoomTypeById(id: string) {
    return roomTypes.value.find(r => r.id === id);
  }
  function getRatePlanById(id: string) {
    return ratePlans.value.find(r => r.id === id);
  }

  function patchList<T extends { id: string }>(list: { value: T[] }, saved: T) {
    const idx = list.value.findIndex(x => x.id === saved.id);
    if (idx >= 0) list.value[idx] = saved;
    else list.value.unshift(saved);
    return saved;
  }

  // —— Hotels ——
  async function upsertHotel(input: {
    id?: string;
    name: string;
    locationId: string;
    slug?: string;
    shortDescription?: string;
    description?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
    mapEmbedUrl?: string | null;
    phone?: string;
    email?: string;
    heroImage?: string;
    gallery?: string[];
    amenities?: string[];
    policies?: string[];
    checkInTime?: string;
    checkOutTime?: string;
    featured?: boolean;
    status?: ContentStatus;
    seoTitle?: string;
    seoDescription?: string;
  }) {
    const payload = omitUndefined({
      name: input.name,
      locationId: input.locationId,
      slug: input.slug || slugify(input.name),
      shortDescription: input.shortDescription,
      description: input.description,
      address: input.address,
      coordinates: input.coordinates,
      mapEmbedUrl: input.mapEmbedUrl,
      phone: input.phone,
      email: input.email,
      heroImage: input.heroImage,
      gallery: input.gallery,
      amenities: input.amenities,
      policies: input.policies,
      checkInTime: input.checkInTime,
      checkOutTime: input.checkOutTime,
      featured: input.featured,
      status: input.status,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription
    });
    const saved = input.id
      ? await updateHotel(
          input.id,
          payload as Parameters<typeof updateHotel>[1]
        )
      : await createHotel(payload as Parameters<typeof createHotel>[0]);
    return patchList(hotels, saved);
  }

  async function deleteHotel(id: string) {
    await destroyHotel(id);
    const roomIds = new Set(
      roomTypes.value.filter(r => r.hotelId === id).map(r => r.id)
    );
    hotels.value = hotels.value.filter(h => h.id !== id);
    roomTypes.value = roomTypes.value.filter(r => r.hotelId !== id);
    ratePlans.value = ratePlans.value.filter(r => !roomIds.has(r.roomTypeId));
  }

  // —— Rooms ——
  async function upsertRoom(input: {
    id?: string;
    name: string;
    hotelId: string;
    slug?: string;
    description?: string;
    images?: string[];
    bedType?: string;
    roomSize?: string;
    maxAdults?: number;
    maxChildren?: number;
    maxGuests?: number;
    amenities?: string[];
    baseInventory?: number;
    status?: ContentStatus;
  }) {
    const payload = omitUndefined({
      name: input.name,
      hotelId: input.hotelId,
      slug: input.slug || slugify(input.name),
      description: input.description,
      images: input.images,
      bedType: input.bedType,
      roomSize: input.roomSize,
      maxAdults: input.maxAdults,
      maxChildren: input.maxChildren,
      maxGuests: input.maxGuests,
      amenities: input.amenities,
      baseInventory: input.baseInventory,
      status: input.status
    });
    const saved = input.id
      ? await updateRoomType(
          input.id,
          payload as Parameters<typeof updateRoomType>[1]
        )
      : await createRoomType(payload as Parameters<typeof createRoomType>[0]);
    return patchList(roomTypes, saved);
  }

  async function deleteRoom(id: string) {
    await destroyRoomType(id);
    availability.value = availability.value.filter(a => a.roomTypeId !== id);
    const removedPlanIds = new Set(
      ratePlans.value.filter(r => r.roomTypeId === id).map(r => r.id)
    );
    roomTypes.value = roomTypes.value.filter(r => r.id !== id);
    ratePlans.value = ratePlans.value.filter(r => r.roomTypeId !== id);
    rateCalendar.value = rateCalendar.value.filter(
      r => !removedPlanIds.has(r.ratePlanId)
    );
  }

  // —— Rates ——
  async function upsertRate(input: {
    id?: string;
    name: string;
    roomTypeId: string;
    description?: string;
    mealBenefit?: string;
    cancellationPolicy?: string;
    basePrice?: number;
    taxPercent?: number;
    serviceFeePercent?: number;
    status?: ContentStatus;
  }) {
    const payload = omitUndefined({
      name: input.name,
      roomTypeId: input.roomTypeId,
      description: input.description,
      mealBenefit: input.mealBenefit,
      cancellationPolicy: input.cancellationPolicy,
      basePrice: input.basePrice,
      taxPercent: input.taxPercent,
      serviceFeePercent: input.serviceFeePercent,
      status: input.status
    });
    const saved = input.id
      ? await updateRatePlan(
          input.id,
          payload as Parameters<typeof updateRatePlan>[1]
        )
      : await createRatePlan(payload as Parameters<typeof createRatePlan>[0]);
    return patchList(ratePlans, saved);
  }

  async function deleteRate(id: string) {
    await destroyRatePlan(id);
    ratePlans.value = ratePlans.value.filter(r => r.id !== id);
    rateCalendar.value = rateCalendar.value.filter(r => r.ratePlanId !== id);
  }

  // —— Locations ——
  async function upsertLocation(input: {
    id?: string;
    name: string;
    slug?: string;
    description?: string;
    heroImage?: string;
    gallery?: string[];
    highlights?: string[];
    status?: ContentStatus;
    seoTitle?: string;
    seoDescription?: string;
  }) {
    const payload = omitUndefined({
      name: input.name,
      slug: input.slug || slugify(input.name),
      description: input.description,
      heroImage: input.heroImage,
      gallery: input.gallery,
      highlights: input.highlights,
      status: input.status,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription
    });
    const saved = input.id
      ? await updateLocation(
          input.id,
          payload as Parameters<typeof updateLocation>[1]
        )
      : await createLocation(payload as Parameters<typeof createLocation>[0]);
    return patchList(locations, saved);
  }

  async function deleteLocation(id: string) {
    await destroyLocation(id);
    locations.value = locations.value.filter(l => l.id !== id);
  }

  // —— News ——
  async function upsertNews(input: {
    id?: string;
    title: string;
    slug?: string;
    coverImage?: string;
    excerpt?: string;
    body?: string;
    publishedAt?: string;
    status?: ContentStatus;
    seoTitle?: string;
    seoDescription?: string;
  }) {
    const payload = omitUndefined({
      title: input.title,
      slug: input.slug || slugify(input.title),
      coverImage: input.coverImage,
      excerpt: input.excerpt,
      body: input.body,
      publishedAt: input.publishedAt,
      status: input.status,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription
    });
    const saved = input.id
      ? await updateNews(input.id, payload as Parameters<typeof updateNews>[1])
      : await createNews(payload as Parameters<typeof createNews>[0]);
    return patchList(news, saved);
  }

  async function deleteNews(id: string) {
    await destroyNews(id);
    news.value = news.value.filter(n => n.id !== id);
  }

  // —— Availability / Rate calendar ——
  function getAvailability(roomTypeId: string, date: string) {
    return availability.value.find(
      a => a.roomTypeId === roomTypeId && a.date === date
    );
  }

  function getRateForDate(ratePlanId: string, date: string) {
    return rateCalendar.value.find(
      r => r.ratePlanId === ratePlanId && r.date === date
    );
  }

  async function upsertAvailability(input: {
    roomTypeId: string;
    date: string;
    availableUnits: number;
    stopSell: boolean;
  }) {
    const saved = await upsertAdminAvailability(input);
    const idx = availability.value.findIndex(
      a => a.roomTypeId === saved.roomTypeId && a.date === saved.date
    );
    if (idx >= 0) availability.value[idx] = saved;
    else availability.value.push(saved);
    return saved;
  }

  async function upsertRateCalendar(input: {
    ratePlanId: string;
    date: string;
    price: number;
    minStay?: number;
    maxStay?: number;
  }) {
    const saved = await upsertAdminRateCalendar(input);
    const idx = rateCalendar.value.findIndex(
      r => r.ratePlanId === saved.ratePlanId && r.date === saved.date
    );
    if (idx >= 0) rateCalendar.value[idx] = saved;
    else rateCalendar.value.push(saved);
    return saved;
  }

  async function clearAvailability(roomTypeId: string, date: string) {
    const row = getAvailability(roomTypeId, date);
    if (row) {
      await destroyAvailability(row.id);
      availability.value = availability.value.filter(a => a.id !== row.id);
    }
  }

  async function clearRateCalendar(ratePlanId: string, date: string) {
    const row = getRateForDate(ratePlanId, date);
    if (row) {
      await destroyRateCalendar(row.id);
      rateCalendar.value = rateCalendar.value.filter(r => r.id !== row.id);
    }
  }

  function getCalendarDays(startDate: string, days = 14) {
    return Array.from({ length: days }, (_, i) => addDays(startDate, i));
  }

  function unitsForNight(
    roomTypeId: string,
    date: string,
    baseInventory: number
  ) {
    const row = getAvailability(roomTypeId, date);
    if (row?.stopSell) return 0;
    return row?.availableUnits ?? baseInventory;
  }

  function bookedOnNight(roomTypeId: string, date: string) {
    const next = addDays(date, 1);
    return bookings.value
      .filter(
        b =>
          b.roomTypeId === roomTypeId &&
          b.status !== "cancelled" &&
          b.checkIn <= date &&
          b.checkOut >= next
      )
      .reduce((sum, b) => sum + b.rooms, 0);
  }

  /** Engine availability search (used by admin booking create UI). */
  async function searchAvailability(
    params: BookingSearchParams
  ): Promise<AvailabilityResult[]> {
    return fetchEngineAvailability(params);
  }

  async function createBooking(input: {
    hotelId: string;
    roomTypeId: string;
    ratePlanId: string;
    checkIn: string;
    checkOut: string;
    rooms: number;
    adults: number;
    children: number;
    guest: BookingGuest;
    source?: "website" | "admin";
    status?: BookingStatus;
  }) {
    try {
      const booking = await createAdminBooking(
        omitUndefined({
          hotelId: input.hotelId,
          roomTypeId: input.roomTypeId,
          ratePlanId: input.ratePlanId,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          rooms: input.rooms,
          adults: input.adults,
          children: input.children,
          guest: input.guest,
          status: input.status
        }) as Parameters<typeof createAdminBooking>[0]
      );
      bookings.value.unshift(booking);
      return { ok: true as const, booking };
    } catch (e) {
      return {
        ok: false as const,
        message: e instanceof Error ? e.message : "Booking failed."
      };
    }
  }

  async function updateBookingStatus(reference: string, status: BookingStatus) {
    const booking = bookings.value.find(b => b.reference === reference);
    if (!booking) return null;
    const saved = await updateAdminBooking(booking.id, { status });
    const idx = bookings.value.findIndex(b => b.id === saved.id);
    if (idx >= 0) bookings.value[idx] = saved;
    return saved;
  }

  function deleteBooking(id: string) {
    bookings.value = bookings.value.filter(b => b.id !== id);
  }

  function getBookingByReference(reference: string) {
    return bookings.value.find(b => b.reference === reference);
  }

  // —— Enquiries ——
  function createEnquiry(
    input: Omit<Enquiry, "id" | "status" | "createdAt" | "internalNotes">
  ) {
    const enquiry: Enquiry = {
      ...input,
      id: uid("enq"),
      status: "new",
      createdAt: new Date().toISOString(),
      internalNotes: ""
    };
    // Prefer bookingService.createEnquiry for public; this is a local stub.
    enquiries.value.unshift(enquiry);
    return enquiry;
  }

  async function updateEnquiry(
    id: string,
    patch: Partial<Pick<Enquiry, "status" | "internalNotes">>
  ) {
    const saved = await updateAdminEnquiry(id, patch);
    const idx = enquiries.value.findIndex(e => e.id === saved.id);
    if (idx >= 0) enquiries.value[idx] = saved;
    return saved;
  }

  /** Engine has no enquiry delete — close and drop from local cache. */
  async function deleteEnquiry(id: string) {
    try {
      await updateAdminEnquiry(id, { status: "closed" });
    } catch {
      // ignore
    }
    enquiries.value = enquiries.value.filter(e => e.id !== id);
  }

  // —— Media ——
  async function addMedia(src: string, alt: string) {
    const item = await createMedia(src, alt);
    media.value.unshift(item);
    return item;
  }

  async function updateMedia(id: string, patch: Partial<MediaItem>) {
    const saved = await updateMediaItem(id, patch);
    const idx = media.value.findIndex(m => m.id === saved.id);
    if (idx >= 0) media.value[idx] = saved;
    return saved;
  }

  async function deleteMedia(id: string) {
    await destroyMedia(id);
    media.value = media.value.filter(m => m.id !== id);
  }

  // —— Settings ——
  async function saveSettings(patch: Partial<SiteSettings>) {
    settings.value = await updateAdminSettings(patch, settings.value);
  }

  // —— Users + packages (developer API) ——
  function getPackageById(id: string) {
    return packages.value.find(p => p.id === id) ?? null;
  }

  function getPackagesForUser(userId: string) {
    return userPackages.value
      .filter(up => up.userId === userId)
      .map(up => getPackageById(up.packageId))
      .filter((p): p is ProductPackage => Boolean(p));
  }

  function getUserRoles(user: AdminUser | null | undefined): AdminRole[] {
    if (!user) return [];
    const roles = getPackagesForUser(user.id).flatMap(p =>
      p.roles.map(normalizeRole)
    );
    return Array.from(new Set(roles));
  }

  function getUserRole(user: AdminUser | null | undefined): AdminRole | null {
    const roles = getUserRoles(user);
    if (!roles.length) return null;
    const order: AdminRole[] = [
      "developer",
      "admin",
      "manager",
      "hotel_admin",
      "customer"
    ];
    return order.find(r => roles.includes(r)) ?? roles[0]!;
  }

  function getUserFeatureKeys(user: AdminUser | null | undefined): string[] {
    if (!user) return [];
    const keys = getPackagesForUser(user.id).flatMap(p => p.featureKeys);
    return Array.from(new Set(keys));
  }

  function usersOnPackage(packageId: string) {
    const ids = new Set(
      userPackages.value
        .filter(up => up.packageId === packageId)
        .map(up => up.userId)
    );
    return users.value.filter(u => ids.has(u.id));
  }

  function mergeAdminBundle(bundle: {
    users: AdminUser[];
    userPackages: UserPackage[];
  }) {
    for (const u of bundle.users) {
      const normalized = normalizeUser(u);
      const idx = users.value.findIndex(x => x.id === normalized.id);
      if (idx >= 0) users.value[idx] = normalized;
      else users.value.unshift(normalized);
      userPackages.value = [
        ...userPackages.value.filter(up => up.userId !== normalized.id),
        ...bundle.userPackages.filter(up => up.userId === normalized.id)
      ];
    }
  }

  async function setUserPackages(userId: string, packageIds: string[]) {
    const user = users.value.find(u => u.id === userId);
    if (!user) return;
    const bundle = await updateDeveloperAdmin({
      id: userId,
      name: user.name,
      email: user.email,
      packageIds,
      locationIds: user.locationIds,
      hotelIds: user.hotelIds
    });
    mergeAdminBundle(bundle);
  }

  async function upsertUser(input: {
    id?: string;
    name: string;
    email: string;
    packageIds?: string[];
    locationIds?: string[];
    hotelIds?: string[];
  }) {
    const packageIds =
      input.packageIds?.filter(id => packages.value.some(p => p.id === id)) ??
      [];
    if (!packageIds.length) {
      throw new Error("Assign at least one seat.");
    }
    const payload = {
      name: input.name,
      email: input.email,
      packageIds,
      locationIds: input.locationIds ?? [],
      hotelIds: input.hotelIds ?? []
    };
    const auth = useAuthStore();
    const bundle = auth.isDeveloper
      ? input.id
        ? await updateDeveloperAdmin({ ...payload, id: input.id })
        : await createDeveloperAdmin(payload)
      : input.id
        ? await updateAdminTeamMember({ ...payload, id: input.id })
        : await createAdminTeamMember(payload);
    mergeAdminBundle(bundle);
    return bundle.users[0]!;
  }

  async function deleteUser(id: string) {
    const auth = useAuthStore();
    if (auth.isDeveloper) await destroyDeveloperAdmin(id);
    else await destroyAdminTeamMember(id);
    users.value = users.value.filter(u => u.id !== id);
    userPackages.value = userPackages.value.filter(up => up.userId !== id);
  }

  function setActivePackage(id: string) {
    if (!packages.value.some(p => p.id === id)) return null;
    activePackageId.value = id;
    applyActivePackage();
    return packages.value.find(p => p.id === id) ?? null;
  }

  async function upsertPackage(input: {
    id?: string;
    name: string;
    description?: string;
    priceNote?: string;
    featureKeys: string[];
    roles: AdminRole[];
  }) {
    const roles = Array.from(
      new Set(input.roles.map(normalizeRole).filter(Boolean))
    ) as AdminRole[];
    if (!roles.length) roles.push("admin");
    const keys = Array.from(
      new Set(
        roles.includes("customer") && roles.length === 1
          ? input.featureKeys
          : ["features", "dashboard", ...input.featureKeys]
      )
    );
    const payload = omitUndefined({
      name: input.name,
      description: input.description,
      priceNote: input.priceNote,
      roles,
      featureKeys: keys
    });
    const saved = input.id
      ? await updatePackage(
          input.id,
          payload as Parameters<typeof updatePackage>[1],
          features.value
        )
      : await createPackage(
          payload as Parameters<typeof createPackage>[0],
          features.value
        );
    const idx = packages.value.findIndex(p => p.id === saved.id);
    if (idx >= 0) packages.value[idx] = saved;
    else packages.value.push(saved);
    if (activePackageId.value === saved.id || !activePackageId.value) {
      activePackageId.value = saved.id;
      applyActivePackage();
    }
    return saved;
  }

  async function deletePackage(id: string) {
    const pkg = packages.value.find(p => p.id === id);
    if (!pkg || pkg.isSystem) return false;
    await destroyPackage(id);
    packages.value = packages.value.filter(p => p.id !== id);
    userPackages.value = userPackages.value.filter(up => up.packageId !== id);
    if (activePackageId.value === id) {
      activePackageId.value = packages.value[0]?.id ?? "";
      applyActivePackage();
    }
    return true;
  }

  async function duplicatePackage(id: string) {
    const saved = await duplicatePackageOnEngine(id);
    packages.value.push(saved);
    return saved;
  }

  async function setFeatureEnabled(key: string, enabled: boolean) {
    const feat = features.value.find(f => f.key === key);
    if (!feat) return null;
    if (feat.key === "features") return feat;
    feat.enabled = enabled;
    const pkg = packages.value.find(p => p.id === activePackageId.value);
    if (pkg) {
      const set = new Set(pkg.featureKeys);
      if (enabled) set.add(key);
      else set.delete(key);
      pkg.featureKeys = Array.from(set);
      await updatePackage(
        pkg.id,
        { featureKeys: pkg.featureKeys },
        features.value
      );
    }
    return feat;
  }

  function setFeaturePaidAddOn(key: string, paidAddOn: boolean) {
    const feat = features.value.find(f => f.key === key);
    if (!feat) return null;
    feat.paidAddOn = paidAddOn;
    return feat;
  }

  /** Clear local cache and mark source — pages re-fetch via ensure* on visit. */
  async function resetToSeed() {
    hotels.value = [];
    roomTypes.value = [];
    ratePlans.value = [];
    locations.value = [];
    news.value = [];
    bookings.value = [];
    enquiries.value = [];
    users.value = [];
    userPackages.value = [];
    media.value = [];
    settings.value = {
      ...defaultSettings,
      heroSlides: defaultSettings.heroSlides.map(s => ({ ...s }))
    };
    availability.value = [];
    rateCalendar.value = [];
    features.value = [];
    packages.value = [];
    activePackageId.value = "";
    clearLoaded();
    const mode = catalogSource.value;
    if (mode === "admin" || mode === "developer") {
      catalogSource.value = mode;
      await ensureDashboardData();
      if (mode === "developer") await ensureDeveloperBundle(true);
    } else {
      catalogSource.value = "empty";
      await syncCatalogFromEngine("public").catch(() => undefined);
    }
  }

  const statusOptions: ContentStatus[] = ["draft", "published", "archived"];
  const bookingStatusOptions: BookingStatus[] = [
    "pending",
    "confirmed",
    "cancelled",
    "completed"
  ];
  const enquiryStatusOptions: EnquiryStatus[] = [
    "new",
    "in_progress",
    "closed"
  ];
  const roleOptions: AdminRole[] = [
    "developer",
    "admin",
    "manager",
    "hotel_admin",
    "customer"
  ];

  return {
    hotels,
    roomTypes,
    ratePlans,
    locations,
    news,
    bookings,
    enquiries,
    users,
    userPackages,
    media,
    settings,
    availability,
    rateCalendar,
    features,
    packages,
    activePackageId,
    publishedHotels,
    publishedNews,
    publishedLocations,
    statusOptions,
    bookingStatusOptions,
    enquiryStatusOptions,
    roleOptions,
    getHotelBySlug,
    getHotelById,
    getLocationBySlug,
    getLocationById,
    getNewsBySlug,
    getRoomTypesByHotelId,
    getRatePlanByRoomTypeId,
    getRoomTypeById,
    getRatePlanById,
    getBookingByReference,
    getAvailability,
    getRateForDate,
    upsertAvailability,
    upsertRateCalendar,
    clearAvailability,
    clearRateCalendar,
    getCalendarDays,
    unitsForNight,
    bookedOnNight,
    upsertHotel,
    deleteHotel,
    upsertRoom,
    deleteRoom,
    upsertRate,
    deleteRate,
    upsertLocation,
    deleteLocation,
    upsertNews,
    deleteNews,
    searchAvailability,
    createBooking,
    updateBookingStatus,
    deleteBooking,
    createEnquiry,
    updateEnquiry,
    deleteEnquiry,
    addMedia,
    updateMedia,
    deleteMedia,
    saveSettings,
    upsertUser,
    deleteUser,
    setUserPackages,
    getPackagesForUser,
    getUserRoles,
    getUserFeatureKeys,
    getPackageById,
    getUserRole,
    usersOnPackage,
    setFeatureEnabled,
    setFeaturePaidAddOn,
    setActivePackage,
    upsertPackage,
    deletePackage,
    duplicatePackage,
    applyActivePackage,
    resetToSeed,
    catalogSource,
    catalogSyncing,
    catalogError,
    syncCatalogFromEngine,
    refreshDeveloperFeatures,
    ensureLocations,
    ensureHotels,
    ensureRoomTypes,
    ensureRatePlans,
    ensureNews,
    ensureBookings,
    ensureEnquiries,
    ensureMedia,
    ensureAvailability,
    ensureRateCalendars,
    ensureSettings,
    ensureDeveloperBundle,
    ensureTeamBundle,
    ensureDashboardData,
    ensurePublicCatalog
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCmsStore, import.meta.hot));
}
