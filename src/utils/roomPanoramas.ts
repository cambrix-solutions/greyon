import { ApiError } from "@/helpers/api/createApiClient";
import type { PanoramaTourRoom, RoomPanorama, RoomType } from "@/types/greyon";
import { friendlyApiError } from "@/utils/apiErrors";

/**
 * The published 360° photos guests should see for a room, in the admin's
 * order. Falls back to the legacy single `panoramaUrl` when the engine
 * has not sent a `panoramas` list. Empty means "coming soon".
 */
export function publishedRoomPanoramas(
  room: Pick<RoomType, "panoramaUrl" | "panoramas"> | null | undefined
): RoomPanorama[] {
  if (!room) return [];
  if (room.panoramas?.length) {
    return room.panoramas.filter(photo => photo.isPublished && photo.url);
  }
  const single = room.panoramaUrl?.trim();
  if (!single) return [];
  return [
    {
      id: "legacy",
      url: single,
      caption: null,
      isPublished: true,
      sortOrder: 0,
      hotspots: []
    }
  ];
}

/**
 * The 360° photos guests should see for a room, in the admin's order.
 *
 * Uses `panoramas` when the engine sent it (published ones only). An older
 * payload, or a room that was never copied into the new list, falls back to
 * the single `panoramaUrl`. Empty means "show the coming soon message".
 */
export function roomPanoramaUrls(
  room: Pick<RoomType, "panoramaUrl" | "panoramas"> | null | undefined
): string[] {
  return publishedRoomPanoramas(room).map(photo => photo.url);
}

/** Rooms in a hotel that guests can switch to in the 360° viewer. */
export function tourRoomsFromList(rooms: RoomType[]): PanoramaTourRoom[] {
  return rooms
    .map(room => ({
      id: room.id,
      name: room.name,
      photos: publishedRoomPanoramas(room)
    }))
    .filter(room => room.photos.length > 0);
}

/** Guest-facing label for the current 360° photo. */
export function roomPanoramaLabel(
  roomName: string,
  photo: RoomPanorama | undefined,
  index: number,
  total: number
): string {
  const name = roomName.trim() || "360° view";
  const caption = photo?.caption?.trim();
  if (caption) return `${name} · ${caption}`;
  if (total > 1) return `${name} · ${index + 1}`;
  return name;
}

/** Hover label on a hotspot. Uses the arrow's own label when set. */
export function hotspotLabel(
  roomName: string,
  hotspot: { label: string | null; targetPanoramaId: string },
  photos: RoomPanorama[]
): string {
  const own = hotspot.label?.trim();
  if (own) return own;
  const target = photos.find(photo => photo.id === hotspot.targetPanoramaId);
  const caption = target?.caption?.trim();
  const name = roomName.trim() || "360° view";
  if (caption) return `${name} · ${caption}`;
  if (target) {
    const n = photos.findIndex(photo => photo.id === target.id);
    return n >= 0 ? `${name} · ${n + 1}` : name;
  }
  return name;
}

/** Where a one-by-one 360° upload is: photo `current` of `total`, 1-based. */
export type PanoramaProgress = { current: number; total: number; name: string };

/** One short, readable reason a single 360° upload failed. */
export function panoramaUploadMessage(e: unknown): string {
  if (e instanceof ApiError && e.status === 413) {
    return "too large (the server refused the file).";
  }
  return friendlyApiError(e, "Upload failed.");
}
