import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref } from "vue";
import {
  hotels as seedHotels,
  ratePlans as seedRates,
  roomTypes as seedRooms
} from "@/data/mock/hotels";
import { locations as seedLocations } from "@/data/mock/locations";
import { newsArticles as seedNews } from "@/data/mock/news";
import { seedFeatures } from "@/data/seed-features";
import {
  DEFAULT_ACTIVE_PACKAGE_ID,
  seedPackages
} from "@/data/seed-packages";
import { seedUsers, USERS_SEED_REV } from "@/data/seed-users";
import type {
  AdminRole,
  AdminUser,
  Availability,
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
  RoomType
} from "@/types/greyon";

const STORAGE_KEY = "greyon_cms_v3";

export interface MediaItem {
  id: string;
  src: string;
  alt: string;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  defaultTitle: string;
  defaultDescription: string;
  ogImage: string;
  analyticsId: string;
  contactEmail: string;
  contactPhone: string;
  siteUrl: string;
  paymentEnabled: boolean;
  paymentNote: string;
}

const defaultSettings: SiteSettings = {
  siteName: "Greyon",
  defaultTitle: "Greyon | Hotels in Cambodia",
  defaultDescription: "Discover and book Greyon hotels across Cambodia.",
  ogImage:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  analyticsId: "",
  contactEmail: "hello@greyon.com.kh",
  contactPhone: "+855 23 000 000",
  siteUrl: "https://www.greyon.com.kh",
  paymentEnabled: false,
  paymentNote:
    "Online payment is not enabled for this MVP. Submitting creates a reservation request; payment is handled offline per hotel policy."
};

function mergeFeatures(stored?: ProductFeature[]): ProductFeature[] {
  const byKey = new Map((stored ?? []).map(f => [f.key, f]));
  return seedFeatures.map(seed => {
    const prev = byKey.get(seed.key);
    if (!prev) return clone(seed);
    return {
      ...seed,
      enabled: prev.enabled,
      paidAddOn: prev.paidAddOn ?? seed.paidAddOn
    };
  });
}

function mergePackages(stored?: ProductPackage[]): ProductPackage[] {
  const merged = seedPackages.map(seed => {
    const prev = (stored ?? []).find(p => p.id === seed.id);
    if (!prev) return clone(seed);
    return {
      ...seed,
      name: prev.name || seed.name,
      description: prev.description || seed.description,
      priceNote: prev.priceNote ?? seed.priceNote,
      role: prev.role || seed.role,
      featureKeys: prev.featureKeys?.length
        ? [...prev.featureKeys]
        : [...seed.featureKeys],
      isSystem: true
    };
  });
  for (const p of stored ?? []) {
    if (seedPackages.some(s => s.id === p.id)) continue;
    const legacyRoles = (p as ProductPackage & { roles?: AdminRole[] }).roles;
    merged.push({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      priceNote: p.priceNote ?? "",
      role: p.role || legacyRoles?.[0] || "org_admin",
      featureKeys: [...(p.featureKeys ?? [])],
      isSystem: false
    });
  }
  return merged;
}

function applyPackageKeys(
  catalog: ProductFeature[],
  featureKeys: string[]
): ProductFeature[] {
  const set = new Set(featureKeys);
  return catalog.map(f => ({
    ...f,
    // Developer control panel always stays in catalog as enabled=true for gating edge cases;
    // auth still restricts "features" to developer role.
    enabled: f.key === "features" ? true : set.has(f.key)
  }));
}

function normalizeUser(u: AdminUser): AdminUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    packageId: u.packageId || DEFAULT_ACTIVE_PACKAGE_ID,
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

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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

