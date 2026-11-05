import type { NewsArticle } from "@/types/greyon";

const BODY_LIMIT = 160;

function plainText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const space = cut.lastIndexOf(" ");
  const base = (space > 40 ? cut.slice(0, space) : cut).trim();
  return `${base}…`;
}

/**
 * Short card copy from fields the engine actually sends.
 * Order: excerpt, summary, SEO description, then a truncated body.
 */
export function newsPreviewText(
  article: Pick<
    NewsArticle,
    "excerpt" | "summary" | "seoDescription" | "body"
  > | null
): string {
  if (!article) return "";
  const direct = [article.excerpt, article.summary, article.seoDescription]
    .map(value => value?.trim() ?? "")
    .find(Boolean);
  if (direct) return direct;
  const body = plainText(article.body ?? "");
  if (!body) return "";
  return truncate(body, BODY_LIMIT);
}

/**
 * Tags only when the engine sent a tags list.
 * Otherwise the destination name, when the article has one — not invented labels.
 */
export function newsPreviewTags(
  article: Pick<NewsArticle, "tags" | "locationName"> | null
): string[] {
  if (!article) return [];
  const tags = (article.tags ?? []).map(tag => tag.trim()).filter(Boolean);
  if (tags.length) return tags.slice(0, 4);
  const place = article.locationName?.trim();
  return place ? [place] : [];
}
