import { engineAPI } from "@/helpers/api";
import { ApiError } from "@/helpers/api/createApiClient";

export type HeroSlideStatus = "active" | "scheduled" | "hidden";

export type AdminHeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  imagePath: string;
  ctaLabel: string;
  ctaUrl: string;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicHeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaLabel: string;
  ctaUrl: string;
  sortOrder: number;
};

export type HeroSlideInput = {
  title: string;
  subtitle: string;
  image: string;
  ctaLabel: string;
  ctaUrl: string;
  sortOrder?: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

type EngineHeroSlide = {
  id?: number | string;
  title?: string | null;
  subtitle?: string | null;
  image?: string | null;
  imagePath?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function text(value: string | null | undefined) {
  return (value ?? "").trim();
}

export function mapAdminHeroSlide(row: EngineHeroSlide): AdminHeroSlide {
  return {
    id: String(row.id ?? ""),
    title: text(row.title),
    subtitle: text(row.subtitle),
    image: text(row.image),
    imagePath: text(row.imagePath),
    ctaLabel: text(row.ctaLabel),
    ctaUrl: text(row.ctaUrl),
    sortOrder: Number(row.sortOrder ?? 0),
    isActive: row.isActive !== false,
    startsAt: row.startsAt ?? null,
    endsAt: row.endsAt ?? null,
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? ""
  };
}

export function mapPublicHeroSlide(row: EngineHeroSlide): PublicHeroSlide {
  return {
    id: String(row.id ?? ""),
    title: text(row.title),
    subtitle: text(row.subtitle),
    image: text(row.image),
    ctaLabel: text(row.ctaLabel),
    ctaUrl: text(row.ctaUrl),
    sortOrder: Number(row.sortOrder ?? 0)
  };
}

/** URL suitable for an <img>. Paths stay as returned; absolute URLs pass through. */
export function heroSlidePreviewSrc(slide: {
  image: string;
  imagePath?: string;
}): string {
  const image = slide.image.trim();
  const path = slide.imagePath?.trim() ?? "";
  if (/^(https?:|data:|blob:)/i.test(image) || image.startsWith("/")) {
    return image;
  }
  if (/^(https?:|data:|blob:)/i.test(path) || path.startsWith("/")) return path;
  return image || path;
}

export function heroSlideStatus(
  slide: Pick<AdminHeroSlide, "isActive" | "startsAt" | "endsAt">,
  now = new Date()
): HeroSlideStatus {
  if (!slide.isActive) return "hidden";
  const start = slide.startsAt ? new Date(slide.startsAt) : null;
  const end = slide.endsAt ? new Date(slide.endsAt) : null;
  if (
    start &&
    !Number.isNaN(start.getTime()) &&
    start.getTime() > now.getTime()
  ) {
    return "scheduled";
  }
  if (end && !Number.isNaN(end.getTime()) && end.getTime() < now.getTime()) {
    return "hidden";
  }
  return "active";
}

export function fieldErrorsFromApi(error: unknown): Record<string, string> {
  if (
    !(error instanceof ApiError) ||
    !error.body ||
    typeof error.body !== "object"
  ) {
    return {};
  }
  const errors = (error.body as { errors?: Record<string, unknown> }).errors;
  if (!errors || typeof errors !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    const first = Array.isArray(value)
      ? value.find(m => typeof m === "string")
      : "";
    if (typeof first === "string" && first.trim()) out[key] = first.trim();
  }
  return out;
}

export function friendlyHeroSlidesError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 403) {
    return "You don’t have permission to manage hero slides.";
  }
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export async function fetchAdminHeroSlides(): Promise<AdminHeroSlide[]> {
  const { heroSlides } = await engineAPI.get<{ heroSlides: EngineHeroSlide[] }>(
    "/admin/hero-slides"
  );
  return (heroSlides ?? [])
    .map(mapAdminHeroSlide)
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)
    );
}

export async function createAdminHeroSlide(input: HeroSlideInput) {
  const { heroSlide } = await engineAPI.post<{ heroSlide: EngineHeroSlide }>(
    "/admin/hero-slides",
    input
  );
  return mapAdminHeroSlide(heroSlide);
}

export async function updateAdminHeroSlide(
  id: string,
  input: Partial<HeroSlideInput>
) {
  const { heroSlide } = await engineAPI.patch<{ heroSlide: EngineHeroSlide }>(
    `/admin/hero-slides/${encodeURIComponent(id)}`,
    input
  );
  return mapAdminHeroSlide(heroSlide);
}

export async function destroyAdminHeroSlide(id: string) {
  await engineAPI.delete(`/admin/hero-slides/${encodeURIComponent(id)}`);
}

export async function reorderAdminHeroSlides(ids: string[]) {
  await engineAPI.post("/admin/hero-slides/reorder", { ids });
}

/**
 * Public homepage slides. `null` means the endpoint is not deployed (404)
 * and the caller should keep the settings fallback.
 */
export async function fetchPublicHeroSlides(): Promise<
  PublicHeroSlide[] | null
> {
  try {
    const { heroSlides } = await engineAPI.get<{
      heroSlides: EngineHeroSlide[];
    }>("/hero-slides");
    return (heroSlides ?? [])
      .map(mapPublicHeroSlide)
      .filter(slide => slide.image)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
