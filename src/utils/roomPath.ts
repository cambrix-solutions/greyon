import type { Hotel, RoomType } from "@/types/greyon";

/** Public path for a room detail page. */
export function roomDetailPath(
  hotel: Pick<Hotel, "slug"> | string,
  room: Pick<RoomType, "slug" | "id"> | string
): string {
  const hotelSlug = typeof hotel === "string" ? hotel : hotel.slug;
  const roomKey =
    typeof room === "string" ? room : room.slug?.trim() || room.id;
  return `/hotels/${encodeURIComponent(hotelSlug)}/rooms/${encodeURIComponent(roomKey)}`;
}
