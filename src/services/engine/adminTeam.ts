import { engineAPI } from "@/helpers/api";
import {
  mapAdminsToUsers,
  type AdminUpsertInput,
  type DeveloperAdminBundle
} from "@/services/engine/developer";
import {
  mapEnginePackage,
  type EngineAdmin,
  type EnginePackage
} from "@/services/engine/mappers";
import type { ProductPackage } from "@/types/greyon";

function numId(id: string | number) {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error(`Invalid id: ${id}`);
  return n;
}

function packagesPayload(input: AdminUpsertInput) {
  return input.packageIds.map(packageId => ({
    packageId: numId(packageId),
    locationIds: (input.locationIds ?? []).map(numId),
    hotelIds: (input.hotelIds ?? []).map(numId)
  }));
}

/** Seat types assignable by org admins (manager / hotel_admin packages). */
export async function fetchAdminSeats(): Promise<ProductPackage[]> {
  const { seats } = await engineAPI.get<{ seats: EnginePackage[] }>(
    "/admin/seats"
  );
  return (seats ?? []).map(mapEnginePackage);
}

export async function fetchAdminTeam(): Promise<DeveloperAdminBundle> {
  const { admins } = await engineAPI.get<{ admins: EngineAdmin[] }>(
    "/admin/team"
  );
  return mapAdminsToUsers(admins ?? []);
}

export async function createAdminTeamMember(
  input: AdminUpsertInput
): Promise<DeveloperAdminBundle> {
  const body: Record<string, unknown> = {
    name: input.name,
    email: input.email,
    packages: packagesPayload(input)
  };
  if (input.password) body.password = input.password;
  const { admin } = await engineAPI.post<{ admin: EngineAdmin }>(
    "/admin/team",
    body
  );
  return mapAdminsToUsers([admin]);
}

export async function updateAdminTeamMember(
  input: AdminUpsertInput & { id: string }
): Promise<DeveloperAdminBundle> {
  const body: Record<string, unknown> = {
    name: input.name,
    email: input.email,
    packages: packagesPayload(input)
  };
  if (input.password) body.password = input.password;
  const { admin } = await engineAPI.patch<{ admin: EngineAdmin }>(
    `/admin/team/${numId(input.id)}`,
    body
  );
  return mapAdminsToUsers([admin]);
}

export async function destroyAdminTeamMember(id: string) {
  await engineAPI.delete(`/admin/team/${numId(id)}`);
}
