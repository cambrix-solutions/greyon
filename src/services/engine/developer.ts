import { engineAPI } from "@/helpers/api";
import {
  mapEngineAdminToUser,
  mapEngineFeatureCatalog,
  mapEnginePackage,
  splitPackageKeys,
  type EngineAdmin,
  type EngineFeature,
  type EnginePackage,
  type EnginePermission,
  type EngineRole
} from "@/services/engine/mappers";
import type {
  AdminRole,
  AdminUser,
  ProductFeature,
  ProductPackage,
  UserPackage
} from "@/types/greyon";

function numId(id: string) {
  return Number(id);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export type AccessRole = {
  id: string;
  name: string;
  description: string;
  isGlobal: boolean;
  scope: "none" | "location" | "hotel" | string;
};

export type AccessFeature = {
  id: string;
  key: string;
  label: string;
  description: string;
  category: "admin" | "public" | string;
  sortOrder: number;
  permissionCount: number;
};

export type AccessPermission = {
  id: string;
  key: string;
  label: string;
  description: string;
  featureKey: string | null;
  sortOrder: number;
};

function mapRole(row: EngineRole): AccessRole {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description ?? "",
    isGlobal: Boolean(row.isGlobal),
    scope: row.scope || "none"
  };
}

function mapFeatureRow(row: EngineFeature): AccessFeature {
  return {
    id: String(row.id),
    key: row.key,
    label: row.label,
    description: row.description ?? "",
    category: row.category || "admin",
    sortOrder: Number(row.sortOrder ?? 0),
    permissionCount: row.permissions?.length ?? 0
  };
}

function mapPermissionRow(row: EnginePermission): AccessPermission {
  return {
    id: String(row.id),
    key: row.key,
    label: row.label,
    description: row.description ?? "",
    featureKey: row.featureKey ?? null,
    sortOrder: Number(row.sortOrder ?? 0)
  };
}

export async function fetchDeveloperFeatures(): Promise<ProductFeature[]> {
  const { features } = await engineAPI.get<{ features: EngineFeature[] }>(
    "/developer/features"
  );
  return mapEngineFeatureCatalog(features ?? []);
}

export async function fetchDeveloperFeatureRows(): Promise<AccessFeature[]> {
  const { features } = await engineAPI.get<{ features: EngineFeature[] }>(
    "/developer/features"
  );
  return (features ?? []).map(mapFeatureRow);
}

export async function fetchDeveloperPermissions(): Promise<AccessPermission[]> {
  const { permissions } = await engineAPI.get<{
    permissions: EnginePermission[];
  }>("/developer/permissions");
  return (permissions ?? []).map(mapPermissionRow);
}

export async function fetchDeveloperRoles(): Promise<AccessRole[]> {
  const { roles } = await engineAPI.get<{ roles: EngineRole[] }>(
    "/developer/roles"
  );
  return (roles ?? []).map(mapRole);
}

export async function createDeveloperRole(input: {
  name: string;
  description?: string;
  isGlobal?: boolean;
  scope?: string;
}) {
  const { role } = await engineAPI.post<{ role: EngineRole }>(
    "/developer/roles",
    input
  );
  return mapRole(role);
}

export async function updateDeveloperRole(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    isGlobal: boolean;
    scope: string;
  }>
) {
  const { role } = await engineAPI.patch<{ role: EngineRole }>(
    `/developer/roles/${numId(id)}`,
    input
  );
  return mapRole(role);
}

export async function destroyDeveloperRole(id: string) {
  await engineAPI.delete(`/developer/roles/${numId(id)}`);
}

export async function createDeveloperFeature(input: {
  key: string;
  label: string;
  description?: string;
  category?: string;
  sortOrder?: number;
}) {
  const { feature } = await engineAPI.post<{ feature: EngineFeature }>(
    "/developer/features",
    input
  );
  return mapFeatureRow(feature);
}

export async function updateDeveloperFeature(
  id: string,
  input: Partial<{
    key: string;
    label: string;
    description: string;
    category: string;
    sortOrder: number;
  }>
) {
  const { feature } = await engineAPI.patch<{ feature: EngineFeature }>(
    `/developer/features/${numId(id)}`,
    input
  );
  return mapFeatureRow(feature);
}

export async function destroyDeveloperFeature(id: string) {
  await engineAPI.delete(`/developer/features/${numId(id)}`);
}

export async function createDeveloperPermission(input: {
  key: string;
  label: string;
  description?: string;
  featureKey?: string | null;
  sortOrder?: number;
}) {
  const { permission } = await engineAPI.post<{ permission: EnginePermission }>(
    "/developer/permissions",
    input
  );
  return mapPermissionRow(permission);
}

export async function updateDeveloperPermission(
  id: string,
  input: Partial<{
    key: string;
    label: string;
    description: string;
    featureKey: string | null;
    sortOrder: number;
  }>
) {
  const { permission } = await engineAPI.patch<{
    permission: EnginePermission;
  }>(`/developer/permissions/${numId(id)}`, input);
  return mapPermissionRow(permission);
}

