import {
  createPublicBooking,
  createPublicEnquiry,
  getBookingByReference as fetchBookingByReference,
  searchAvailability as fetchAvailability
} from "@/services/engine/ops";
import { useCmsStore } from "@/stores/cms-store";
import type {
  AvailabilityResult,
  Booking,
  BookingGuest,
  BookingSearchParams,
  Enquiry
} from "@/types/greyon";

export async function searchAvailability(
  params: BookingSearchParams
): Promise<AvailabilityResult[]> {
  return fetchAvailability(params);
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
  try {
    const booking = await createPublicBooking(input);
    const cms = useCmsStore();
    const idx = cms.bookings.findIndex((b: Booking) => b.id === booking.id);
    if (idx >= 0) cms.bookings[idx] = booking;
    else cms.bookings.unshift(booking);
    return { ok: true, booking };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Booking failed."
    };
  }
}

export async function getBookingByReference(reference: string) {
  return fetchBookingByReference(reference);
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
  const enquiry = await createPublicEnquiry(input);
  const cms = useCmsStore();
  cms.enquiries.unshift(enquiry);
  return enquiry;
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
