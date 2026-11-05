/** "Greyon … — 1-Bedroom — Middle Room" from the linked hotel and room names. */
export function roomWithPropertyLabel(
  propertyName: string | null | undefined,
  roomName: string | null | undefined
): string {
  const property = propertyName?.trim() ?? "";
  const room = roomName?.trim() ?? "";
  if (!property) return room;
  if (!room) return property;
  const foldedRoom = room.toLowerCase();
  const foldedProperty = property.toLowerCase();
  if (
    foldedRoom === foldedProperty ||
    foldedRoom.startsWith(`${foldedProperty} —`) ||
    foldedRoom.startsWith(`${foldedProperty} -`) ||
    foldedRoom.startsWith(`${foldedProperty}:`)
  ) {
    return room;
  }
  return `${property} — ${room}`;
}

/** True when the bed label would only repeat words already in the room name. */
export function bedLabelAddsDetail(
  roomName: string | null | undefined,
  bedType: string | null | undefined
): boolean {
  const bed = bedType?.trim() ?? "";
  if (!bed) return false;
  const fold = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return !fold(roomName ?? "").includes(fold(bed));
}
