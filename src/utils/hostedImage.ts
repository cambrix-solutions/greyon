const STOCK_HOST =
  /(?:images\.unsplash\.com|plus\.unsplash\.com|images\.pexels\.com|picsum\.photos|placehold\.co|via\.placeholder\.com)/i;

/** Keep uploaded catalog photos. Drop empty strings and stock hosts. */
export function hostedImage(src: string | null | undefined): string {
  const value = src?.trim() ?? "";
  if (!value || STOCK_HOST.test(value)) return "";
  return value;
}
