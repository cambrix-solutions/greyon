import { engineAPI } from "@/helpers/api";
import {
  mapEngineAvailability,
  mapEngineBooking,
  mapEngineEnquiry,
  mapEngineMedia,
  mapEngineNews,
  mapEngineRateCalendar,
  mapEngineSettings,
  type EngineAvailability,
  type EngineBooking,
  type EngineEnquiry,
  type EngineMediaItem,
  type EngineNews,
  type EngineRateCalendar,
  type EngineSiteSettings,
  type MediaItem,
  type SiteSettings
} from "@/services/engine/mappers";
import type {
  Availability,
  Booking,
  BookingStatus,
  ContentStatus,
  Enquiry,
  EnquiryStatus,
  NewsArticle,
  RateCalendar
} from "@/types/greyon";

function numId(id: string) {
  return Number(id);
}

// —— News ——

export async function fetchAdminNews(): Promise<NewsArticle[]> {
  const { news } = await engineAPI.get<{ news: EngineNews[] }>("/admin/news");
  return (news ?? []).map(mapEngineNews);
}

export async function fetchPublicNews(): Promise<NewsArticle[]> {
  const { news } = await engineAPI.get<{ news: EngineNews[] }>("/news");
  return (news ?? []).map(mapEngineNews);
}

export type NewsInput = {
  title: string;
  slug: string;
  coverImage?: string;
  excerpt?: string;
  body?: string;
  publishedAt?: string;
  status?: ContentStatus;
  seoTitle?: string;
  seoDescription?: string;
};

export async function createNews(input: NewsInput) {
  const { news } = await engineAPI.post<{ news: EngineNews }>(
    "/admin/news",
    input
  );
  return mapEngineNews(news);
}

export async function updateNews(id: string, input: Partial<NewsInput>) {
  const { news } = await engineAPI.patch<{ news: EngineNews }>(
    `/admin/news/${numId(id)}`,
    input
  );
  return mapEngineNews(news);
}

export async function destroyNews(id: string) {
  await engineAPI.delete(`/admin/news/${numId(id)}`);
}

// —— Bookings (admin) ——

export async function fetchAdminBookings(): Promise<Booking[]> {
  const { bookings } = await engineAPI.get<{ bookings: EngineBooking[] }>(
    "/admin/bookings"
  );
  return (bookings ?? []).map(mapEngineBooking);
}

export async function createAdminBooking(input: {
  hotelId: string;
  roomTypeId: string;
  ratePlanId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  guest: {
    fullName: string;
    email: string;
    phone: string;
    specialRequests?: string;
  };
  status?: BookingStatus;
  notes?: string;
}) {
  const { booking } = await engineAPI.post<{ booking: EngineBooking }>(
    "/admin/bookings",
    {
      hotelId: numId(input.hotelId),
      roomTypeId: numId(input.roomTypeId),
      ratePlanId: numId(input.ratePlanId),
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      rooms: input.rooms,
      adults: input.adults,
      children: input.children,
      guestFullName: input.guest.fullName,
      guestEmail: input.guest.email,
      guestPhone: input.guest.phone,
      specialRequests: input.guest.specialRequests,
      status: input.status,
      notes: input.notes
    }
  );
  return mapEngineBooking(booking);
}

export async function updateAdminBooking(
  id: string,
  patch: { status?: BookingStatus; notes?: string }
) {
  const { booking } = await engineAPI.patch<{ booking: EngineBooking }>(
    `/admin/bookings/${numId(id)}`,
    patch
  );
  return mapEngineBooking(booking);
}

// —— Enquiries ——

export async function fetchAdminEnquiries(): Promise<Enquiry[]> {
  const { enquiries } = await engineAPI.get<{ enquiries: EngineEnquiry[] }>(
    "/admin/enquiries"
  );
  return (enquiries ?? []).map(mapEngineEnquiry);
}

export async function updateAdminEnquiry(
  id: string,
  patch: Partial<Pick<Enquiry, "status" | "internalNotes">>
) {
  const body: Record<string, unknown> = {};
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.internalNotes !== undefined)
    body.internalNotes = patch.internalNotes;
  const { enquiry } = await engineAPI.patch<{ enquiry: EngineEnquiry }>(
    `/admin/enquiries/${numId(id)}`,
    body
  );
  return mapEngineEnquiry(enquiry);
}

