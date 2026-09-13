import { apiFetch, isApiEnabled } from "@/services/api";
import { useCmsStore } from "@/stores/cms-store";
import type {
  AvailabilityResult,
  Booking,
  BookingGuest,
  BookingSearchParams,
  Enquiry
} from "@/types/greyon";

/** Pinia CMS by default; Nest API when VITE_USE_API=true. */

export function searchAvailability(params: BookingSearchParams) {
  if (!isApiEnabled()) {
    return useCmsStore().searchAvailability(params);
  }
  const qs = new URLSearchParams({
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    rooms: String(params.rooms),
    adults: String(params.adults),
    children: String(params.children),
    ...(params.locationSlug ? { locationSlug: params.locationSlug } : {}),
    ...(params.hotelSlug ? { hotelSlug: params.hotelSlug } : {})
  });
  return apiFetch<AvailabilityResult[]>(`/availability?${qs.toString()}`);
}

export async function createBooking(input: {
  hotelId: string;
  roomTypeId: string;
  ratePlanId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  guest: BookingGuest;
}): Promise<{ ok: true; booking: Booking } | { ok: false; message: string }> {
  if (!isApiEnabled()) {
    return useCmsStore().createBooking(input);
  }
  try {
    const saved = await apiFetch<{
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
      guestFullName: string;
      guestEmail: string;
      guestPhone: string;
      specialRequests?: string;
      subtotal: number;
      taxesFees: number;
      total: number;
      status: Booking["status"];
      source: "website" | "admin";
      createdAt: string;
    }>("/bookings", {
      method: "POST",
      body: JSON.stringify({
        hotelId: input.hotelId,
        roomTypeId: input.roomTypeId,
        ratePlanId: input.ratePlanId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        rooms: input.rooms,
        adults: input.adults,
        children: input.children,
        guestFullName: input.guest.fullName,
        guestEmail: input.guest.email,
        guestPhone: input.guest.phone,
        specialRequests: input.guest.specialRequests
      })
    });
    const booking: Booking = {
      id: saved.id,
      reference: saved.reference,
      hotelId: saved.hotelId,
      roomTypeId: saved.roomTypeId,
      ratePlanId: saved.ratePlanId,
      checkIn: saved.checkIn,
      checkOut: saved.checkOut,
      rooms: saved.rooms,
      adults: saved.adults,
      children: saved.children,
      guest: {
        fullName: saved.guestFullName,
        email: saved.guestEmail,
        phone: saved.guestPhone,
        ...(saved.specialRequests
          ? { specialRequests: saved.specialRequests }
          : {})
      },
      subtotal: Number(saved.subtotal),
      taxesFees: Number(saved.taxesFees),
      total: Number(saved.total),
      status: saved.status,
      source: saved.source,
      createdAt: saved.createdAt
    };
    return { ok: true, booking };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Booking failed."
    };
  }
}

export function getBookingByReference(reference: string) {
  if (!isApiEnabled()) {
    return useCmsStore().getBookingByReference(reference);
  }
  return apiFetch(`/bookings/${reference}`);
}

export function listBookings(): Booking[] {
  return [...useCmsStore().bookings];
}

export function updateBookingStatus(
  reference: string,
  status: Booking["status"]
) {
  return useCmsStore().updateBookingStatus(reference, status);
}

export async function createEnquiry(
  input: Omit<Enquiry, "id" | "status" | "createdAt" | "internalNotes">
) {
  if (!isApiEnabled()) {
    return useCmsStore().createEnquiry(input);
  }
  return apiFetch("/enquiries", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function listEnquiries(): Enquiry[] {
  return [...useCmsStore().enquiries];
}

export function getRoomTypeById(id: string) {
  return useCmsStore().getRoomTypeById(id);
}

export function getRatePlanById(id: string) {
  return useCmsStore().getRatePlanById(id);
}

export function getHotelById(id: string) {
  return useCmsStore().getHotelById(id);
}
