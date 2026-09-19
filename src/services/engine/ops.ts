import { engineAPI } from "@/helpers/api";
import {
  mapEngineAvailabilityResult,
  mapEngineBooking,
  mapEngineEnquiry,
  type EngineAvailabilityResult,
  type EngineBooking,
  type EngineEnquiry
} from "@/services/engine/mappers";
import type {
  AvailabilityResult,
  Booking,
  BookingGuest,
  BookingSearchParams,
  Enquiry
} from "@/types/greyon";

function numId(id: string) {
  return Number(id);
}

/** Public availability search — engine returns `{ results: [...] }`. */
export async function searchAvailability(
  params: BookingSearchParams
): Promise<AvailabilityResult[]> {
  const qs = new URLSearchParams({
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    rooms: String(params.rooms),
    adults: String(params.adults),
    children: String(params.children),
    ...(params.locationSlug ? { locationSlug: params.locationSlug } : {}),
    ...(params.hotelSlug ? { hotelSlug: params.hotelSlug } : {})
  });
  const payload = await engineAPI.get<{ results: EngineAvailabilityResult[] }>(
    `/availability?${qs.toString()}`
  );
  return (payload.results ?? []).map(mapEngineAvailabilityResult);
}

export async function createPublicBooking(input: {
  hotelId: string;
  roomTypeId: string;
  ratePlanId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  guest: BookingGuest;
}): Promise<Booking> {
  const { booking } = await engineAPI.post<{ booking: EngineBooking }>(
    "/bookings",
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
      specialRequests: input.guest.specialRequests
    }
  );
  return mapEngineBooking(booking);
}

export async function getBookingByReference(
  reference: string
): Promise<Booking> {
  const { booking } = await engineAPI.get<{ booking: EngineBooking }>(
    `/bookings/${encodeURIComponent(reference)}`
  );
  return mapEngineBooking(booking);
}

export async function createPublicEnquiry(
  input: Omit<Enquiry, "id" | "status" | "createdAt" | "internalNotes">
): Promise<Enquiry> {
  const { enquiry } = await engineAPI.post<{ enquiry: EngineEnquiry }>(
    "/enquiries",
    {
      name: input.name,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
      consent: input.consent
    }
  );
  return mapEngineEnquiry(enquiry);
}