// —— Media ——

export async function fetchAdminMedia(): Promise<MediaItem[]> {
  const { media } = await engineAPI.get<{ media: EngineMediaItem[] }>(
    "/admin/media"
  );
  return (media ?? []).map(mapEngineMedia);
}

export async function createMedia(src: string, alt: string) {
  const { mediaItem } = await engineAPI.post<{ mediaItem: EngineMediaItem }>(
    "/admin/media",
    { src, alt }
  );
  return mapEngineMedia(mediaItem);
}

export async function updateMediaItem(
  id: string,
  patch: Partial<Pick<MediaItem, "src" | "alt">>
) {
  const { mediaItem } = await engineAPI.patch<{ mediaItem: EngineMediaItem }>(
    `/admin/media/${numId(id)}`,
    patch
  );
  return mapEngineMedia(mediaItem);
}

export async function destroyMedia(id: string) {
  await engineAPI.delete(`/admin/media/${numId(id)}`);
}

// —— Settings ——

export async function fetchPublicSettings(
  fallback: SiteSettings
): Promise<SiteSettings> {
  const { settings } = await engineAPI.get<{ settings: EngineSiteSettings }>(
    "/settings"
  );
  return mapEngineSettings(settings, fallback);
}

export async function fetchAdminSettings(
  fallback: SiteSettings
): Promise<SiteSettings> {
  const { settings } = await engineAPI.get<{ settings: EngineSiteSettings }>(
    "/admin/settings"
  );
  return mapEngineSettings(settings, fallback);
}

export async function updateAdminSettings(
  patch: Partial<SiteSettings>,
  fallback: SiteSettings
): Promise<SiteSettings> {
  const { settings } = await engineAPI.patch<{ settings: EngineSiteSettings }>(
    "/admin/settings",
    patch
  );
  return mapEngineSettings(settings, fallback);
}

// —— Availability / rate calendar ——

export async function fetchAdminAvailabilities(): Promise<Availability[]> {
  const { availabilities } = await engineAPI.get<{
    availabilities: EngineAvailability[];
  }>("/admin/availabilities");
  return (availabilities ?? []).map(mapEngineAvailability);
}

export async function upsertAdminAvailability(input: {
  roomTypeId: string;
  date: string;
  availableUnits: number;
  stopSell: boolean;
}) {
  const { availability } = await engineAPI.post<{
    availability: EngineAvailability;
  }>("/admin/availabilities/upsert", {
    roomTypeId: numId(input.roomTypeId),
    date: input.date,
    availableUnits: input.availableUnits,
    stopSell: input.stopSell
  });
  return mapEngineAvailability(availability);
}

export async function destroyAvailability(id: string) {
  await engineAPI.delete(`/admin/availabilities/${numId(id)}`);
}

export async function fetchAdminRateCalendars(): Promise<RateCalendar[]> {
  const { rateCalendars } = await engineAPI.get<{
    rateCalendars: EngineRateCalendar[];
  }>("/admin/rate-calendars");
  return (rateCalendars ?? []).map(mapEngineRateCalendar);
}

export async function upsertAdminRateCalendar(input: {
  ratePlanId: string;
  date: string;
  price: number;
  minStay?: number;
  maxStay?: number;
}) {
  const body: Record<string, unknown> = {
    ratePlanId: numId(input.ratePlanId),
    date: input.date,
    price: input.price
  };
  if (input.minStay !== undefined) body.minStay = input.minStay;
  if (input.maxStay !== undefined) body.maxStay = input.maxStay;
  const { rateCalendar } = await engineAPI.post<{
    rateCalendar: EngineRateCalendar;
  }>("/admin/rate-calendars/upsert", body);
  return mapEngineRateCalendar(rateCalendar);
}

export async function destroyRateCalendar(id: string) {
  await engineAPI.delete(`/admin/rate-calendars/${numId(id)}`);
}

export type { MediaItem, SiteSettings, EnquiryStatus };
