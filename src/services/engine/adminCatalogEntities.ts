import { engineAPI } from "@/helpers/api";
import type { ContentStatus } from "@/types/greyon";

export type CatalogService = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  status: ContentStatus;
  hotelsCount: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  imageUrl: string;
  price: number | null;
  currency: string;
  sortOrder: number;
  status: ContentStatus;
  hotelsCount: number;
};

type EngineService = {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number | null;
  status?: string;
  hotelsCount?: number | null;
};

type EngineProduct = {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  currency?: string | null;
  sortOrder?: number | null;
  status?: string;
  hotelsCount?: number | null;
};

function asStatus(value: string | undefined): ContentStatus {
  if (value === "published" || value === "draft" || value === "archived") {
    return value;
  }
  return "draft";
}

function mapService(row: EngineService): CatalogService {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    icon: row.icon?.trim() || "spa",
    sortOrder: Number(row.sortOrder ?? 0) || 0,
    status: asStatus(row.status),
    hotelsCount: Number(row.hotelsCount ?? 0) || 0
  };
}

function mapProduct(row: EngineProduct): CatalogProduct {
  const price =
    row.price === null || row.price === undefined
      ? null
      : Number.isFinite(Number(row.price))
        ? Number(row.price)
        : null;
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    icon: row.icon?.trim() || "storefront",
    imageUrl: row.imageUrl ?? "",
    price,
    currency: (row.currency ?? "USD").toUpperCase().slice(0, 3) || "USD",
    sortOrder: Number(row.sortOrder ?? 0) || 0,
    status: asStatus(row.status),
    hotelsCount: Number(row.hotelsCount ?? 0) || 0
  };
}

function numId(id: string) {
  return Number(id);
}

function qs(params: { status?: string; q?: string }) {
  const search = new URLSearchParams();
  if (params.status && params.status !== "all") {
    search.set("status", params.status);
  }
  if (params.q?.trim()) search.set("q", params.q.trim());
  const s = search.toString();
  return s ? `?${s}` : "";
}

export type ServiceInput = {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  status?: ContentStatus;
};

export type ProductInput = {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  price?: number | null;
  currency?: string;
  sortOrder?: number;
  status?: ContentStatus;
};

export async function fetchAdminServices(
  params: {
    status?: string;
    q?: string;
  } = {}
): Promise<CatalogService[]> {
  const { services } = await engineAPI.get<{ services: EngineService[] }>(
    `/admin/services${qs(params)}`
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

export async function fetchAdminProducts(
  params: {
    status?: string;
    q?: string;
  } = {}
): Promise<CatalogProduct[]> {
  const { products } = await engineAPI.get<{ products: EngineProduct[] }>(
    `/admin/products${qs(params)}`
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

/** Re-export mappers for hotel nested payloads (admin + public). */
export function mapHotelServiceRef(row: EngineService): CatalogService {
  return mapService(row);
}

export function mapHotelProductRef(row: EngineProduct): CatalogProduct {
  return mapProduct(row);
}
