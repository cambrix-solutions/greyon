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

/** Room row was saved; the follow-up multipart `panorama` upload failed. */
export class RoomPanoramaUploadError extends Error {
  readonly room: RoomType;

  constructor(message: string, room: RoomType) {
    super(message);
    this.name = "RoomPanoramaUploadError";
    this.room = room;
  }
}

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
  phone?: string;
  email?: string;
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
  area?: string;
  propertyType?: string;
  starRating?: number | null;
  nearbyLandmarks?: { place: string; distance: string }[];
  coordinates?: { lat: number; lng: number };
  mapEmbedUrl?: string | null;
  phone?: string;
  email?: string;
  heroImage?: string;
  gallery?: string[];
  amenities?: string[];
  policies?: string[];
  /** Replace linked services; omit to leave unchanged; [] clears. */
  serviceIds?: Array<string | number>;
  /** Replace linked products; omit to leave unchanged; [] clears. */
  productIds?: Array<string | number>;
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
  /**
   * JPG or WebP, max 15 MB. Multipart field `panorama` on
   * POST /admin/room-types and PATCH /admin/room-types/{id}.
   */
  panoramaFile?: File;
  /**
   * PATCH only. JSON `remove_panorama: 1` deletes the stored photo.
   * Ignored when `panoramaFile` is set (a new file wins).
   */
  removePanorama?: boolean;
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

function mapIdList(ids: Array<string | number> | undefined) {
  if (ids === undefined) return undefined;
  return ids.map(id => Number(id));
}

export async function createHotel(input: HotelInput) {
  const { hotel } = await engineAPI.post<{ hotel: EngineHotel }>(
    "/admin/hotels",
    {
      ...input,
      locationId: numId(input.locationId),
      ...(input.serviceIds !== undefined
        ? { serviceIds: mapIdList(input.serviceIds) }
        : {}),
      ...(input.productIds !== undefined
        ? { productIds: mapIdList(input.productIds) }
        : {})
    }
  );
  return mapEngineHotel(hotel);
}

export async function updateHotel(id: string, input: Partial<HotelInput>) {
  const body: Record<string, unknown> = { ...input };
  if (input.locationId !== undefined) body.locationId = numId(input.locationId);
  if (input.serviceIds !== undefined) {
    body.serviceIds = mapIdList(input.serviceIds);
  }
  if (input.productIds !== undefined) {
    body.productIds = mapIdList(input.productIds);
  }
  const { hotel } = await engineAPI.patch<{ hotel: EngineHotel }>(
    `/admin/hotels/${numId(id)}`,
    body
  );
  return mapEngineHotel(hotel);
}

export async function destroyHotel(id: string) {
  await engineAPI.delete(`/admin/hotels/${numId(id)}`);
}

function roomJsonBody(
  input: Partial<RoomTypeInput>,
  withHotelId: boolean
): Record<string, unknown> {
  const { panoramaFile: _file, removePanorama, ...rest } = input;
  const body: Record<string, unknown> = { ...rest };
  if (withHotelId && rest.hotelId !== undefined) {
    body.hotelId = numId(String(rest.hotelId));
  }
  // Engine boolean rule. A new file is sent separately and wins, so this
  // flag is omitted when a panorama file is attached.
  if (removePanorama) body.remove_panorama = 1;
  return body;
}

/** Scalar room fields plus images[n] / amenities[n]. Empty lists are omitted. */
function appendRoomFields(form: FormData, input: Partial<RoomTypeInput>) {
  const { panoramaFile: _file, removePanorama: _remove, ...rest } = input;
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || value === null) continue;
    if (key === "hotelId") {
      form.append(key, String(numId(String(value))));
      continue;
    }
    if (key === "images" || key === "amenities") {
      const list = (Array.isArray(value) ? value : [])
        .map(item => String(item).trim())
        .filter(Boolean);
      list.forEach((item, index) => form.append(`${key}[${index}]`, item));
      continue;
    }
    form.append(key, String(value));
  }
}

/** Multipart field `panorama` on PATCH /admin/room-types/{id}. */
async function uploadRoomPanorama(id: string, file: File): Promise<RoomType> {
  const form = new FormData();
  form.append("panorama", file, file.name);
  const { roomType } = await engineAPI.request<{ roomType: EngineRoomType }>(
    `/admin/room-types/${numId(id)}`,
    { method: "PATCH", body: form }
  );
  return mapEngineRoomType(roomType);
}

function panoramaUploadFailed(
  error: unknown,
  room: RoomType
): RoomPanoramaUploadError {
  const detail =
    error instanceof Error && error.message ? error.message : "Upload failed.";
  return new RoomPanoramaUploadError(
    `The room was saved, but the 360° photo was not. ${detail}`,
    room
  );
}

export async function createRoomType(input: RoomTypeInput) {
  const file = input.panoramaFile instanceof File ? input.panoramaFile : null;
  if (file) {
    const form = new FormData();
    appendRoomFields(form, input);
    form.append("panorama", file, file.name);
    const { roomType } = await engineAPI.request<{ roomType: EngineRoomType }>(
      "/admin/room-types",
      { method: "POST", body: form }
    );
    return mapEngineRoomType(roomType);
  }
  const { roomType } = await engineAPI.post<{ roomType: EngineRoomType }>(
    "/admin/room-types",
    roomJsonBody(input, true)
  );
  return mapEngineRoomType(roomType);
}

export async function updateRoomType(
  id: string,
  input: Partial<RoomTypeInput>
) {
  const file = input.panoramaFile instanceof File ? input.panoramaFile : null;
  const { roomType } = await engineAPI.patch<{ roomType: EngineRoomType }>(
    `/admin/room-types/${numId(id)}`,
    roomJsonBody(
      {
        ...input,
        removePanorama: Boolean(input.removePanorama) && !file
      },
      input.hotelId !== undefined
    )
  );
  const mapped = mapEngineRoomType(roomType);
  if (!file) return mapped;
  try {
    return await uploadRoomPanorama(id, file);
  } catch (error) {
    throw panoramaUploadFailed(error, mapped);
  }
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
