import { engineAPI, ApiError } from "@/helpers/api";

/**
 * Guest review shown on the marketing homepage carousel.
 *
 * Backend support is not shipped yet (see fetchPublicReviews). When the engine
 * adds a published reviews resource, map the response into this shape.
 */
export type GuestReview = {
  id: string;
  reviewerName: string;
  /** Integer 1–5 */
  rating: number;
  text: string;
  hotelName: string;
};

type EngineReview = {
  id?: string | number;
  reviewerName?: string | null;
  guestName?: string | null;
  name?: string | null;
  rating?: number | null;
  stars?: number | null;
  text?: string | null;
  body?: string | null;
  comment?: string | null;
  hotelName?: string | null;
  hotel?: { name?: string | null } | null;
  status?: string | null;
};

function clampRating(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const n = Math.round(value);
  if (n < 1 || n > 5) return null;
  return n;
}

function mapReview(row: EngineReview): GuestReview | null {
  const reviewerName = (
    row.reviewerName ||
    row.guestName ||
    row.name ||
    ""
  ).trim();
  const text = (row.text || row.body || row.comment || "").trim();
  const hotelName = (row.hotelName || row.hotel?.name || "").trim();
  const rating = clampRating(row.rating ?? row.stars);
  if (!reviewerName || !text || !hotelName || rating === null) return null;

  const status = (row.status || "published").toLowerCase();
  if (status && status !== "published" && status !== "approved") return null;

  return {
    id: String(row.id ?? `${reviewerName}-${hotelName}`),
    reviewerName,
    rating,
    text,
    hotelName
  };
}

/**
 * Published guest reviews for the homepage.
 *
 * Expected engine contract (not implemented yet):
 * - Model: GuestReview / Review (moderation status: draft | published)
 * - Public GET `/reviews` → `{ reviews: EngineReview[] }` (no `/api` prefix)
 * - Admin: create/edit/moderate + publish before appearing here
 *
 * Missing routes return an empty list (section stays hidden). Never fabricates
 * reviews. Errors are swallowed into [] so the UI never shows raw failures.
 */
export async function fetchPublicReviews(): Promise<GuestReview[]> {
  try {
    const payload = await engineAPI.get<{
      reviews?: EngineReview[];
      data?: EngineReview[];
    }>("/reviews");
    const rows = payload.reviews ?? payload.data ?? [];
    return rows.map(mapReview).filter((r): r is GuestReview => r !== null);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 501)) {
      return [];
    }
    return [];
  }
}