function nightsBetween(checkIn: string, checkOut: string) {
  const start = parseLocalYmd(checkIn);
  const end = parseLocalYmd(checkOut);
  return Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function isValidDateRange(checkIn: string, checkOut: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = parseLocalYmd(checkIn);
  const end = parseLocalYmd(checkOut);
  return start >= today && end > start;
}

function eachNight(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  const cursor = parseLocalYmd(checkIn);
  const end = parseLocalYmd(checkOut);
  while (cursor < end) {
    nights.push(toLocalYmd(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return nights;
}

function addDays(dateStr: string, days: number) {
  const d = parseLocalYmd(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalYmd(d);
}

export const useCmsStore = defineStore("cms", () => {
  const hotels = ref<Hotel[]>(clone(seedHotels));
  const roomTypes = ref<RoomType[]>(clone(seedRooms));
  const ratePlans = ref<RatePlan[]>(clone(seedRates));
  const locations = ref<Location[]>(clone(seedLocations));
  const news = ref<NewsArticle[]>(clone(seedNews));
  const bookings = ref<Booking[]>([]);
  const enquiries = ref<Enquiry[]>([]);
  const users = ref<AdminUser[]>(clone(seedUsers).map(normalizeUser));
  const media = ref<MediaItem[]>([]);
  const settings = ref<SiteSettings>({ ...defaultSettings });
  const availability = ref<Availability[]>([]);
  const rateCalendar = ref<RateCalendar[]>([]);
  const features = ref<ProductFeature[]>(mergeFeatures());
  const packages = ref<ProductPackage[]>(mergePackages());
  const activePackageId = ref(DEFAULT_ACTIVE_PACKAGE_ID);

  function seedMediaFromContent() {
    const items: MediaItem[] = [];
    for (const h of hotels.value) {
      items.push({
        id: uid("media"),
        src: h.heroImage,
        alt: `${h.name} hero`,
        createdAt: new Date().toISOString()
      });
      h.gallery.forEach((src, i) => {
        items.push({
          id: uid("media"),
          src,
          alt: `${h.name} gallery ${i + 1}`,
          createdAt: new Date().toISOString()
        });
      });
    }
    for (const n of news.value) {
      items.push({
        id: uid("media"),
        src: n.coverImage,
        alt: n.title,
        createdAt: new Date().toISOString()
      });
    }
    media.value = items;
  }

  function persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        hotels: hotels.value,
        roomTypes: roomTypes.value,
        ratePlans: ratePlans.value,
        locations: locations.value,
        news: news.value,
        bookings: bookings.value,
        enquiries: enquiries.value,
        users: users.value,
        media: media.value,
        settings: settings.value,
        availability: availability.value,
        rateCalendar: rateCalendar.value,
        features: features.value,
        packages: packages.value,
        activePackageId: activePackageId.value,
        usersSeedRev: USERS_SEED_REV
      })
    );
  }

  function reseedUsersAndPackages() {
    // Reset system package matrix from seed (drop stale customizations on system ids)
    const custom = packages.value.filter(p => !p.isSystem);
    packages.value = [...clone(seedPackages), ...custom];
    users.value = clone(seedUsers).map(normalizeUser);
    activePackageId.value = DEFAULT_ACTIVE_PACKAGE_ID;
    applyActivePackage();
  }

  function hydrate() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      seedMediaFromContent();
      reseedUsersAndPackages();
      persist();
      return;
    }
    try {
      const data = JSON.parse(raw) as Partial<{
        hotels: Hotel[];
        roomTypes: RoomType[];
        ratePlans: RatePlan[];
        locations: Location[];
        news: NewsArticle[];
        bookings: Booking[];
        enquiries: Enquiry[];
        users: AdminUser[];
        media: MediaItem[];
        settings: SiteSettings;
        availability: Availability[];
        rateCalendar: RateCalendar[];
        features: ProductFeature[];
        packages: ProductPackage[];
        activePackageId: string;
        usersSeedRev: number;
      }>;
      if (data.hotels) hotels.value = data.hotels;
      if (data.roomTypes) roomTypes.value = data.roomTypes;
      if (data.ratePlans) ratePlans.value = data.ratePlans;
      if (data.locations) locations.value = data.locations;
      if (data.news) news.value = data.news;
      if (data.bookings) bookings.value = data.bookings;
      if (data.enquiries) enquiries.value = data.enquiries;
      if (data.media?.length) media.value = data.media;
      else seedMediaFromContent();
      if (data.settings) settings.value = { ...defaultSettings, ...data.settings };
      if (data.availability) availability.value = data.availability;
      if (data.rateCalendar) rateCalendar.value = data.rateCalendar;
      features.value = mergeFeatures(data.features);

      const needsUserReseed = data.usersSeedRev !== USERS_SEED_REV;
      if (needsUserReseed) {
        // Fresh package + user matrix after seed redesign
        reseedUsersAndPackages();
      } else {
        packages.value = mergePackages(data.packages);
        if (data.users?.length) {
          users.value = data.users.map(normalizeUser);
          const hasDev = users.value.some(
            u => getPackageById(u.packageId)?.role === "developer"
          );
          if (!hasDev) {
            users.value.unshift(normalizeUser(clone(seedUsers[0]!)));
          }
        } else {
          users.value = clone(seedUsers).map(normalizeUser);
        }
        activePackageId.value =
          data.activePackageId &&
          packages.value.some(p => p.id === data.activePackageId)
            ? data.activePackageId
            : DEFAULT_ACTIVE_PACKAGE_ID;
        applyActivePackage();
      }
      persist();
    } catch {
      seedMediaFromContent();
      features.value = mergeFeatures();
      reseedUsersAndPackages();
      persist();
    }
  }

  hydrate();

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

  function upsertHotel(input: {
    id?: string;
    name: string;
    locationId: string;
    slug?: string;
    shortDescription?: string;
    description?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
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
    if (input.id) {
      const idx = hotels.value.findIndex(h => h.id === input.id);
      if (idx >= 0) {
        const current = hotels.value[idx]!;
        hotels.value[idx] = {
          ...current,
          ...input,
          id: current.id,
          slug: input.slug || slugify(input.name)
        };
        persist();
        return hotels.value[idx];
      }
    }
    const hotel: Hotel = {
      id: uid("htl"),
      name: input.name,
      slug: input.slug || slugify(input.name),
      locationId: input.locationId,
      shortDescription: input.shortDescription || "",
      description: input.description || "",
      address: input.address || "",
      coordinates: input.coordinates || { lat: 11.55, lng: 104.92 },
      phone: input.phone || "",
      email: input.email || "",
      heroImage:
        input.heroImage ||
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
      gallery: input.gallery || [],
      amenities: input.amenities || [],
      policies: input.policies || [],
      checkInTime: input.checkInTime || "14:00",
      checkOutTime: input.checkOutTime || "12:00",
      featured: input.featured ?? false,
      status: input.status || "draft"
    };
    if (input.seoTitle) hotel.seoTitle = input.seoTitle;
    if (input.seoDescription) hotel.seoDescription = input.seoDescription;
    hotels.value.unshift(hotel);
    persist();
    return hotel;
  }

  function deleteHotel(id: string) {
    const roomIds = new Set(
      roomTypes.value.filter(r => r.hotelId === id).map(r => r.id)
    );
    hotels.value = hotels.value.filter(h => h.id !== id);
    roomTypes.value = roomTypes.value.filter(r => r.hotelId !== id);
    ratePlans.value = ratePlans.value.filter(r => !roomIds.has(r.roomTypeId));
    persist();
  }

  // —— Rooms ——
  function upsertRoom(input: {
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
    if (input.id) {
      const idx = roomTypes.value.findIndex(r => r.id === input.id);
      if (idx >= 0) {
        const current = roomTypes.value[idx]!;
        roomTypes.value[idx] = {
          ...current,
          ...input,
          id: current.id,
          slug: input.slug || slugify(input.name)
        };
        persist();
        return roomTypes.value[idx];
      }
    }
    const room: RoomType = {
      id: uid("rm"),
      hotelId: input.hotelId,
      name: input.name,
      slug: input.slug || slugify(input.name),
      description: input.description || "",
      images: input.images || [],
      bedType: input.bedType || "1 King",
      roomSize: input.roomSize || "25 m²",
      maxAdults: input.maxAdults ?? 2,
      maxChildren: input.maxChildren ?? 1,
      maxGuests: input.maxGuests ?? 3,
      amenities: input.amenities || [],
      baseInventory: input.baseInventory ?? 5,
      status: input.status || "draft"
    };
    roomTypes.value.unshift(room);
    persist();
    return room;
  }

  function deleteRoom(id: string) {
    availability.value = availability.value.filter(a => a.roomTypeId !== id);
    const removedPlanIds = new Set(
      ratePlans.value.filter(r => r.roomTypeId === id).map(r => r.id)
    );
    roomTypes.value = roomTypes.value.filter(r => r.id !== id);
    ratePlans.value = ratePlans.value.filter(r => r.roomTypeId !== id);
    rateCalendar.value = rateCalendar.value.filter(
      r => !removedPlanIds.has(r.ratePlanId)
    );
    persist();
  }

  // —— Rates ——
  function upsertRate(input: {
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
    if (input.id) {
      const idx = ratePlans.value.findIndex(r => r.id === input.id);
      if (idx >= 0) {
        const current = ratePlans.value[idx]!;
        ratePlans.value[idx] = { ...current, ...input, id: current.id };
        persist();
        return ratePlans.value[idx];
      }
    }
    const plan: RatePlan = {
      id: uid("rp"),
      roomTypeId: input.roomTypeId,
      name: input.name,
      description: input.description || "",
      mealBenefit: input.mealBenefit || "Room only",
      cancellationPolicy:
        input.cancellationPolicy ||
        "Free cancellation up to 48 hours before arrival.",
      basePrice: input.basePrice ?? 80,
      taxPercent: input.taxPercent ?? 10,
      serviceFeePercent: input.serviceFeePercent ?? 5,
      status: input.status || "draft"
    };
    ratePlans.value.unshift(plan);
    persist();
    return plan;
  }

  function deleteRate(id: string) {
    ratePlans.value = ratePlans.value.filter(r => r.id !== id);
    rateCalendar.value = rateCalendar.value.filter(r => r.ratePlanId !== id);
    persist();
  }

  // —— Locations ——
  function upsertLocation(input: {
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
    if (input.id) {
      const idx = locations.value.findIndex(l => l.id === input.id);
      if (idx >= 0) {
        const current = locations.value[idx]!;
        locations.value[idx] = {
          ...current,
          ...input,
          id: current.id,
          slug: input.slug || slugify(input.name)
        };
        persist();
        return locations.value[idx];
      }
    }
    const loc: Location = {
      id: uid("loc"),
      name: input.name,
      slug: input.slug || slugify(input.name),
      description: input.description || "",
      heroImage:
        input.heroImage ||
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
      gallery: input.gallery || [],
      highlights: input.highlights || [],
      status: input.status || "draft"
    };
    if (input.seoTitle) loc.seoTitle = input.seoTitle;
    if (input.seoDescription) loc.seoDescription = input.seoDescription;
    locations.value.unshift(loc);
    persist();
    return loc;
  }

  function deleteLocation(id: string) {
    locations.value = locations.value.filter(l => l.id !== id);
    persist();
  }

  // —— News ——
  function upsertNews(input: {
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
    if (input.id) {
      const idx = news.value.findIndex(n => n.id === input.id);
      if (idx >= 0) {
        const current = news.value[idx]!;
        news.value[idx] = {
          ...current,
          ...input,
          id: current.id,
          slug: input.slug || slugify(input.title)
        };
        persist();
        return news.value[idx];
      }
    }
    const article: NewsArticle = {
      id: uid("news"),
      title: input.title,
      slug: input.slug || slugify(input.title),
      coverImage:
        input.coverImage ||
        "https://images.unsplash.com/photo-1571896349842-33c89424bb9c?auto=format&fit=crop&w=1400&q=80",
      excerpt: input.excerpt || "",
      body: input.body || "<p></p>",
      publishedAt: input.publishedAt || new Date().toISOString().slice(0, 10),
      status: input.status || "draft"
    };
    if (input.seoTitle) article.seoTitle = input.seoTitle;
    if (input.seoDescription) article.seoDescription = input.seoDescription;
    news.value.unshift(article);
    persist();
    return article;
  }

  function deleteNews(id: string) {
    news.value = news.value.filter(n => n.id !== id);
    persist();
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

  function upsertAvailability(input: {
    roomTypeId: string;
    date: string;
    availableUnits: number;
    stopSell: boolean;
  }) {
    const existing = getAvailability(input.roomTypeId, input.date);
    if (existing) {
      existing.availableUnits = input.availableUnits;
      existing.stopSell = input.stopSell;
      persist();
      return existing;
    }
    const row: Availability = {
      id: uid("avl"),
      roomTypeId: input.roomTypeId,
      date: input.date,
      availableUnits: input.availableUnits,
      stopSell: input.stopSell
    };
    availability.value.push(row);
    persist();
    return row;
  }

  function upsertRateCalendar(input: {
    ratePlanId: string;
    date: string;
    price: number;
    minStay?: number;
    maxStay?: number;
  }) {
    const existing = getRateForDate(input.ratePlanId, input.date);
    if (existing) {
      existing.price = input.price;
      if (input.minStay !== undefined) existing.minStay = input.minStay;
      else delete existing.minStay;
      if (input.maxStay !== undefined) existing.maxStay = input.maxStay;
      else delete existing.maxStay;
      persist();
      return existing;
    }
    const row: RateCalendar = {
      id: uid("rc"),
      ratePlanId: input.ratePlanId,
      date: input.date,
      price: input.price
    };
    if (input.minStay !== undefined) row.minStay = input.minStay;
    if (input.maxStay !== undefined) row.maxStay = input.maxStay;
    rateCalendar.value.push(row);
    persist();
    return row;
  }

  function clearAvailability(roomTypeId: string, date: string) {
    availability.value = availability.value.filter(
      a => !(a.roomTypeId === roomTypeId && a.date === date)
    );
    persist();
  }

  function clearRateCalendar(ratePlanId: string, date: string) {
    rateCalendar.value = rateCalendar.value.filter(
      r => !(r.ratePlanId === ratePlanId && r.date === date)
    );
    persist();
  }

  function getCalendarDays(startDate: string, days = 14) {
    return Array.from({ length: days }, (_, i) => addDays(startDate, i));
  }

  function unitsForNight(roomTypeId: string, date: string, baseInventory: number) {
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

  // —— Bookings ——
  function searchAvailability(params: BookingSearchParams) {
    if (!isValidDateRange(params.checkIn, params.checkOut)) return [];
    const nights = nightsBetween(params.checkIn, params.checkOut);
    if (nights < 1) return [];
    const nightDates = eachNight(params.checkIn, params.checkOut);

    let hotelPool = publishedHotels.value;
    if (params.hotelSlug) {
      const hotel = getHotelBySlug(params.hotelSlug);
      hotelPool = hotel ? [hotel] : [];
    } else if (params.locationSlug) {
      const location = getLocationBySlug(params.locationSlug);
      hotelPool = location
        ? hotelPool.filter(h => h.locationId === location.id)
        : [];
    }

    const results = [];
    for (const hotel of hotelPool) {
      for (const room of getRoomTypesByHotelId(hotel.id)) {
        const guests = params.adults + params.children;
        if (
          params.adults > room.maxAdults ||
          params.children > room.maxChildren ||
          guests > room.maxGuests
        ) {
          continue;
        }
        const plans = ratePlans.value.filter(
          p => p.roomTypeId === room.id && p.status === "published"
        );
        for (const plan of plans) {
          let blocked = false;
          let availableUnits = Infinity;
          let nightTotal = 0;
          for (const date of nightDates) {
            const free =
              unitsForNight(room.id, date, room.baseInventory) -
              bookedOnNight(room.id, date);
            if (free < params.rooms) {
              blocked = true;
              break;
            }
            availableUnits = Math.min(availableUnits, free);
            const cal = getRateForDate(plan.id, date);
            if (cal?.minStay && nights < cal.minStay) {
              blocked = true;
              break;
            }
            if (cal?.maxStay && nights > cal.maxStay) {
              blocked = true;
              break;
            }
            nightTotal += cal?.price ?? plan.basePrice;
          }
          if (blocked || !Number.isFinite(availableUnits)) continue;

          const subtotal = nightTotal * params.rooms;
          const taxesFees =
            subtotal * ((plan.taxPercent + plan.serviceFeePercent) / 100);
          results.push({
            hotel,
            roomType: room,
            ratePlan: plan,
            nights,
            availableUnits,
            subtotal: Math.round(subtotal * 100) / 100,
            taxesFees: Math.round(taxesFees * 100) / 100,
            total: Math.round((subtotal + taxesFees) * 100) / 100
          });
        }
      }
    }
    return results;
  }

  function createBooking(input: {
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
    const hotel = getHotelById(input.hotelId);
    const matches = searchAvailability({
      locationSlug: "",
      hotelSlug: hotel?.slug ?? "",
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      rooms: input.rooms,
      adults: input.adults,
      children: input.children
    }).filter(
      r =>
        r.hotel.id === input.hotelId &&
        r.roomType.id === input.roomTypeId &&
        r.ratePlan.id === input.ratePlanId
    );
    if (!matches.length) {
      return {
        ok: false as const,
        message: "Selected room is no longer available for these dates."
      };
    }
    const match = matches[0]!;
    const booking: Booking = {
      id: uid("bkg"),
      reference: `GRY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      hotelId: input.hotelId,
      roomTypeId: input.roomTypeId,
      ratePlanId: input.ratePlanId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      rooms: input.rooms,
      adults: input.adults,
      children: input.children,
      guest: input.guest,
      subtotal: match.subtotal,
      taxesFees: match.taxesFees,
      total: match.total,
      status: input.status || "pending",
      source: input.source || "website",
      createdAt: new Date().toISOString()
    };
    bookings.value.unshift(booking);
    persist();
    return { ok: true as const, booking };
  }

  function updateBookingStatus(reference: string, status: BookingStatus) {
    const booking = bookings.value.find(b => b.reference === reference);
    if (!booking) return null;
    booking.status = status;
    persist();
    return booking;
  }

  function deleteBooking(id: string) {
    bookings.value = bookings.value.filter(b => b.id !== id);
    persist();
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
    enquiries.value.unshift(enquiry);
    persist();
    return enquiry;
  }

  function updateEnquiry(
    id: string,
    patch: Partial<Pick<Enquiry, "status" | "internalNotes">>
  ) {
    const item = enquiries.value.find(e => e.id === id);
    if (!item) return null;
    Object.assign(item, patch);
    persist();
    return item;
  }

  function deleteEnquiry(id: string) {
    enquiries.value = enquiries.value.filter(e => e.id !== id);
    persist();
  }

  // —— Media ——
  function addMedia(src: string, alt: string) {
    const item: MediaItem = {
      id: uid("media"),
      src,
      alt,
      createdAt: new Date().toISOString()
    };
    media.value.unshift(item);
    persist();
    return item;
  }

  function updateMedia(id: string, patch: Partial<MediaItem>) {
    const item = media.value.find(m => m.id === id);
    if (!item) return null;
    Object.assign(item, patch);
    persist();
    return item;
  }

  function deleteMedia(id: string) {
    media.value = media.value.filter(m => m.id !== id);
    persist();
  }

  // —— Settings ——
  function saveSettings(patch: Partial<SiteSettings>) {
    settings.value = { ...settings.value, ...patch };
    persist();
  }

  // —— Users ——
  function upsertUser(input: {
    id?: string;
    name: string;
    email: string;
    packageId?: string;
    locationIds?: string[];
    hotelIds?: string[];
  }) {
    const packageId =
      input.packageId && packages.value.some(p => p.id === input.packageId)
        ? input.packageId
        : activePackageId.value || DEFAULT_ACTIVE_PACKAGE_ID;
    const pkgRole = packages.value.find(p => p.id === packageId)?.role;
    const patch = normalizeUser({
      id: input.id ?? "",
      name: input.name,
      email: input.email,
      packageId,
      locationIds:
        pkgRole === "location_admin" ? (input.locationIds ?? []) : [],
      hotelIds: pkgRole === "hotel_admin" ? (input.hotelIds ?? []) : []
    });
    if (input.id) {
      const idx = users.value.findIndex(u => u.id === input.id);
      if (idx >= 0) {
        const current = users.value[idx]!;
        users.value[idx] = { ...current, ...patch, id: current.id };
        persist();
        return users.value[idx];
      }
    }
    const user: AdminUser = {
      ...patch,
      id: uid("usr")
    };
    users.value.unshift(user);
    persist();
    return user;
  }

  function deleteUser(id: string) {
    users.value = users.value.filter(u => u.id !== id);
    persist();
  }

  function applyActivePackage() {
    const pkg =
      packages.value.find(p => p.id === activePackageId.value) ??
      packages.value[0];
    if (!pkg) return;
    features.value = applyPackageKeys(features.value, pkg.featureKeys);
  }

  function setActivePackage(id: string) {
    if (!packages.value.some(p => p.id === id)) return null;
    activePackageId.value = id;
    applyActivePackage();
    persist();
    return packages.value.find(p => p.id === id) ?? null;
  }

  function upsertPackage(input: {
    id?: string;
    name: string;
    description?: string;
    priceNote?: string;
    featureKeys: string[];
    role: AdminRole;
  }) {
    const keys = Array.from(
      new Set(
        input.role === "customer"
          ? input.featureKeys
          : ["features", "dashboard", ...input.featureKeys]
      )
    );
    const role: AdminRole =
      input.role === "super_admin" ? "org_admin" : input.role;
    if (input.id) {
      const idx = packages.value.findIndex(p => p.id === input.id);
      if (idx >= 0) {
        const current = packages.value[idx]!;
        packages.value[idx] = {
          ...current,
          name: input.name,
          description: input.description ?? current.description,
          priceNote: input.priceNote ?? current.priceNote,
          role,
          featureKeys: keys
        };
        if (activePackageId.value === input.id) applyActivePackage();
        // Clear scope fields that no longer apply when package role changes
        users.value = users.value.map(u => {
          if (u.packageId !== input.id) return u;
          return normalizeUser({
            ...u,
            locationIds: role === "location_admin" ? u.locationIds : [],
            hotelIds: role === "hotel_admin" ? u.hotelIds : []
          });
        });
        persist();
        return packages.value[idx];
      }
    }
    const pkg: ProductPackage = {
      id: uid("pkg"),
      name: input.name,
      description: input.description ?? "",
      priceNote: input.priceNote ?? "Custom",
      role,
      featureKeys: keys,
      isSystem: false
    };
    packages.value.push(pkg);
    persist();
    return pkg;
  }

  function deletePackage(id: string) {
    const pkg = packages.value.find(p => p.id === id);
    if (!pkg || pkg.isSystem) return false;
    packages.value = packages.value.filter(p => p.id !== id);
    if (activePackageId.value === id) {
      activePackageId.value = DEFAULT_ACTIVE_PACKAGE_ID;
      applyActivePackage();
    }
    // Reassign users that were on the deleted package
    users.value = users.value.map(u =>
      u.packageId === id ? { ...u, packageId: activePackageId.value } : u
    );
    persist();
    return true;
  }

  function getPackageById(id: string) {
    return packages.value.find(p => p.id === id) ?? null;
  }

  /** Role is owned by the package — never stored on the user */
  function getUserRole(user: AdminUser | null | undefined): AdminRole | null {
    if (!user?.packageId) return null;
    return getPackageById(user.packageId)?.role ?? null;
  }

  function usersOnPackage(packageId: string) {
    return users.value.filter(u => u.packageId === packageId);
  }

  function duplicatePackage(id: string) {
    const src = packages.value.find(p => p.id === id);
    if (!src) return null;
    return upsertPackage({
      name: `${src.name} (copy)`,
      description: src.description,
      priceNote: src.priceNote,
      featureKeys: [...src.featureKeys],
      role: src.role
    });
  }

  function setFeatureEnabled(key: string, enabled: boolean) {
    const feat = features.value.find(f => f.key === key);
    if (!feat) return null;
    if (feat.key === "features") return feat;
    feat.enabled = enabled;
    // Keep active package in sync when toggling manually
    const pkg = packages.value.find(p => p.id === activePackageId.value);
    if (pkg) {
      const set = new Set(pkg.featureKeys);
      if (enabled) set.add(key);
      else set.delete(key);
      pkg.featureKeys = Array.from(set);
    }
    persist();
    return feat;
  }

  function setFeaturePaidAddOn(key: string, paidAddOn: boolean) {
    const feat = features.value.find(f => f.key === key);
    if (!feat) return null;
    feat.paidAddOn = paidAddOn;
    persist();
    return feat;
  }

  function resetToSeed() {
    hotels.value = clone(seedHotels);
    roomTypes.value = clone(seedRooms);
    ratePlans.value = clone(seedRates);
    locations.value = clone(seedLocations);
    news.value = clone(seedNews);
    bookings.value = [];
    enquiries.value = [];
    users.value = clone(seedUsers).map(normalizeUser);
    settings.value = { ...defaultSettings };
    availability.value = [];
    rateCalendar.value = [];
    features.value = mergeFeatures();
    packages.value = mergePackages();
    activePackageId.value = DEFAULT_ACTIVE_PACKAGE_ID;
    applyActivePackage();
    seedMediaFromContent();
    persist();
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
    "org_admin",
    "location_admin",
    "hotel_admin",
    "customer",
    "content_admin",
    "booking_admin"
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
    persist,
    hydrate
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCmsStore, import.meta.hot));
}