export async function destroyDeveloperPermission(id: string) {
  await engineAPI.delete(`/developer/permissions/${numId(id)}`);
}

export async function fetchDeveloperPackages(): Promise<ProductPackage[]> {
  const { packages } = await engineAPI.get<{ packages: EnginePackage[] }>(
    "/developer/packages"
  );
  return (packages ?? []).map(mapEnginePackage);
}

export type PackageInput = {
  name: string;
  description?: string;
  priceNote?: string;
  roles: AdminRole[];
  featureKeys: string[];
};

export async function createPackage(
  input: PackageInput,
  catalog: ProductFeature[]
) {
  const { featureKeys, permissionKeys } = splitPackageKeys(
    input.featureKeys,
    catalog
  );
  const { package: saved } = await engineAPI.post<{ package: EnginePackage }>(
    "/developer/packages",
    {
      name: input.name,
      description: input.description,
      priceNote: input.priceNote,
      roles: input.roles,
      featureKeys,
      permissionKeys
    }
  );
  return mapEnginePackage(saved);
}

export async function updatePackage(
  id: string,
  input: Partial<PackageInput>,
  catalog: ProductFeature[]
) {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.description !== undefined) body.description = input.description;
  if (input.priceNote !== undefined) body.priceNote = input.priceNote;
  if (input.roles !== undefined) body.roles = input.roles;
  if (input.featureKeys !== undefined) {
    const split = splitPackageKeys(input.featureKeys, catalog);
    body.featureKeys = split.featureKeys;
    body.permissionKeys = split.permissionKeys;
  }
  const { package: saved } = await engineAPI.patch<{ package: EnginePackage }>(
    `/developer/packages/${numId(id)}`,
    body
  );
  return mapEnginePackage(saved);
}

export async function destroyPackage(id: string) {
  await engineAPI.delete(`/developer/packages/${numId(id)}`);
}

export async function duplicatePackageOnEngine(id: string) {
  const { package: saved } = await engineAPI.post<{ package: EnginePackage }>(
    `/developer/packages/${numId(id)}/duplicate`
  );
  return mapEnginePackage(saved);
}

export type DeveloperAdminBundle = {
  users: AdminUser[];
  userPackages: UserPackage[];
};

export function mapAdminsToUsers(admins: EngineAdmin[]): DeveloperAdminBundle {
  const users: AdminUser[] = [];
  const userPackages: UserPackage[] = [];
  for (const admin of admins) {
    const mapped = mapEngineAdminToUser(admin);
    users.push(mapped.user);
    for (const pkg of admin.packages ?? []) {
      userPackages.push({
        id: uid("up"),
        userId: String(admin.id),
        packageId: String(pkg.id)
      });
    }
  }
  return { users, userPackages };
}

export async function fetchDeveloperAdmins(): Promise<DeveloperAdminBundle> {
  const { admins } = await engineAPI.get<{ admins: EngineAdmin[] }>(
    "/developer/admins"
  );
  return mapAdminsToUsers(admins ?? []);
}

export type AdminUpsertInput = {
  id?: string;
  name: string;
  email: string;
  password?: string;
  packageIds: string[];
  locationIds?: string[];
  hotelIds?: string[];
};

function packagesPayload(input: AdminUpsertInput) {
  return input.packageIds.map(packageId => ({
    packageId: numId(packageId),
    locationIds: (input.locationIds ?? []).map(numId),
    hotelIds: (input.hotelIds ?? []).map(numId)
  }));
}

export async function createDeveloperAdmin(
  input: AdminUpsertInput
): Promise<DeveloperAdminBundle> {
  const body: Record<string, unknown> = {
    name: input.name,
    email: input.email,
    packages: packagesPayload(input)
  };
  if (input.password) body.password = input.password;
  const { admin } = await engineAPI.post<{ admin: EngineAdmin }>(
    "/developer/admins",
    body
  );
  return mapAdminsToUsers([admin]);
}

export async function updateDeveloperAdmin(
  input: AdminUpsertInput & { id: string }
): Promise<DeveloperAdminBundle> {
  const body: Record<string, unknown> = {
    name: input.name,
    email: input.email,
    packages: packagesPayload(input)
  };
  if (input.password) body.password = input.password;
  const { admin } = await engineAPI.patch<{ admin: EngineAdmin }>(
    `/developer/admins/${numId(input.id)}`,
    body
  );
  return mapAdminsToUsers([admin]);
}

export async function destroyDeveloperAdmin(id: string) {
  await engineAPI.delete(`/developer/admins/${numId(id)}`);
}

export async function setDeveloperAdminPackages(
  adminId: string,
  packages: Array<{
    packageId: string;
    locationIds?: string[];
    hotelIds?: string[];
  }>
) {
  const { admin } = await engineAPI.put<{ admin: EngineAdmin }>(
    `/developer/admins/${numId(adminId)}/packages`,
    {
      packages: packages.map(p => ({
        packageId: numId(p.packageId),
        locationIds: (p.locationIds ?? []).map(numId),
        hotelIds: (p.hotelIds ?? []).map(numId)
      }))
    }
  );
  return mapAdminsToUsers([admin]);
}
