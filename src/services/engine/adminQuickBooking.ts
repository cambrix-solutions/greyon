import { engineAPI } from "@/helpers/api";
import {
  mapEngineBooking,
  type EngineBooking
} from "@/services/engine/mappers";
import type {
  Booking,
  PaymentMethod,
  QuickBookInventory,
  QuickBookRoom
} from "@/types/greyon";

function numId(id: string) {
  return Number(id);
}

type EngineQuickBookRoom = {
  roomTypeId: number | string;
  name: string;
  bedType?: string | null;
  roomSize?: string | null;
  maxGuests?: number | null;
  image?: string | null;
  ratePlanId: number | string;
  nights?: number;
  nightly?: number;
  subtotal?: number;
  taxesFees?: number;
  total?: number;
  availableUnits?: number;
  soldOut?: boolean;
};

type EngineQuickBookInventory = {
  hotel: {
    id: number | string;
    name: string;
    slug: string;
    locationName?: string | null;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
  nights?: number;
  roomTypes?: EngineQuickBookRoom[];
};

function mapRoom(row: EngineQuickBookRoom): QuickBookRoom {
  return {
    roomTypeId: String(row.roomTypeId),
    name: row.name,
    bedType: row.bedType ?? null,
    roomSize: row.roomSize ?? null,
    maxGuests: row.maxGuests ?? null,
    image: row.image ?? null,
    ratePlanId: String(row.ratePlanId),
    nights: Number(row.nights ?? 1),
    nightly: Number(row.nightly ?? 0),
    subtotal: Number(row.subtotal ?? 0),
    taxesFees: Number(row.taxesFees ?? 0),
    total: Number(row.total ?? 0),
    availableUnits: Number(row.availableUnits ?? 0),
    soldOut: Boolean(row.soldOut)
  };
}

/** Rooms at a hotel with nightly price and units left for the stay. */
export async function fetchQuickBookInventory(input: {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}): Promise<QuickBookInventory> {
  const qs = new URLSearchParams({
    hotelId: String(numId(input.hotelId)),
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: String(input.guests)
  });
  const payload = await engineAPI.get<EngineQuickBookInventory>(
    `/admin/reservations/quick/availability?${qs.toString()}`
  );
  return {
    hotel: {
      id: String(payload.hotel.id),
      name: payload.hotel.name,
      slug: payload.hotel.slug,
      locationName: payload.hotel.locationName ?? null
    },
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    guests: payload.guests,
    rooms: Number(payload.rooms ?? 1),
    nights: Number(payload.nights ?? 1),
    roomTypes: (payload.roomTypes ?? []).map(mapRoom)
  };
}

/** Create a confirmed reservation with a recorded payment method. */
export async function createQuickReservation(input: {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestFullName: string;
  guestPhone: string;
  guestEmail?: string;
  paymentMethod: PaymentMethod;
}): Promise<Booking> {
  const { booking } = await engineAPI.post<{ booking: EngineBooking }>(
    "/admin/reservations/quick",
    {
      roomTypeId: numId(input.roomTypeId),
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
      guestFullName: input.guestFullName,
      guestPhone: input.guestPhone,
      guestEmail: input.guestEmail?.trim() || undefined,
      paymentMethod: input.paymentMethod
    }
  );
  return mapEngineBooking(booking);
}
