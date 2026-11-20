import { ApiError } from "@/helpers/api/createApiClient";
import type { RoomType } from "@/types/greyon";
import { friendlyApiError } from "@/utils/apiErrors";

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
  if (!room) return [];
  if (room.panoramas?.length) {
    return room.panoramas
      .filter(photo => photo.isPublished && photo.url)
      .map(photo => photo.url);
  }
  const single = room.panoramaUrl?.trim();
  return single ? [single] : [];
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
