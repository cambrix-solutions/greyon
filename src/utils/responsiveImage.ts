const WIDTH_CDN =
  /(?:images\.unsplash\.com|plus\.unsplash\.com|images\.pexels\.com)/i;

/**
 * srcset for hosts that already serve the same photo at many widths.
 * Storage uploads are a single file, so they stay on `src` alone.
 */
export function imageSrcset(
  src: string | null | undefined
): string | undefined {
  const value = src?.trim() ?? "";
  if (!value || !WIDTH_CDN.test(value)) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  const widths = [480, 800, 1200, 1600];
  return widths
    .map(width => {
      const next = new URL(url.href);
      next.searchParams.set("auto", "format");
      next.searchParams.set("fit", "crop");
      next.searchParams.set("q", "75");
      next.searchParams.set("w", String(width));
      return `${next.href} ${width}w`;
    })
    .join(", ");
}

export const CARD_IMAGE_SIZES = "(max-width: 700px) 100vw, 42vw";
