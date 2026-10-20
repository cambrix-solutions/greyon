import { engineAPI } from "@/helpers/api";
import type { ContentStatus } from "@/types/greyon";

/**
 * Existing engine catalog entities.
 * Core fields always present; extras (sortOrder, hotelsCount, imageUrl,
 * price, currency) are optional and only set when the API returns them.
 */
export type CatalogService = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  status: ContentStatus;
  sortOrder?: number;
  hotelsCount?: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  status: ContentStatus;
  sortOrder?: number;
  hotelsCount?: number;
  imageUrl?: string;
  price?: number | null;
  currency?: string;
};

type EngineService = {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  status?: string;
  sortOrder?: number | null;
  hotelsCount?: number | null;
};

type EngineProduct = {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  status?: string;
  sortOrder?: number | null;
  hotelsCount?: number | null;
  imageUrl?: string | null;
  price?: number | null;
  currency?: string | null;
};

function asStatus(value: string | undefined): ContentStatus {
  if (value === "published" || value === "draft" || value === "archived") {
    return value;
  }
  return "draft";
}

function mapService(row: EngineService): CatalogService {
  const out: CatalogService = {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    icon: row.icon?.trim() || "spa",
    status: asStatus(row.status)
  };
  if (row.sortOrder !== undefined && row.sortOrder !== null) {
    out.sortOrder = Number(row.sortOrder) || 0;
  }
  if (row.hotelsCount !== undefined && row.hotelsCount !== null) {
    out.hotelsCount = Number(row.hotelsCount) || 0;
  }
  return out;
}

function mapProduct(row: EngineProduct): CatalogProduct {
  const out: CatalogProduct = {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    icon: row.icon?.trim() || "storefront",
    status: asStatus(row.status)
  };
  if (row.sortOrder !== undefined && row.sortOrder !== null) {
    out.sortOrder = Number(row.sortOrder) || 0;
  }
  if (row.hotelsCount !== undefined && row.hotelsCount !== null) {
    out.hotelsCount = Number(row.hotelsCount) || 0;
  }
  if (row.imageUrl != null && String(row.imageUrl).trim()) {
    out.imageUrl = String(row.imageUrl).trim();
  }
  if (row.price !== undefined) {
    out.price =
      row.price === null
        ? null
        : Number.isFinite(Number(row.price))
          ? Number(row.price)
          : null;
  }
  if (row.currency != null && String(row.currency).trim()) {
    out.currency = String(row.currency).toUpperCase().slice(0, 3);
  }
  return out;
}

function numId(id: string) {
  return Number(id);
}

/** Payload for create/update — core fields only. */
export type ServiceInput = {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  status?: ContentStatus;
};

export type ProductInput = {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  status?: ContentStatus;
};

export async function fetchAdminServices(): Promise<CatalogService[]> {
  const { services } = await engineAPI.get<{ services: EngineService[] }>(
    "/admin/services"
  );
  return (services ?? []).map(mapService);
}

export async function fetchAdminService(id: string): Promise<CatalogService> {
  const { service } = await engineAPI.get<{ service: EngineService }>(
    `/admin/services/${numId(id)}`
  );
  return mapService(service);
}

export async function createService(
  input: ServiceInput
): Promise<CatalogService> {
  const { service } = await engineAPI.post<{ service: EngineService }>(
    "/admin/services",
    input
  );
  return mapService(service);
}

export async function updateService(
  id: string,
  input: Partial<ServiceInput>
): Promise<CatalogService> {
  const { service } = await engineAPI.patch<{ service: EngineService }>(
    `/admin/services/${numId(id)}`,
    input
  );
  return mapService(service);
}

export async function destroyService(id: string): Promise<void> {
  await engineAPI.delete(`/admin/services/${numId(id)}`);
}

export async function fetchAdminProducts(): Promise<CatalogProduct[]> {
  const { products } = await engineAPI.get<{ products: EngineProduct[] }>(
    "/admin/products"
  );
  return (products ?? []).map(mapProduct);
}

export async function fetchAdminProduct(id: string): Promise<CatalogProduct> {
  const { product } = await engineAPI.get<{ product: EngineProduct }>(
    `/admin/products/${numId(id)}`
  );
  return mapProduct(product);
}

export async function createProduct(
  input: ProductInput
): Promise<CatalogProduct> {
  const { product } = await engineAPI.post<{ product: EngineProduct }>(
    "/admin/products",
    input
  );
  return mapProduct(product);
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<CatalogProduct> {
  const { product } = await engineAPI.patch<{ product: EngineProduct }>(
    `/admin/products/${numId(id)}`,
    input
  );
  return mapProduct(product);
}

export async function destroyProduct(id: string): Promise<void> {
  await engineAPI.delete(`/admin/products/${numId(id)}`);
}

export function mapHotelServiceRef(row: EngineService): CatalogService {
  return mapService(row);
}

export function mapHotelProductRef(row: EngineProduct): CatalogProduct {
  return mapProduct(row);
}

/** Sort catalog rows: optional sortOrder when present, else name. */
export function compareCatalogItems(
  a: { name: string; sortOrder?: number },
  b: { name: string; sortOrder?: number }
): number {
  const ao = a.sortOrder;
  const bo = b.sortOrder;
  if (ao !== undefined && bo !== undefined && ao !== bo) return ao - bo;
  if (ao !== undefined && bo === undefined) return -1;
  if (ao === undefined && bo !== undefined) return 1;
  return a.name.localeCompare(b.name);
}
