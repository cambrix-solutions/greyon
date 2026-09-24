import { engineAPI } from "@/helpers/api";
import {
  mapEngineHotel,
  mapEngineLocation,
  mapEngineRatePlan,
  mapEngineRoomType,
  type EngineHotel,
  type EngineLocation,
  type EngineRatePlan,
  type EngineRoomType
} from "@/services/engine/mappers";
import type {
  ContentStatus,
  Hotel,
  Location,
  RatePlan,
  RoomType
} from "@/types/greyon";

export type AdminCatalog = {
  locations: Location[];
  hotels: Hotel[];
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
};

export async function fetchAdminLocations(): Promise<Location[]> {
  const { locations } = await engineAPI.get<{ locations: EngineLocation[] }>(
    "/admin/locations"
  );
  return (locations ?? []).map(mapEngineLocation);
}

export async function fetchAdminHotels(): Promise<Hotel[]> {
  const { hotels } = await engineAPI.get<{ hotels: EngineHotel[] }>(
    "/admin/hotels"
  );
  return (hotels ?? []).map(mapEngineHotel);
}

export async function fetchAdminRoomTypes(): Promise<RoomType[]> {
  const { roomTypes } = await engineAPI.get<{ roomTypes: EngineRoomType[] }>(
    "/admin/room-types"
  );
  return (roomTypes ?? []).map(mapEngineRoomType);
}

export async function fetchAdminRatePlans(): Promise<RatePlan[]> {
  const { ratePlans } = await engineAPI.get<{ ratePlans: EngineRatePlan[] }>(
    "/admin/rate-plans"
  );
  return (ratePlans ?? []).map(mapEngineRatePlan);
}

/** Prefer page-level ensure* loaders — kept for rare full refresh. */
export async function fetchAdminCatalog(): Promise<AdminCatalog> {
  const [locations, hotels, roomTypes, ratePlans] = await Promise.all([
    fetchAdminLocations(),
    fetchAdminHotels(),
    fetchAdminRoomTypes(),
    fetchAdminRatePlans()
  ]);
  return { locations, hotels, roomTypes, ratePlans };
}

export type LocationInput = {
  name: string;
  slug: string;
  description?: string;
  heroImage?: string;
  gallery?: string[];
  highlights?: string[];
  status?: ContentStatus;
  seoTitle?: string;
  seoDescription?: string;
};

export type HotelInput = {
  name: string;
  locationId: string;
  slug: string;
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
};

export type RoomTypeInput = {
  name: string;
  hotelId: string;
  slug: string;
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
};

export type RatePlanInput = {
  name: string;
  roomTypeId: string;
  description?: string;
  mealBenefit?: string;
  cancellationPolicy?: string;
  basePrice?: number;
  taxPercent?: number;
  serviceFeePercent?: number;
  status?: ContentStatus;
};

function numId(id: string) {
  return Number(id);
}

export async function createLocation(input: LocationInput) {
  const { location } = await engineAPI.post<{ location: EngineLocation }>(
    "/admin/locations",
    input
  );
  return mapEngineLocation(location);
}

export async function updateLocation(
  id: string,
  input: Partial<LocationInput>
) {
  const { location } = await engineAPI.patch<{ location: EngineLocation }>(
    `/admin/locations/${numId(id)}`,
    input
  );
  return mapEngineLocation(location);
}

export async function destroyLocation(id: string) {
  await engineAPI.delete(`/admin/locations/${numId(id)}`);
}

export async function createHotel(input: HotelInput) {
  const { hotel } = await engineAPI.post<{ hotel: EngineHotel }>(
    "/admin/hotels",
    {
      ...input,
      locationId: numId(input.locationId)
    }
  );
  return mapEngineHotel(hotel);
}

export async function updateHotel(id: string, input: Partial<HotelInput>) {
  const body: Record<string, unknown> = { ...input };
  if (input.locationId !== undefined) body.locationId = numId(input.locationId);
  const { hotel } = await engineAPI.patch<{ hotel: EngineHotel }>(
    `/admin/hotels/${numId(id)}`,
    body
  );
  return mapEngineHotel(hotel);
}

export async function destroyHotel(id: string) {
  await engineAPI.delete(`/admin/hotels/${numId(id)}`);
}

export async function createRoomType(input: RoomTypeInput) {
  const { roomType } = await engineAPI.post<{ roomType: EngineRoomType }>(
    "/admin/room-types",
    { ...input, hotelId: numId(input.hotelId) }
  );
  return mapEngineRoomType(roomType);
}

export async function updateRoomType(
  id: string,
  input: Partial<RoomTypeInput>
) {
  const body: Record<string, unknown> = { ...input };
  if (input.hotelId !== undefined) body.hotelId = numId(input.hotelId);
  const { roomType } = await engineAPI.patch<{ roomType: EngineRoomType }>(
    `/admin/room-types/${numId(id)}`,
    body
  );
  return mapEngineRoomType(roomType);
}

export async function destroyRoomType(id: string) {
  await engineAPI.delete(`/admin/room-types/${numId(id)}`);
}

export async function createRatePlan(input: RatePlanInput) {
  const { ratePlan } = await engineAPI.post<{ ratePlan: EngineRatePlan }>(
    "/admin/rate-plans",
    { ...input, roomTypeId: numId(input.roomTypeId) }
  );
  return mapEngineRatePlan(ratePlan);
}

export async function updateRatePlan(
  id: string,
  input: Partial<RatePlanInput>
) {
  const body: Record<string, unknown> = { ...input };
  if (input.roomTypeId !== undefined) body.roomTypeId = numId(input.roomTypeId);
  const { ratePlan } = await engineAPI.patch<{ ratePlan: EngineRatePlan }>(
    `/admin/rate-plans/${numId(id)}`,
    body
  );
  return mapEngineRatePlan(ratePlan);
}

export async function destroyRatePlan(id: string) {
  await engineAPI.delete(`/admin/rate-plans/${numId(id)}`);
}
