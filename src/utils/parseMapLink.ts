/**
 * Pull an official Google Maps embed iframe src from paste
 * (Share → Embed a map → copy HTML, or the embed URL itself).
 */
export function extractGoogleEmbedSrc(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  const iframeSrc = text.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  const candidate = (iframeSrc?.[1] ?? text).trim();

  try {
    const url = new URL(candidate);
    if (
      url.hostname === "www.google.com" &&
      url.pathname.startsWith("/maps/embed")
    ) {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export type MapCoords = { lat: number; lng: number };

function isValid(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function pair(a: string | undefined, b: string | undefined): MapCoords | null {
  if (a == null || b == null) return null;
  const lat = Number(a);
  const lng = Number(b);
  return isValid(lat, lng) ? { lat, lng } : null;
}

/** Normalize paste: bare URL, share link, or full &lt;iframe&gt; HTML. */
function normalizePaste(raw: string): string {
  const text = raw.trim();
  const iframeSrc = text.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeSrc?.[1]) return iframeSrc[1].trim();
  return text;
}

/**
 * Pull lat/lng from a Google Maps share/embed link, iframe HTML,
 * OpenStreetMap / Apple Maps URL, or plain "lat,lng".
 */
export function parseMapLink(raw: string): MapCoords | null {
  const text = normalizePaste(raw);
  if (!text) return null;

  // Plain "10.6104, 104.1814" or "10.6104 104.1814"
  const plain = text.match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  if (plain) return pair(plain[1], plain[2]);

  // Google embed pb=… often uses !2d{lng}!3d{lat}
  const embed2d3d = text.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/);
  if (embed2d3d) {
    const coords = pair(embed2d3d[2], embed2d3d[1]); // lat from 3d, lng from 2d
    if (coords) return coords;
  }

  // Place / marker style !3d{lat}!4d{lng}
  const bang34 = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (bang34) {
    const coords = pair(bang34[1], bang34[2]);
    if (coords) return coords;
  }

  let url: URL | null = null;
  try {
    url = new URL(text);
  } catch {
    // keep scanning patterns on the raw string
  }

  if (url) {
    const q = url.searchParams;

    const fromQuery =
      pair(q.get("mlat") ?? undefined, q.get("mlon") ?? undefined) ||
      pair(q.get("lat") ?? undefined, q.get("lng") ?? undefined) ||
      pair(q.get("lat") ?? undefined, q.get("lon") ?? undefined);
    if (fromQuery) return fromQuery;

    const ll = q.get("ll");
    if (ll) {
      const parts = ll.split(",");
      const fromLl = pair(parts[0], parts[1]);
      if (fromLl) return fromLl;
    }

    for (const key of ["q", "query", "destination"]) {
      const val = q.get(key);
      if (!val) continue;
      const m = val.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
      if (m) {
        const coords = pair(m[1], m[2]);
        if (coords) return coords;
      }
    }

    // /@lat,lng,zoom in path or full href
    const at = `${url.pathname}${url.hash}`.match(
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/
    );
    if (at) {
      const coords = pair(at[1], at[2]);
      if (coords) return coords;
    }

    const hash = url.hash.match(
      /map=\d+\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/
    );
    if (hash) {
      const coords = pair(hash[1], hash[2]);
      if (coords) return coords;
    }
  }

  // Last resort: first lat,lng pair in the string
  const anywhere = text.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (anywhere) return pair(anywhere[1], anywhere[2]);

  return null;
}
