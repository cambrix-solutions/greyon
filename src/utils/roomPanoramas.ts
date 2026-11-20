import type { RoomType } from "@/types/greyon";

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
