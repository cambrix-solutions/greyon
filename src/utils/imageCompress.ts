/** Client-side image prep before admin upload: type check, size cap, optional downscale. */

export const ACCEPT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
] as const;

export const ACCEPT_IMAGE_ATTR =
  "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const DEFAULT_LONG_EDGE = 2000;

const TYPE_LABEL = "JPG, PNG, or WebP";

export function isAcceptedImageType(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  if ((ACCEPT_IMAGE_TYPES as readonly string[]).includes(type)) return true;
  // Some browsers omit type — fall back to extension.
  const name = file.name.toLowerCase();
  return /\.(jpe?g|png|webp)$/.test(name);
}

export function validateImageFile(
  file: File,
  maxBytes = MAX_UPLOAD_BYTES
): string | null {
  if (!isAcceptedImageType(file)) {
    return `Please choose a ${TYPE_LABEL} image.`;
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return `Image is too large (max ${mb} MB).`;
  }
  return null;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image. Try another file."));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error("Could not compress that image."));
      },
      type,
      quality
    );
  });
}

/**
 * Downscale to `longEdge` max and encode as WebP (or JPEG fallback).
 * Skips work when the file is already small enough and within bounds.
 */
export async function prepareImageForUpload(
  file: File,
  options: { longEdge?: number | undefined; quality?: number | undefined } = {}
): Promise<File> {
  const longEdge = options.longEdge ?? DEFAULT_LONG_EDGE;
  const quality = options.quality ?? 0.85;

  const img = await loadImage(file);
  const maxDim = Math.max(img.naturalWidth, img.naturalHeight);
  const needsScale = maxDim > longEdge;

  // Prefer webp when the browser can encode it; otherwise jpeg.
  const preferWebp =
    typeof HTMLCanvasElement !== "undefined" &&
    document
      .createElement("canvas")
      .toDataURL("image/webp")
      .startsWith("data:image/webp");

  const outType = preferWebp ? "image/webp" : "image/jpeg";
  const ext = preferWebp ? "webp" : "jpg";

  if (!needsScale && file.type === outType && file.size <= 1_500_000) {
    return file;
  }

  const scale = needsScale ? longEdge / maxDim : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare that image.");
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, outType, quality);
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.${ext}`, {
    type: outType,
    lastModified: Date.now()
  });
}

/** Equirectangular photos need a longer edge than a gallery still. */
export const PANORAMA_LONG_EDGE = 4096;
/** Engine limit for multipart field `panorama`. */
export const PANORAMA_MAX_BYTES = 15 * 1024 * 1024;
export const PANORAMA_ACCEPT_ATTR = "image/jpeg,image/webp,.jpg,.jpeg,.webp";

function isPanoramaFile(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  if (type === "image/jpeg" || type === "image/webp") return true;
  if (type === "image/png") return false;
  return /\.(jpe?g|webp)$/i.test(file.name);
}

/** JPG or WebP, at most 15 MB — the engine rejects anything else. */
export function validatePanoramaFile(file: File): string | null {
  if (!isPanoramaFile(file)) return "Use a JPG or WebP 360° photo.";
  if (file.size > PANORAMA_MAX_BYTES) {
    return "That 360° photo is too large (max 15 MB).";
  }
  return null;
}

/**
 * JPG/WebP only, 15 MB cap, 4096px long edge so a 360° photo stays usable.
 * Returns a file ready for the multipart `panorama` part.
 */
export async function preparePanoramaFile(file: File): Promise<File> {
  const validation = validatePanoramaFile(file);
  if (validation) throw new Error(validation);
  const prepared = await prepareImageForUpload(file, {
    longEdge: PANORAMA_LONG_EDGE,
    quality: 0.86
  });
  if (!isPanoramaFile(prepared) || prepared.size > PANORAMA_MAX_BYTES) {
    throw new Error("That 360° photo is too large (max 15 MB).");
  }
  return prepared;
}
